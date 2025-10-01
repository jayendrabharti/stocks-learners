"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getIndices,
  IndexData,
  groupIndices,
  calculate52WeekRange,
} from "@/services/indicesApi";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

export default function IndicesPage() {
  const [allIndices, setAllIndices] = useState<IndexData[]>([]);
  const [filteredIndices, setFilteredIndices] = useState<IndexData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllIndices = async () => {
      try {
        const data = await getIndices("", 0, 50); // Fetch more indices

        console.log("Fetched indices data:", data);

        // Check if data is valid
        if (!data || !Array.isArray(data)) {
          console.error("Invalid data received:", data);
          setAllIndices([]);
          setFilteredIndices([]);
          return;
        }

        // Deduplicate by searchId
        const uniqueIndices = data.reduce((acc, current) => {
          const exists = acc.find(
            (item) => item.header.searchId === current.header.searchId,
          );
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, [] as IndexData[]);

        console.log("Unique indices:", uniqueIndices);
        setAllIndices(uniqueIndices);
        setFilteredIndices(uniqueIndices);
      } catch (error) {
        console.error("Failed to fetch indices:", error);
        setAllIndices([]);
        setFilteredIndices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllIndices();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = allIndices.filter(
        (index) =>
          index.header.displayName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          index.header.shortName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          index.header.isin.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredIndices(filtered);
    } else {
      setFilteredIndices(allIndices);
    }
  }, [searchTerm, allIndices]);

  const { major, sectoral, other } = groupIndices(filteredIndices);

  const renderIndexCard = (index: IndexData) => {
    // Use nseScriptCode for the link
    const stockId = index.header.nseScriptCode || index.header.searchId;

    const range =
      index.yearLowPrice && index.yearHighPrice
        ? calculate52WeekRange(index.yearLowPrice, index.yearHighPrice)
        : "0%";
    const rangeValue = parseFloat(range);

    return (
      <Link key={index.header.searchId} href={`/stocks/${stockId}`}>
        <Card className="cursor-pointer transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {index.header.logoUrl && (
                  <Image
                    src={index.header.logoUrl}
                    alt={index.header.displayName}
                    width={48}
                    height={48}
                    className="rounded"
                    unoptimized
                  />
                )}
                <div>
                  <h3 className="text-lg font-bold">
                    {index.header.displayName}
                  </h3>
                  {index.header.shortName && (
                    <p className="text-sm text-gray-500">
                      {index.header.shortName}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{index.header.isin}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {(index.header.isNseFnoEnabled ||
                  index.header.isBseFnoEnabled) && (
                  <Badge variant="secondary">F&O</Badge>
                )}
                {rangeValue > 0 ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-semibold">{range}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm font-semibold">{range}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">52 Week High</span>
                <span className="font-semibold">
                  ₹{index.yearHighPrice?.toFixed(2) || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">52 Week Low</span>
                <span className="font-semibold">
                  ₹{index.yearLowPrice?.toFixed(2) || "N/A"}
                </span>
              </div>
              <div className="mt-2 border-t pt-2">
                <div className="flex gap-2 text-xs text-gray-500">
                  {index.header.nseScriptCode && (
                    <Badge variant="outline" className="text-xs">
                      NSE: {index.header.nseScriptCode}
                    </Badge>
                  )}
                  {index.header.bseScriptCode && (
                    <Badge variant="outline" className="text-xs">
                      BSE: {index.header.bseScriptCode}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Market Indices</h1>
        <div className="mb-6">
          <div className="relative">
            <div className="h-10 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <Card key={i}>
              <CardContent className="animate-pulse p-6">
                <div className="mb-4 h-12 rounded bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="h-4 rounded bg-gray-200"></div>
                  <div className="h-4 rounded bg-gray-200"></div>
                  <div className="h-4 rounded bg-gray-200"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Market Indices</h1>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder="Search indices by name or ISIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Major Indices */}
      {major.length > 0 && (
        <div className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold">Major Indices</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {major.map(renderIndexCard)}
          </div>
        </div>
      )}

      {/* Sectoral Indices */}
      {sectoral.length > 0 && (
        <div className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold">Sectoral Indices</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sectoral.map(renderIndexCard)}
          </div>
        </div>
      )}

      {/* Other Indices */}
      {other.length > 0 && (
        <div className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold">Other Indices</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {other.map(renderIndexCard)}
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredIndices.length === 0 && !loading && (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">
            No indices found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
