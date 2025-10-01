"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getMajorIndices,
  IndexData,
  calculate52WeekRange,
} from "@/services/indicesApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";

export default function IndicesCard() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMajorIndices = async () => {
      try {
        const data = await getMajorIndices();
        console.log("IndicesCard - Raw data received:", data);
        console.log("IndicesCard - Is array:", Array.isArray(data));
        console.log("IndicesCard - Data length:", data?.length);

        // Ensure data is an array
        if (!data || !Array.isArray(data)) {
          console.error("IndicesCard - Data is not an array:", data);
          setError("Invalid data format received");
          setIndices([]);
          return;
        }

        if (data.length === 0) {
          console.warn("IndicesCard - Received empty array");
          setIndices([]);
          return;
        }

        // Log each index
        data.forEach((item, idx) => {
          console.log(
            `Index ${idx}:`,
            item?.header?.searchId,
            item?.header?.displayName,
          );
        });

        // Since the backend should return unique indices, let's just use the data directly
        // Only deduplicate if there are actual duplicates
        const searchIds = data.map((item) => item.header.searchId);
        const hasDuplicates = new Set(searchIds).size !== searchIds.length;

        if (hasDuplicates) {
          console.warn("IndicesCard - Duplicates detected, deduplicating...");
          const uniqueIndices = data.reduce((acc, current) => {
            if (!current?.header?.searchId) {
              console.warn(
                "IndicesCard - Skipping item without searchId:",
                current,
              );
              return acc;
            }

            const exists = acc.find(
              (item) => item.header.searchId === current.header.searchId,
            );

            if (!exists) {
              acc.push(current);
            } else {
              console.log(
                "IndicesCard - Duplicate found:",
                current.header.searchId,
              );
            }
            return acc;
          }, [] as IndexData[]);

          console.log(
            "IndicesCard - After deduplication:",
            uniqueIndices.length,
          );
          setIndices(uniqueIndices);
        } else {
          console.log("IndicesCard - No duplicates, using data as-is");
          setIndices(data);
        }
      } catch (error) {
        console.error("IndicesCard - Failed to fetch major indices:", error);
        setError("Failed to load indices");
        setIndices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMajorIndices();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Major Indices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border p-4">
                <div className="mb-2 h-8 w-8 rounded bg-gray-200"></div>
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-3 w-1/2 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || indices.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Major Indices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            {error || "No indices data available"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Major Indices
        </CardTitle>
        <Link href="/stocks/indices">
          <Button variant="ghost" size="sm" className="gap-1">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {indices.map((index, idx) => {
            // Use nseScriptCode for the link, fallback to searchId
            const stockId = index.header.nseScriptCode || index.header.searchId;

            return (
              <Link
                key={`${index.header.searchId}-${idx}`}
                href={`/stocks/${stockId}`}
                className="block"
              >
                <div className="cursor-pointer rounded-lg border p-4 transition-shadow hover:shadow-md">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {index.header.logoUrl && (
                        <Image
                          src={index.header.logoUrl}
                          alt={index.header.displayName}
                          width={32}
                          height={32}
                          className="rounded"
                          unoptimized
                        />
                      )}
                      <div>
                        <h3 className="text-sm font-semibold">
                          {index.header.displayName}
                        </h3>
                        {index.header.shortName && (
                          <p className="text-xs text-gray-500">
                            {index.header.shortName}
                          </p>
                        )}
                      </div>
                    </div>
                    {(index.header.isNseFnoEnabled ||
                      index.header.isBseFnoEnabled) && (
                      <Badge variant="secondary" className="text-xs">
                        F&O
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>52W High:</span>
                      <span className="font-medium">
                        {index.yearHighPrice?.toFixed(2) || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>52W Low:</span>
                      <span className="font-medium">
                        {index.yearLowPrice?.toFixed(2) || "N/A"}
                      </span>
                    </div>
                    {index.yearLowPrice && index.yearHighPrice && (
                      <div className="flex justify-between">
                        <span>Range:</span>
                        <span className="font-medium text-blue-600">
                          {calculate52WeekRange(
                            index.yearLowPrice,
                            index.yearHighPrice,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
