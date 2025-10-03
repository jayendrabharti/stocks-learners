"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import {
  marketApi,
  MostBoughtStock,
  MarketTimingResponse,
} from "@/services/marketApi";
import { SearchSkeleton } from "@/components/ui/SearchSkeleton";
import { MarketPageLayout } from "@/components/layouts";
import { MarketStockCard } from "@/components/trading";

export default function MostBoughtPage() {
  const [stocks, setStocks] = useState<MostBoughtStock[]>([]);
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
        marketApi.getMostBoughtStocks(pageSize),
        marketApi.getMarketTiming(),
      ]);

      setStocks(stocksData);
      setMarketTiming(timingData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching most bought stocks:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pageSize]);

  const gainers = stocks.filter((stock) => stock.stats.dayChangePerc > 0);
  const losers = stocks.filter((stock) => stock.stats.dayChangePerc < 0);
  const neutral = stocks.filter((stock) => stock.stats.dayChangePerc === 0);

  return (
    <MarketPageLayout
      title="Most Bought on Groww"
      icon={<Users className="h-8 w-8 text-blue-600" />}
      description="Stocks popular among Groww investors"
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
            <div className="text-2xl font-bold text-blue-600">
              {loading ? "..." : stocks.length}
            </div>
            <div className="text-muted-foreground text-sm">Total Stocks</div>
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
            <div className="text-2xl font-bold text-gray-600">
              {loading ? "..." : neutral.length}
            </div>
            <div className="text-muted-foreground text-sm">Neutral</div>
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
                key={stock.company.searchId || index}
                stock={stock}
                rank={index + 1}
                variant="popular"
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
