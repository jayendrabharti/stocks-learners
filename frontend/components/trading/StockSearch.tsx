"use client";

import React, { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { useStockSearch } from "@/hooks/useStockSearch";
import { SearchResults } from "./SearchResults";
import { SearchFilters } from "./SearchFilters";
import { RecentSearches } from "./RecentSearches";
import { Input } from "@/components/ui/input";

interface StockSearchProps {
  onStockSelect?: (stock: any) => void;
  placeholder?: string;
  className?: string;
}

export const StockSearch: React.FC<StockSearchProps> = ({
  onStockSelect,
  placeholder = "Search for stocks, ETFs, indices...",
  className = "",
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const {
    query,
    filters,
    results,
    pagination,
    loading,
    error,
    recentSearches,
    updateQuery,
    updateFilters,
    loadMore,
    clearSearch,
    searchFromRecent,
    hasResults,
    isEmpty,
    canLoadMore,
  } = useStockSearch();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateQuery(e.target.value);
  };

  const handleClearSearch = () => {
    clearSearch();
    setIsFocused(false);
  };

  const showSearchResults =
    isFocused && (hasResults || loading || error || isEmpty);
  const showRecentSearches =
    isFocused && !query.trim() && recentSearches.length > 0;

  return (
    <div className={`relative mx-auto w-full max-w-2xl ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay hiding to allow clicking on results
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder={placeholder}
        />

        <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
          {query && (
            <button
              onClick={handleClearSearch}
              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded p-1 transition-colors focus:outline-none ${
              showFilters
                ? "bg-blue-50 text-blue-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
            type="button"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Filters */}
      {showFilters && (
        <div className="mt-3">
          <SearchFilters filters={filters} onFiltersChange={updateFilters} />
        </div>
      )}

      {/* Search Results Dropdown */}
      {(showSearchResults || showRecentSearches) && (
        <div className="absolute z-50 mt-1 max-h-96 w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg">
          {showRecentSearches && (
            <RecentSearches
              searches={recentSearches}
              onSearchSelect={searchFromRecent}
            />
          )}

          {showSearchResults && (
            <SearchResults
              results={results}
              pagination={pagination}
              loading={loading}
              error={error}
              isEmpty={isEmpty}
              canLoadMore={canLoadMore}
              onLoadMore={loadMore}
              onStockSelect={onStockSelect}
            />
          )}
        </div>
      )}
    </div>
  );
};
