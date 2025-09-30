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

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  loading: boolean;
  error: string | null;
  addToWatchlist: (stockData: AddToWatchlistRequest) => Promise<void>;
  removeFromWatchlist: (stockSymbol: string, exchange: string) => Promise<void>;
  isInWatchlist: (stockSymbol: string, exchange: string) => boolean;
  clearWatchlist: () => Promise<void>;
  refreshWatchlist: () => Promise<void>;
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
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Add stock to watchlist
  const addToWatchlist = useCallback(
    async (stockData: AddToWatchlistRequest) => {
      try {
        const newItem = await WatchlistApi.addToWatchlist(stockData);
        setWatchlist((prev) => [newItem, ...prev]);
        toast.success(`${stockData.stockName} added to watchlist`);
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
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist,
    refreshWatchlist,
    watchlistCount: watchlist.length,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};
