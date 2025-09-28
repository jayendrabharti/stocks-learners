"use client";

import React from "react";
import { Clock, X } from "lucide-react";

interface RecentSearchesProps {
  searches: string[];
  onSearchSelect: (search: string) => void;
  onClearAll?: () => void;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({
  searches,
  onSearchSelect,
  onClearAll,
}) => {
  if (searches.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Recent Searches
          </span>
        </div>
        {onClearAll && (
          <button
            onClick={onClearAll}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Recent Search Items */}
      <div className="max-h-48 overflow-y-auto">
        {searches.map((search, index) => (
          <div
            key={`${search}-${index}`}
            className="group flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-50"
            onClick={() => onSearchSelect(search)}
          >
            <span className="flex-1 truncate text-sm text-gray-700">
              {search}
            </span>

            <div className="flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Remove individual search item
                }}
                className="rounded p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Show All Button */}
      {searches.length > 5 && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
          <button className="text-xs font-medium text-blue-600 hover:text-blue-800">
            Show All Recent Searches
          </button>
        </div>
      )}
    </div>
  );
};
