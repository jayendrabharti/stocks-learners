import prisma from "../prisma/client.js";
import axios from "axios";
import { getErrorMessage } from "../utils/utils.js";
import {
  LiveStockPrice,
  MarketSessionInfo,
  StockQuote,
} from "../types/trading.js";

export class MarketDataService {
  private static instance: MarketDataService;
  private readonly GROWW_BASE_URL = "https://groww.in/v1/api/stocks_data/v1";
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes for live prices

  private constructor() {}

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  /**
   * Get live stock price from Groww API or cache
   */
  public async getLivePrice(
    symbol: string,
    exchange: string
  ): Promise<LiveStockPrice | null> {
    try {
      // First check cache
      const cachedPrice = await this.getCachedPrice(symbol, exchange);
      if (
        cachedPrice?.lastFetched &&
        this.isCacheValid(cachedPrice.lastFetched)
      ) {
        return cachedPrice;
      }

      // Fetch from Groww API
      const livePrice = await this.fetchLivePriceFromGroww(symbol, exchange);
      if (livePrice) {
        // Update cache
        await this.updatePriceCache(livePrice);
        return livePrice;
      }

      return cachedPrice; // Return stale cache if API fails
    } catch (error) {
      console.error("❌ Error getting live price:", getErrorMessage(error));

      // Fallback to cached data
      const cachedPrice = await this.getCachedPrice(symbol, exchange);
      return cachedPrice;
    }
  }

  /**
   * Get live prices for multiple stocks
   */
  public async getLivePrices(
    stocks: { symbol: string; exchange: string }[]
  ): Promise<LiveStockPrice[]> {
    const promises = stocks.map((stock) =>
      this.getLivePrice(stock.symbol, stock.exchange)
    );

    const results = await Promise.allSettled(promises);
    return results
      .filter(
        (result): result is PromiseFulfilledResult<LiveStockPrice> =>
          result.status === "fulfilled" && result.value !== null
      )
      .map((result) => result.value);
  }

  /**
   * Get enhanced stock quote with metadata
   */
  public async getStockQuote(
    symbol: string,
    exchange: string
  ): Promise<StockQuote | null> {
    try {
      const [livePrice, metadata] = await Promise.all([
        this.getLivePrice(symbol, exchange),
        this.getStockMetadata(symbol, exchange),
      ]);

      if (!livePrice) {
        return null;
      }

      return {
        symbol: livePrice.symbol,
        name: metadata?.companyName || symbol,
        exchange: livePrice.exchange,
        companyName: metadata?.companyName || symbol,
        updatedAt: livePrice.lastFetched || new Date(),
        ...(metadata?.isin && { isin: metadata.isin }),
        ...(metadata?.industry && { industry: metadata.industry }),
        ...(metadata?.sector && { sector: metadata.sector }),
        ...(livePrice.marketCap && { marketCap: livePrice.marketCap }),
      };
    } catch (error) {
      console.error("❌ Error getting stock quote:", getErrorMessage(error));
      return null;
    }
  }

  /**
   * Check if market is currently open
   */
  public async isMarketOpen(exchange: string): Promise<MarketSessionInfo> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const session = await prisma.marketSession.findUnique({
        where: {
          exchange_date: {
            exchange,
            date: new Date(today + "T00:00:00.000Z"),
          },
        },
      });

      if (session && session.isHoliday) {
        return {
          exchange,
          isOpen: false,
          isHoliday: true,
          currentSession: "CLOSED",
          ...(session.holidayReason && {
            holidayReason: session.holidayReason,
          }),
        };
      }

      // Check current time against trading hours
      const now = new Date();
      const currentTime = now.toTimeString().substring(0, 5); // HH:mm format

      const regularStart = session?.regularStart || "09:15";
      const regularEnd = session?.regularEnd || "15:30";
      const preMarketStart = session?.preMarketStart || "09:00";
      const postMarketEnd = session?.postMarketEnd || "16:00";

      let currentSession:
        | "PRE_MARKET"
        | "MARKET_HOURS"
        | "POST_MARKET"
        | "CLOSED" = "CLOSED";
      let isOpen = false;

      if (currentTime >= preMarketStart && currentTime < regularStart) {
        currentSession = "PRE_MARKET";
        isOpen = true;
      } else if (currentTime >= regularStart && currentTime < regularEnd) {
        currentSession = "MARKET_HOURS";
        isOpen = true;
      } else if (currentTime >= regularEnd && currentTime < postMarketEnd) {
        currentSession = "POST_MARKET";
        isOpen = true;
      }

      const nextSessionTime = this.getNextSessionTime(currentTime, session);
      return {
        exchange,
        isOpen,
        isHoliday: false,
        currentSession,
        ...(nextSessionTime && { nextSessionTime }),
      };
    } catch (error) {
      console.error("❌ Error checking market status:", getErrorMessage(error));

      // Default fallback - assume market is closed
      return {
        exchange,
        isOpen: false,
        isHoliday: false,
        currentSession: "CLOSED",
      };
    }
  }

  /**
   * Update portfolio holdings with latest prices
   */
  public async updatePortfolioPrices(userId: string): Promise<void> {
    try {
      const holdings = await prisma.portfolio.findMany({
        where: { userId },
        select: {
          id: true,
          stockSymbol: true,
          exchange: true,
          quantity: true,
          averagePrice: true,
        },
      });

      if (holdings.length === 0) {
        return;
      }

      // Get live prices for all holdings
      const stocks = holdings.map((h) => ({
        symbol: h.stockSymbol,
        exchange: h.exchange,
      }));
      const livePrices = await this.getLivePrices(stocks);

      // Create a map for quick lookup
      const priceMap = new Map<string, LiveStockPrice>();
      livePrices.forEach((price) => {
        priceMap.set(`${price.symbol}_${price.exchange}`, price);
      });

      // Update each holding
      const updatePromises = holdings.map((holding) => {
        const key = `${holding.stockSymbol}_${holding.exchange}`;
        const livePrice = priceMap.get(key);

        if (livePrice) {
          const currentValue = Number(livePrice.ltp) * holding.quantity;
          const totalInvested = Number(holding.averagePrice) * holding.quantity;
          const unrealizedPnL = currentValue - totalInvested;
          const unrealizedPnLPerc =
            totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

          return prisma.portfolio.update({
            where: { id: holding.id },
            data: {
              currentPrice: livePrice.ltp,
              currentValue: currentValue,
              unrealizedPnL: unrealizedPnL,
              unrealizedPnLPerc: unrealizedPnLPerc,
              dayChange: livePrice.change,
              dayChangePercent: livePrice.changePercent,
              lastPriceUpdate: new Date(),
            },
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      // Update wallet summary
      await this.updateWalletSummary(userId);

      console.log(
        `✅ Updated prices for ${holdings.length} holdings for user ${userId}`
      );
    } catch (error) {
      console.error(
        "❌ Error updating portfolio prices:",
        getErrorMessage(error)
      );
      throw error;
    }
  }

  // ========================
  // Private Helper Methods
  // ========================

  private async getCachedPrice(
    symbol: string,
    exchange: string
  ): Promise<LiveStockPrice | null> {
    try {
      const cached = await prisma.stockPrice.findUnique({
        where: {
          symbol_exchange: {
            symbol,
            exchange,
          },
        },
      });

      if (cached) {
        return {
          symbol: cached.symbol,
          exchange: cached.exchange,
          ltp: Number(cached.ltp),
          open: Number(cached.open),
          high: Number(cached.high),
          low: Number(cached.low),
          prevClose: Number(cached.previousClose),
          change: Number(cached.change),
          changePercent: cached.changePercent,
          timestamp: cached.lastFetched || cached.createdAt,
          ...(cached.previousClose && {
            previousClose: Number(cached.previousClose),
          }),
          ...(cached.volume && { volume: Number(cached.volume) }),
          ...(cached.marketCap && { marketCap: Number(cached.marketCap) }),
          ...(cached.lastFetched && { lastFetched: cached.lastFetched }),
        };
      }

      return null;
    } catch (error) {
      console.error("❌ Error getting cached price:", getErrorMessage(error));
      return null;
    }
  }

  private isCacheValid(lastFetched: Date): boolean {
    const now = new Date();
    return now.getTime() - lastFetched.getTime() < this.CACHE_DURATION_MS;
  }

  private async fetchLivePriceFromGroww(
    symbol: string,
    exchange: string
  ): Promise<LiveStockPrice | null> {
    try {
      // This is a simplified version - you'll need to integrate with actual Groww API
      // For now, using mock data structure
      const response = await axios.get(
        `${this.GROWW_BASE_URL}/live_prices/${exchange}/${symbol}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );

      const data = response.data;

      return {
        symbol,
        exchange,
        ltp: Number(data.ltp || 0),
        open: Number(data.open || 0),
        high: Number(data.high || 0),
        low: Number(data.low || 0),
        prevClose: Number(data.close || data.previousClose || 0),
        change: Number(data.change || 0),
        changePercent: Number(data.pChange || data.changePercent || 0),
        timestamp: new Date(),
        ...(data.volume && { volume: Number(data.volume) }),
        ...(data.value && { value: Number(data.value) }),
        ...(data.previousClose && {
          previousClose: Number(data.previousClose),
        }),
        ...(data.marketCap && { marketCap: Number(data.marketCap) }),
        lastFetched: new Date(),
      };
    } catch (error) {
      console.error(
        `❌ Error fetching live price for ${symbol}:`,
        getErrorMessage(error)
      );
      return null;
    }
  }

  private async updatePriceCache(price: LiveStockPrice): Promise<void> {
    try {
      await prisma.stockPrice.upsert({
        where: {
          symbol_exchange: {
            symbol: price.symbol,
            exchange: price.exchange,
          },
        },
        update: {
          ltp: price.ltp,
          open: price.open,
          high: price.high,
          low: price.low,
          previousClose: price.previousClose ?? price.ltp,
          change: price.change,
          changePercent: price.changePercent,
          volume: price.volume ?? null,
          marketCap: price.marketCap ?? null,
          lastFetched: price.lastFetched || new Date(),
          updatedAt: new Date(),
        },
        create: {
          symbol: price.symbol,
          name: price.symbol, // Will be updated with actual name later
          exchange: price.exchange,
          ltp: price.ltp,
          open: price.open,
          high: price.high,
          low: price.low,
          previousClose: price.previousClose ?? price.ltp,
          change: price.change,
          changePercent: price.changePercent,
          volume: price.volume ?? null,
          marketCap: price.marketCap ?? null,
          lastFetched: price.lastFetched || new Date(),
        },
      });
    } catch (error) {
      console.error("❌ Error updating price cache:", getErrorMessage(error));
    }
  }

  private async getStockMetadata(symbol: string, exchange: string) {
    try {
      return await prisma.stockMetadata.findUnique({
        where: {
          symbol_exchange: {
            symbol,
            exchange,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error getting stock metadata:", getErrorMessage(error));
      return null;
    }
  }

  private async updateWalletSummary(userId: string): Promise<void> {
    try {
      const holdings = await prisma.portfolio.findMany({
        where: { userId },
      });

      const totalInvested = holdings.reduce(
        (sum, h) => sum + Number(h.totalInvested),
        0
      );
      const currentValue = holdings.reduce(
        (sum, h) => sum + Number(h.currentValue),
        0
      );
      const totalPnL = currentValue - totalInvested;
      const totalPnLPercent =
        totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
      const dayPnL = holdings.reduce(
        (sum, h) => sum + Number(h.dayChange) * h.quantity,
        0
      );
      const dayPnLPercent =
        currentValue > 0 ? (dayPnL / currentValue) * 100 : 0;

      await prisma.wallet.update({
        where: { userId },
        data: {
          totalInvested,
          currentValue,
          totalPnL,
          totalPnLPercent,
          dayPnL,
          dayPnLPercent,
          lastUpdatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(
        "❌ Error updating wallet summary:",
        getErrorMessage(error)
      );
    }
  }

  private getNextSessionTime(
    _currentTime: string,
    _session: any
  ): Date | undefined {
    // Logic to calculate next session opening time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 15, 0, 0); // Default to 9:15 AM next day
    return tomorrow;
  }
}
