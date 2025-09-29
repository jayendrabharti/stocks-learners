"use client";

import React from "react";
import { Loader2, AlertCircle, TrendingUp } from "lucide-react";
import { InstrumentSearch, SearchResponse } from "../../types/trading";
import { StockCard } from "./StockCard";
import { SearchSkeleton } from "../ui/SearchSkeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResultsProps {
  results: InstrumentSearch[];
  pagination: SearchResponse["pagination"] | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  canLoadMore: boolean;
  onLoadMore: () => void;
  onStockSelect?: (stock: InstrumentSearch) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  pagination,
  loading,
  error,
  isEmpty,
  canLoadMore,
  onLoadMore,
  onStockSelect,
}) => {
  const router = useRouter();

  const handleStockClick = (stock: InstrumentSearch) => {
    // Navigate directly to stock page using nseScriptCode
    const stockId = stock.symbol; // Using symbol as it contains the nseScriptCode
    router.push(`/stocks/${stockId}`);
  };
  if (loading && results.length === 0) {
    return (
      <div className="p-4">
        <SearchSkeleton count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
        <h3 className="mb-1 text-sm font-medium text-gray-900">Search Error</h3>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="p-6 text-center">
        <TrendingUp className="mx-auto mb-3 h-12 w-12 text-gray-400" />
        <h3 className="mb-1 text-sm font-medium text-gray-900">
          No results found
        </h3>
        <p className="text-sm text-gray-500">
          Try adjusting your search terms or filters
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Results Header */}
      {pagination && (
        <div className="border-b bg-gray-50 px-4 py-2 text-xs text-gray-600">
          Showing {results.length} of {pagination.total} results
        </div>
      )}

      {/* Results List */}
      <div className="divide-y divide-gray-100">
        {results.map((stock, index) => (
          <div
            key={`${stock.symbol}-${stock.exchange}-${index}`}
            className="cursor-pointer transition-colors hover:bg-gray-50"
            onClick={() => handleStockClick(stock)}
          >
            <StockCard stock={stock} showDetails={false} />
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {canLoadMore && (
        <div className="border-t bg-gray-50 p-3">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="flex w-full items-center justify-center space-x-2 rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Load More Results</span>
          </button>
        </div>
      )}

      {/* Loading indicator for load more */}
      {loading && results.length > 0 && (
        <div className="border-t p-4">
          <SearchSkeleton count={3} />
        </div>
      )}
    </div>
  );
};
