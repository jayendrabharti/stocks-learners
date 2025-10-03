"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import {
  marketApi,
  Stock,
  calculateChangePercent,
  MarketTimingResponse,
} from "@/services/marketApi";
import { SearchSkeleton } from "@/components/ui/SearchSkeleton";
import { MarketPageLayout } from "@/components/layouts";
import { MarketStockCard } from "@/components/trading";

export default function VolumeShockersPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [marketTiming, setMarketTiming] = useState<MarketTimingResponse | null>(
    null,
  );
  const [pageSize, setPageSize] = useState(20);

  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const [stocksData, timingData] = await Promise.all([
        marketApi.getVolumeShockers(pageSize),
        marketApi.getMarketTiming(),
      ]);

      setStocks(stocksData);
      setMarketTiming(timingData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching volume shockers:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pageSize]);

  const gainers = stocks.filter((stock) => {
    const change = stock.ltp - stock.close;
    return change > 0;
  });
  const losers = stocks.filter((stock) => {
    const change = stock.ltp - stock.close;
    return change < 0;
  });

  return (
    <MarketPageLayout
      title="Volume Shockers"
      icon={<Volume2 className="h-8 w-8 text-purple-600" />}
      description="Stocks with unusual trading volume activity"
      marketTiming={marketTiming}
      lastUpdated={lastUpdated}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => fetchData(true)}
      headerActions={
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="border-border bg-background rounded-md border px-3 py-2 text-sm"
        >
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
          <option value={100}>Top 100</option>
        </select>
      }
    >
      {/* Stats Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {loading ? "..." : stocks.length}
            </div>
            <div className="text-muted-foreground text-sm">Volume Shockers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-chart-1 text-2xl font-bold">
              {loading ? "..." : gainers.length}
            </div>
            <div className="text-muted-foreground text-sm">Gainers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-destructive text-2xl font-bold">
              {loading ? "..." : losers.length}
            </div>
            <div className="text-muted-foreground text-sm">Losers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {loading
                ? "..."
                : stocks.length > 0 && stocks[0].volume
                  ? stocks[0].volume.toLocaleString("en-IN")
                  : "N/A"}
            </div>
            <div className="text-muted-foreground text-sm">Highest Volume</div>
          </CardContent>
        </Card>
      </div>

      {/* Stocks List */}
      <div className="space-y-3">
        {loading
          ? Array.from({ length: pageSize }).map((_, index) => (
              <SearchSkeleton key={index} />
            ))
          : stocks.map((stock, index) => (
              <MarketStockCard
                key={stock.searchId || index}
                stock={stock}
                rank={index + 1}
                variant="volume"
              />
            ))}
      </div>

      {/* Load More Button */}
      {!loading && stocks.length >= pageSize && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => setPageSize((prev) => prev + 20)}
            disabled={refreshing}
          >
            Load More Stocks
          </Button>
        </div>
      )}
    </MarketPageLayout>
  );
}
