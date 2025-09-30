"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  WatchlistApi,
  WatchlistItem,
  AddToWatchlistRequest,
} from "../services/watchlistApi";
import { toast } from "sonner";
import ApiClient from "../utils/ApiClient";

// Live data structure matching the stock detail page
type LiveData = {
  average_price: number;
  bid_quantity: number;
  bid_price: number;
  day_change: number;
  day_change_perc: number;
  upper_circuit_limit: number;
  lower_circuit_limit: number;
  last_price: number;
  last_trade_quantity: number;
  last_trade_time: string;
  offer_price: number;
  offer_quantity: number;
  total_buy_quantity: number;
  total_sell_quantity: number;
  volume: number;
  market_cap: number;
  thirty_day_avg_volume: number;
  year_high: number;
  year_low: number;
  open_price: number;
  close_price: number;
  high_price: number;
  low_price: number;
};

// Extend WatchlistItem to include live data
export interface WatchlistItemWithLiveData extends WatchlistItem {
  liveData?: LiveData;
  dataLoading?: boolean;
  dataError?: string;
}

interface WatchlistContextType {
  watchlist: WatchlistItemWithLiveData[];
  loading: boolean;
  error: string | null;
  dataLoading: boolean;
  addToWatchlist: (stockData: AddToWatchlistRequest) => Promise<void>;
  removeFromWatchlist: (stockSymbol: string, exchange: string) => Promise<void>;
  isInWatchlist: (stockSymbol: string, exchange: string) => boolean;
  clearWatchlist: () => Promise<void>;
  refreshWatchlist: () => Promise<void>;
  refreshLiveData: () => Promise<void>;
  watchlistCount: number;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(
  undefined,
);

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
};

interface WatchlistProviderProps {
  children: React.ReactNode;
}

export const WatchlistProvider: React.FC<WatchlistProviderProps> = ({
  children,
}) => {
  const [watchlist, setWatchlist] = useState<WatchlistItemWithLiveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Fetch live data for all watchlist items using batch endpoint
  const fetchLiveDataForWatchlist = useCallback(
    async (watchlistItems: WatchlistItemWithLiveData[]) => {
      if (watchlistItems.length === 0) return;

      try {
        setDataLoading(true);

        // Update loading state for all items
        setWatchlist((prev) =>
          prev.map((item) => ({
            ...item,
            dataLoading: true,
            dataError: undefined,
          })),
        );

        // Prepare instruments array for batch request
        const instruments = watchlistItems.map((item) => ({
          trading_symbol: item.stockSymbol,
          exchange: item.exchange,
        }));

        // Make batch API call
        const response = await ApiClient.post("/instruments/batch-live-data", {
          instruments,
        });

        if (response.data.success && response.data.data) {
          const batchResults = response.data.data;

          // Update each item with its corresponding data
          setWatchlist((prev) => {
            const updated = prev.map((prevItem) => {
              const result = batchResults.find(
                (r: any) =>
                  r.trading_symbol === prevItem.stockSymbol &&
                  r.exchange === prevItem.exchange,
              );

              if (result) {
                if (result.success && result.data?.payload) {
                  return {
                    ...prevItem,
                    liveData: result.data.payload,
                    dataLoading: false,
                    dataError: undefined,
                  };
                } else {
                  return {
                    ...prevItem,
                    dataLoading: false,
                    dataError:
                      result.error ||
                      `No data available for ${prevItem.stockSymbol}`,
                  };
                }
              } else {
                return {
                  ...prevItem,
                  dataLoading: false,
                  dataError: `No response for ${prevItem.stockSymbol}`,
                };
              }
            });

            return updated;
          });
        } else {
          throw new Error("Invalid response from batch live data endpoint");
        }
      } catch (err: any) {
        // Update all items with error state
        setWatchlist((prev) =>
          prev.map((item) => ({
            ...item,
            dataLoading: false,
            dataError:
              err.response?.data?.message ||
              err.message ||
              "Failed to fetch live data",
          })),
        );
      } finally {
        setDataLoading(false);
      }
    },
    [],
  );

  // Refresh live data for current watchlist
  const refreshLiveData = useCallback(async () => {
    await fetchLiveDataForWatchlist(watchlist);
  }, [watchlist, fetchLiveDataForWatchlist]);

  // Load watchlist on mount
  const loadWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await WatchlistApi.getWatchlist();
      setWatchlist(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load watchlist";
      setError(errorMessage);
      console.error("Error loading watchlist:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize watchlist on mount
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Fetch live data when watchlist is loaded
  useEffect(() => {
    if (watchlist.length > 0 && !loading) {
      fetchLiveDataForWatchlist(watchlist);
    }
  }, [watchlist.length, loading]);

  // Add stock to watchlist
  const addToWatchlist = useCallback(
    async (stockData: AddToWatchlistRequest) => {
      try {
        const newItem = await WatchlistApi.addToWatchlist(stockData);
        const newItemWithLiveData: WatchlistItemWithLiveData = {
          ...newItem,
          dataLoading: true,
          dataError: undefined,
        };
        setWatchlist((prev) => [newItemWithLiveData, ...prev]);
        toast.success(`${stockData.stockName} added to watchlist`);

        // Fetch live data for the newly added item
        try {
          const response = await ApiClient.post(
            "/instruments/batch-live-data",
            {
              instruments: [
                {
                  trading_symbol: stockData.stockSymbol,
                  exchange: stockData.exchange,
                },
              ],
            },
          );

          if (response.data.success && response.data.data?.[0]) {
            const result = response.data.data[0];
            const liveData =
              result.success && result.data?.quoteData?.payload
                ? result.data.quoteData.payload
                : null;

            setWatchlist((prev) =>
              prev.map((item) =>
                item.id === newItem.id
                  ? {
                      ...item,
                      liveData: liveData || undefined,
                      dataLoading: false,
                      dataError: liveData
                        ? undefined
                        : `Failed to fetch live data for ${stockData.stockSymbol}`,
                    }
                  : item,
              ),
            );
          }
        } catch (liveDataError) {
          console.error(
            "Failed to fetch live data for new item:",
            liveDataError,
          );
          setWatchlist((prev) =>
            prev.map((item) =>
              item.id === newItem.id
                ? {
                    ...item,
                    dataLoading: false,
                    dataError: `Failed to fetch live data for ${stockData.stockSymbol}`,
                  }
                : item,
            ),
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add to watchlist";
        toast.error(errorMessage);
        throw err;
      }
    },
    [],
  );

  // Remove stock from watchlist
  const removeFromWatchlist = useCallback(
    async (stockSymbol: string, exchange: string) => {
      try {
        await WatchlistApi.removeFromWatchlist(stockSymbol, exchange);
        setWatchlist((prev) =>
          prev.filter(
            (item) =>
              !(item.stockSymbol === stockSymbol && item.exchange === exchange),
          ),
        );
        toast.success("Stock removed from watchlist");
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to remove from watchlist";
        toast.error(errorMessage);
        throw err;
      }
    },
    [],
  );

  // Check if stock is in watchlist
  const isInWatchlist = useCallback(
    (stockSymbol: string, exchange: string) => {
      return watchlist.some(
        (item) =>
          item.stockSymbol === stockSymbol && item.exchange === exchange,
      );
    },
    [watchlist],
  );

  // Clear entire watchlist
  const clearWatchlist = useCallback(async () => {
    try {
      await WatchlistApi.clearWatchlist();
      setWatchlist([]);
      toast.success("Watchlist cleared");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear watchlist";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Refresh watchlist
  const refreshWatchlist = useCallback(async () => {
    await loadWatchlist();
  }, [loadWatchlist]);

  const value: WatchlistContextType = {
    watchlist,
    loading,
    error,
    dataLoading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist,
    refreshWatchlist,
    refreshLiveData,
    watchlistCount: watchlist.length,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};
