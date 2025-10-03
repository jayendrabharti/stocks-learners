"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getPortfolio,
  PortfolioHolding,
  PortfolioResponse,
} from "@/services/tradingApi";
import { useSession } from "./SessionProvider";
import ApiClient from "@/utils/ApiClient";
import {
  marketApi,
  MarketTimingResponse,
  isMarketOpen,
} from "@/services/marketApi";

// Extended holding with live price data
interface HoldingWithLivePrice extends PortfolioHolding {
  livePrice?: number;
  livePnL?: number;
  livePnLPercent?: number;
  liveCurrentValue?: number;
}

interface PortfolioContextType {
  // Holdings data
  allHoldings: HoldingWithLivePrice[];
  cncHoldings: HoldingWithLivePrice[];
  misHoldings: HoldingWithLivePrice[];

  // Summary data
  summary: PortfolioResponse["summary"];
  warnings: PortfolioResponse["warnings"];

  // Market timing
  marketTiming: MarketTimingResponse | null;
  isMarketOpen: boolean;
  lastUpdated: Date | null;

  // Loading states
  loading: boolean;
  refreshing: boolean;

  // Actions
  refreshPortfolio: () => Promise<void>;

  // Computed stats (calculated from live prices)
  portfolioStats: {
    totalInvested: number;
    currentValue: number;
    totalPnL: number;
    totalPnLPercent: number;
    dayPnL: number;
    dayPnLPercent: number;
  };
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined,
);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [allHoldings, setAllHoldings] = useState<HoldingWithLivePrice[]>([]);
  const [cncHoldings, setCncHoldings] = useState<HoldingWithLivePrice[]>([]);
  const [misHoldings, setMisHoldings] = useState<HoldingWithLivePrice[]>([]);
  const [summary, setSummary] = useState<PortfolioResponse["summary"]>(null);
  const [warnings, setWarnings] =
    useState<PortfolioResponse["warnings"]>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marketTiming, setMarketTiming] = useState<MarketTimingResponse | null>(
    null,
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch live price for a single stock
  const fetchLivePrice = async (
    stockSymbol: string,
    exchange: string,
  ): Promise<number | null> => {
    try {
      const response = await ApiClient.get(
        `/instruments/live-data?exchange=${exchange}&trading_symbol=${stockSymbol}`,
      );

      if (
        response.data.success &&
        response.data.quoteData?.payload?.last_price
      ) {
        return response.data.quoteData.payload.last_price;
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch live price for ${stockSymbol}:`, error);
      return null;
    }
  };

  // Fetch live prices for all holdings and calculate P&L
  const fetchLivePricesForHoldings = useCallback(
    async (holdings: PortfolioHolding[]): Promise<HoldingWithLivePrice[]> => {
      const holdingsWithLivePrices = await Promise.all(
        holdings.map(async (holding) => {
          const livePrice = await fetchLivePrice(
            holding.stockSymbol,
            holding.exchange,
          );

          if (livePrice) {
            // Calculate P&L with live price
            const totalInvested = parseFloat(holding.totalInvested);
            const liveCurrentValue = livePrice * holding.quantity;
            const livePnL = liveCurrentValue - totalInvested;
            const livePnLPercent = (livePnL / totalInvested) * 100;

            return {
              ...holding,
              livePrice,
              liveCurrentValue,
              livePnL,
              livePnLPercent,
            };
          }

          // Fallback to stored values if live price fetch fails
          return {
            ...holding,
            livePrice: parseFloat(holding.currentPrice || "0"),
            liveCurrentValue: parseFloat(holding.currentValue || "0"),
            livePnL: parseFloat(holding.unrealizedPnL || "0"),
            livePnLPercent: holding.unrealizedPnLPerc || 0,
          };
        }),
      );

      return holdingsWithLivePrices;
    },
    [],
  );

  // Fetch portfolio data
  const fetchPortfolio = useCallback(
    async (isRefresh = false) => {
      // Only fetch if user is authenticated
      if (status !== "authenticated") {
        setLoading(false);
        return;
      }

      try {
        if (!isRefresh) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        // Fetch market timing first
        const timing = await marketApi.getMarketTiming();
        setMarketTiming(timing);

        const data = await getPortfolio();

        // Fetch live prices for all holdings
        const holdingsWithLive = await fetchLivePricesForHoldings(
          data.holdings.all,
        );

        setAllHoldings(holdingsWithLive);
        setCncHoldings(holdingsWithLive.filter((h) => h.product === "CNC"));
        setMisHoldings(holdingsWithLive.filter((h) => h.product === "MIS"));
        setSummary(data.summary);
        setWarnings(data.warnings);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to fetch portfolio:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status, fetchLivePricesForHoldings],
  );

  // Initial fetch
  useEffect(() => {
    if (status === "authenticated") {
      fetchPortfolio(false);
    }
  }, [status, fetchPortfolio]);

  // Auto-refresh based on market status
  useEffect(() => {
    if (status !== "authenticated" || allHoldings.length === 0) return;

    const marketOpen = marketTiming ? isMarketOpen(marketTiming) : false;

    // Only refresh every 5 seconds if market is open
    // Otherwise refresh every 60 seconds
    const refreshInterval = marketOpen ? 5000 : 60000;

    const interval = setInterval(() => {
      fetchPortfolio(true); // Silent refresh
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [status, allHoldings.length, marketTiming, fetchPortfolio]);

  // Manual refresh function
  const refreshPortfolio = useCallback(async () => {
    await fetchPortfolio(false);
  }, [fetchPortfolio]);

  // Calculate portfolio stats from live holdings data
  const portfolioStats = {
    totalInvested: allHoldings.reduce(
      (sum, h) => sum + parseFloat(h.totalInvested),
      0,
    ),
    currentValue: allHoldings.reduce(
      (sum, h) => sum + (h.liveCurrentValue || 0),
      0,
    ),
    totalPnL: allHoldings.reduce((sum, h) => sum + (h.livePnL || 0), 0),
    totalPnLPercent:
      allHoldings.length > 0
        ? (allHoldings.reduce((sum, h) => sum + (h.livePnL || 0), 0) /
            allHoldings.reduce(
              (sum, h) => sum + parseFloat(h.totalInvested),
              0,
            )) *
          100
        : 0,
    dayPnL: 0, // Not available in summary
    dayPnLPercent: 0, // Not available in summary
  };

  return (
    <PortfolioContext.Provider
      value={{
        allHoldings,
        cncHoldings,
        misHoldings,
        summary,
        warnings,
        loading,
        refreshing,
        refreshPortfolio,
        portfolioStats,
        marketTiming,
        isMarketOpen: marketTiming ? isMarketOpen(marketTiming) : false,
        lastUpdated,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
}
