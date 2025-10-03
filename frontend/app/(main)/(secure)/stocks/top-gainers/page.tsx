"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import {
  marketApi,
  Stock,
  calculateChangePercent,
  MarketTimingResponse,
} from "@/services/marketApi";
import { SearchSkeleton } from "@/components/ui/SearchSkeleton";
import { MarketPageLayout } from "@/components/layouts";
import { MarketStockCard } from "@/components/trading";

export default function TopGainersPage() {
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
        marketApi.getTopGainers(pageSize),
        marketApi.getMarketTiming(),
      ]);

      setStocks(stocksData);
      setMarketTiming(timingData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching top gainers:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pageSize]);

  return (
    <MarketPageLayout
      title="Top Gainers"
      icon={<TrendingUp className="text-chart-1 h-8 w-8" />}
      description="Stocks with the highest price increase today"
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
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-chart-1 text-2xl font-bold">
              {loading ? "..." : stocks.length}
            </div>
            <div className="text-muted-foreground text-sm">Total Gainers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-chart-1 text-2xl font-bold">
              {loading
                ? "..."
                : stocks.length > 0
                  ? `+${calculateChangePercent(stocks[0].ltp, stocks[0].close).toFixed(2)}%`
                  : "0%"}
            </div>
            <div className="text-muted-foreground text-sm">Top Gain</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-chart-1 text-2xl font-bold">
              {loading
                ? "..."
                : stocks.length > 0
                  ? `+${calculateChangePercent(stocks[stocks.length - 1].ltp, stocks[stocks.length - 1].close).toFixed(2)}%`
                  : "0%"}
            </div>
            <div className="text-muted-foreground text-sm">Lowest Gain</div>
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
                variant="gainer"
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
