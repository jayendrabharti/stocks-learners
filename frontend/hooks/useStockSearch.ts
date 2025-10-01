"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { debounce } from "../lib/tradingUtils";
import { stockApiService } from "../services/stockApi";
import {
  InstrumentSearch,
  SearchFilters,
  SearchResponse,
} from "../types/trading";

export const useStockSearch = () => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    exchange: "",
    instrumentType: "",
    page: 1,
    limit: 20, // Increased from 50 to 20 for better initial results
  });
  const [results, setResults] = useState<InstrumentSearch[]>([]);
  const [pagination, setPagination] = useState<
    SearchResponse["pagination"] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("recent-stock-searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const addToRecentSearches = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches((prev) => {
      const updated = [
        searchQuery,
        ...prev.filter((item) => item !== searchQuery),
      ].slice(0, 10); // Keep only last 10 searches

      localStorage.setItem("recent-stock-searches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchQuery: string, searchFilters: SearchFilters) => {
        if (!searchQuery.trim()) {
          setResults([]);
          setPagination(null);
          setLoading(false);
          return;
        }

        try {
          setError(null);
          const response = await stockApiService.searchInstruments(
            searchQuery,
            searchFilters,
          );
          setResults(response.data);
          setPagination(response.pagination);

          // Add to recent searches only if we got results
          if (response.data.length > 0) {
            addToRecentSearches(searchQuery);
          }
        } catch (err) {
          console.error("Search error:", err);
          setError(err instanceof Error ? err.message : "Search failed");
          setResults([]);
          setPagination(null);
        } finally {
          setLoading(false);
        }
      }, 300),
    [addToRecentSearches],
  );

  // Search effect
  useEffect(() => {
    if (query.trim() || filters.exchange || filters.instrumentType) {
      setLoading(true);
      debouncedSearch(query, filters);
    } else {
      setResults([]);
      setPagination(null);
      setLoading(false);
    }

    // Cleanup debounced function on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, filters, debouncedSearch]);

  // Update search query
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setFilters((prev) => ({ ...prev, page: 1 })); // Reset page when query changes
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Load more results (pagination)
  const loadMore = useCallback(async () => {
    if (!pagination?.hasNext || loading) return;

    try {
      setLoading(true);
      setError(null);

      const response = await stockApiService.searchInstruments(query, {
        ...filters,
        page: (filters.page || 1) + 1,
      });

      setResults((prev) => [...prev, ...response.data]);
      setPagination(response.pagination);
      setFilters((prev) => ({ ...prev, page: response.pagination.page }));
    } catch (err) {
      console.error("Load more error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load more results",
      );
    } finally {
      setLoading(false);
    }
  }, [query, filters, pagination, loading]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setPagination(null);
    setError(null);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem("recent-stock-searches");
  }, []);

  // Search from recent
  const searchFromRecent = useCallback(
    (recentQuery: string) => {
      updateQuery(recentQuery);
    },
    [updateQuery],
  );

  return {
    // State
    query,
    filters,
    results,
    pagination,
    loading,
    error,
    recentSearches,

    // Actions
    updateQuery,
    updateFilters,
    loadMore,
    clearSearch,
    clearRecentSearches,
    searchFromRecent,

    // Computed
    hasResults: results.length > 0,
    isEmpty: !loading && !error && results.length === 0 && query.trim() !== "",
    canLoadMore: !!(pagination?.hasNext && !loading),
  };
};
