import prisma from "../prisma/client.js";
import { MarketDataService } from "./marketDataService.js";
import { getErrorMessage } from "../utils/utils.js";
import {
  AddToWatchlistRequest,
  WatchlistItem,
  TradingServiceResponse,
  LiveStockPrice,
} from "../types/trading.js";

export class WatchlistService {
  private static instance: WatchlistService;
  private marketDataService: MarketDataService;

  private constructor() {
    this.marketDataService = MarketDataService.getInstance();
  }

  public static getInstance(): WatchlistService {
    if (!WatchlistService.instance) {
      WatchlistService.instance = new WatchlistService();
    }
    return WatchlistService.instance;
  }

  /**
   * Add stock to watchlist
   */
  public async addToWatchlist(
    userId: string,
    request: AddToWatchlistRequest
  ): Promise<TradingServiceResponse<WatchlistItem>> {
    try {
      console.log(`⭐ Adding to watchlist for user ${userId}:`, request);

      // Check if already in watchlist
      const existing = await prisma.watchlist.findUnique({
        where: {
          userId_stockSymbol_exchange: {
            userId,
            stockSymbol: request.stockSymbol,
            exchange: request.exchange,
          },
        },
      });

      if (existing) {
        return {
          success: false,
          error: {
            code: "ALREADY_IN_WATCHLIST",
            message: "Stock is already in your watchlist",
          },
        };
      }

      const watchlistItem = await prisma.watchlist.create({
        data: {
          userId,
          stockSymbol: request.stockSymbol,
          stockName: request.stockName,
          exchange: request.exchange,
          isin: request.isin ?? null,
          addedAt: new Date(),
        },
      });

      console.log(`✅ Added ${request.stockSymbol} to watchlist successfully`);

      return {
        success: true,
        data: this.formatWatchlistItem(watchlistItem),
        message: `${request.stockSymbol} added to watchlist`,
      };
    } catch (error) {
      console.error("❌ Error adding to watchlist:", getErrorMessage(error));
      return {
        success: false,
        error: {
          code: "WATCHLIST_ADD_ERROR",
          message: "Failed to add stock to watchlist",
          details: getErrorMessage(error),
        },
      };
    }
  }

  /**
   * Remove stock from watchlist
   */
  public async removeFromWatchlist(
    userId: string,
    stockSymbol: string,
    exchange: string
  ): Promise<TradingServiceResponse<void>> {
    try {
      console.log(`🗑️ Removing from watchlist: ${stockSymbol} (${exchange})`);

      const deleted = await prisma.watchlist.delete({
        where: {
          userId_stockSymbol_exchange: {
            userId,
            stockSymbol,
            exchange,
          },
        },
      });

      if (!deleted) {
        return {
          success: false,
          error: {
            code: "NOT_IN_WATCHLIST",
            message: "Stock not found in your watchlist",
          },
        };
      }

      console.log(`✅ Removed ${stockSymbol} from watchlist successfully`);

      return {
        success: true,
        message: `${stockSymbol} removed from watchlist`,
      };
    } catch (error) {
      console.error(
        "❌ Error removing from watchlist:",
        getErrorMessage(error)
      );

      // Check if it's a "not found" error
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2025"
      ) {
        return {
          success: false,
          error: {
            code: "NOT_IN_WATCHLIST",
            message: "Stock not found in your watchlist",
          },
        };
      }

      return {
        success: false,
        error: {
          code: "WATCHLIST_REMOVE_ERROR",
          message: "Failed to remove stock from watchlist",
          details: getErrorMessage(error),
        },
      };
    }
  }

  /**
   * Get user's watchlist with live prices
   */
  public async getWatchlist(
    userId: string
  ): Promise<TradingServiceResponse<WatchlistItem[]>> {
    try {
      const watchlistItems = await prisma.watchlist.findMany({
        where: { userId },
        orderBy: { addedAt: "desc" },
      });

      if (watchlistItems.length === 0) {
        return {
          success: true,
          data: [],
          message: "Your watchlist is empty",
        };
      }

      // Get live prices for all watchlist items
      const stocks = watchlistItems.map((item) => ({
        symbol: item.stockSymbol,
        exchange: item.exchange,
      }));

      const livePrices = await this.marketDataService.getLivePrices(stocks);
      const priceMap = new Map<string, LiveStockPrice>();
      livePrices.forEach((price) => {
        priceMap.set(`${price.symbol}_${price.exchange}`, price);
      });

      // Enhance watchlist items with live prices
      const enhancedItems = watchlistItems.map((item) => {
        const key = `${item.stockSymbol}_${item.exchange}`;
        const livePrice = priceMap.get(key);

        const formattedItem = this.formatWatchlistItem(item);

        // Add live price data if available
        if (livePrice) {
          (formattedItem as any).livePrice = {
            ltp: livePrice.ltp,
            change: livePrice.change,
            changePercent: livePrice.changePercent,
            lastUpdated: livePrice.lastFetched,
          };
        }

        return formattedItem;
      });

      return {
        success: true,
        data: enhancedItems,
      };
    } catch (error) {
      console.error("❌ Error getting watchlist:", getErrorMessage(error));
      return {
        success: false,
        error: {
          code: "WATCHLIST_GET_ERROR",
          message: "Failed to get watchlist",
          details: getErrorMessage(error),
        },
      };
    }
  }

  /**
   * Check if stock is in user's watchlist
   */
  public async isInWatchlist(
    userId: string,
    stockSymbol: string,
    exchange: string
  ): Promise<boolean> {
    try {
      const item = await prisma.watchlist.findUnique({
        where: {
          userId_stockSymbol_exchange: {
            userId,
            stockSymbol,
            exchange,
          },
        },
      });

      return !!item;
    } catch (error) {
      console.error("❌ Error checking watchlist:", getErrorMessage(error));
      return false;
    }
  }

  /**
   * Get watchlist count for user
   */
  public async getWatchlistCount(userId: string): Promise<number> {
    try {
      return await prisma.watchlist.count({
        where: { userId },
      });
    } catch (error) {
      console.error(
        "❌ Error getting watchlist count:",
        getErrorMessage(error)
      );
      return 0;
    }
  }

  /**
   * Clear entire watchlist
   */
  public async clearWatchlist(
    userId: string
  ): Promise<TradingServiceResponse<void>> {
    try {
      console.log(`🧹 Clearing watchlist for user: ${userId}`);

      const result = await prisma.watchlist.deleteMany({
        where: { userId },
      });

      console.log(`✅ Cleared ${result.count} items from watchlist`);

      return {
        success: true,
        message: `Cleared ${result.count} items from watchlist`,
      };
    } catch (error) {
      console.error("❌ Error clearing watchlist:", getErrorMessage(error));
      return {
        success: false,
        error: {
          code: "WATCHLIST_CLEAR_ERROR",
          message: "Failed to clear watchlist",
          details: getErrorMessage(error),
        },
      };
    }
  }

  // ========================
  // Private Helper Methods
  // ========================

  private formatWatchlistItem(item: any): WatchlistItem {
    return {
      id: item.id,
      userId: item.userId,
      stockSymbol: item.stockSymbol,
      stockName: item.stockName,
      exchange: item.exchange,
      isin: item.isin,
      addedAt: item.addedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
