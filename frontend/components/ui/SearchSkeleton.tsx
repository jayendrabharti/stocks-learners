"use client";

import React from "react";

interface SearchSkeletonProps {
  count?: number;
}

export const SearchSkeleton: React.FC<SearchSkeletonProps> = ({
  count = 5,
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex animate-pulse items-center space-x-3">
          {/* Logo Skeleton */}
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
          </div>

          {/* Content Skeleton */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center space-x-2">
              <div className="h-4 w-20 rounded bg-gray-200"></div>
              <div className="h-4 w-12 rounded bg-gray-200"></div>
            </div>
            <div className="mb-1 h-3 w-32 rounded bg-gray-200"></div>
            <div className="h-3 w-24 rounded bg-gray-200"></div>
          </div>

          {/* Price Skeleton */}
          <div className="flex-shrink-0 text-right">
            <div className="mb-1 h-4 w-16 rounded bg-gray-200"></div>
            <div className="h-3 w-12 rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const StockCardSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse p-4">
      <div className="flex items-center space-x-3">
        {/* Logo Skeleton */}
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gray-200"></div>
        </div>

        {/* Content Skeleton */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center space-x-2">
            <div className="h-4 w-20 rounded bg-gray-200"></div>
            <div className="h-4 w-12 rounded bg-gray-200"></div>
          </div>
          <div className="mb-1 h-3 w-32 rounded bg-gray-200"></div>
          <div className="h-3 w-24 rounded bg-gray-200"></div>
        </div>

        {/* Price Skeleton */}
        <div className="flex-shrink-0 text-right">
          <div className="mb-1 h-4 w-16 rounded bg-gray-200"></div>
          <div className="h-3 w-12 rounded bg-gray-200"></div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="mt-3 flex space-x-2">
        <div className="h-7 flex-1 rounded-md bg-gray-200"></div>
        <div className="h-7 flex-1 rounded-md bg-gray-200"></div>
        <div className="h-7 w-8 rounded-md bg-gray-200"></div>
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="text-center">
        <div className="mx-auto mb-2 h-8 w-64 rounded bg-gray-200"></div>
        <div className="mx-auto h-4 w-48 rounded bg-gray-200"></div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="mx-auto max-w-2xl">
        <div className="h-12 rounded-lg bg-gray-200"></div>
      </div>

      {/* Recent Searches Skeleton */}
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 h-4 w-32 rounded bg-gray-200"></div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-6 w-20 rounded-full bg-gray-200"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};
