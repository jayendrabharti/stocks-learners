"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import { TrendingDown, ArrowLeft, Clock, RefreshCw } from "lucide-react";
import {
  marketApi,
  Stock,
  formatNumber,
  calculateChangePercent,
  isMarketOpen,
  MarketTimingResponse,
} from "../../../../../services/marketApi";
import { SearchSkeleton } from "../../../../../components/ui/SearchSkeleton";
import Link from "next/link";
import { cn } from "../../../../../lib/utils";

interface StockCardProps {
  stock: Stock;
  rank: number;
}

function StockCard({ stock, rank }: StockCardProps) {
  const changePercent = calculateChangePercent(stock.ltp, stock.close);
  const change = stock.ltp - stock.close;

  return (
    <Link href={`/stocks/${stock.nseScriptCode}`}>
      <Card className="group border-border/50 hover:border-border cursor-pointer transition-all duration-200 hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs font-semibold">
                  #{rank}
                </Badge>
                <div className="bg-muted h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
                  <img
                    src={stock.logoUrl}
                    alt={stock.companyShortName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                  <div className="bg-muted text-muted-foreground hidden h-full w-full items-center justify-center text-xs font-medium">
                    {stock.companyShortName.slice(0, 2)}
                  </div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-foreground group-hover:text-primary truncate font-semibold transition-colors">
                  {stock.companyShortName || stock.nseScriptCode}
                </div>
                <div className="text-muted-foreground truncate text-sm">
                  {stock.companyName}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {stock.marketCap && (
                    <Badge variant="outline" className="text-xs">
                      MCap: ₹{formatNumber(stock.marketCap)}
                    </Badge>
                  )}
                  {stock.volume && (
                    <Badge variant="outline" className="text-xs">
                      Vol: {formatNumber(stock.volume)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-foreground text-lg font-semibold">
                ₹
                {stock.ltp.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="flex items-center justify-end gap-1 text-sm font-medium text-destructive">
                <TrendingDown className="h-4 w-4" />
                <span>₹{change.toFixed(2)}</span>
                <span>({changePercent.toFixed(2)}%)</span>
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                H: ₹{stock.yearHigh.toFixed(2)} • L: ₹{stock.yearLow.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TopLosersPage() {
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
        marketApi.getTopLosers(pageSize),
        marketApi.getMarketTiming(),
      ]);

      setStocks(stocksData);
      setMarketTiming(timingData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching top losers:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pageSize]);

  const marketIsOpen = isMarketOpen(marketTiming);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/stocks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stocks
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-destructive/10 p-3">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-foreground text-2xl font-bold">Top Losers</h1>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                <div
                  className={`h-2 w-2 rounded-full ${marketIsOpen ? "bg-chart-1/50" : "bg-destructive/50"}`}
                />
                <span>{marketIsOpen ? "Market Open" : "Market Closed"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
              />
              Refresh
            </Button>

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
          </div>
        </div>
      </div>

      {/* Market Status Banner */}
      <Card
        className={cn(
          "mb-6 border-l-4",
          marketIsOpen
            ? "border-l-chart-1 bg-chart-1/5"
            : "border-l-destructive bg-destructive/5",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${marketIsOpen ? "bg-chart-1/50" : "bg-destructive/50"}`}
              />
              <span className="font-medium">
                {marketIsOpen ? "Market is Open" : "Market is Closed"}
              </span>
              <span className="text-muted-foreground text-sm">
                • {marketIsOpen ? "Live prices" : "Last closing prices"}
              </span>
            </div>
            <Badge variant={marketIsOpen ? "default" : "secondary"}>
              {marketIsOpen ? "LIVE" : "CLOSED"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">
              {loading ? "..." : stocks.length}
            </div>
            <div className="text-muted-foreground text-sm">Total Losers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">
              {loading
                ? "..."
                : stocks.length > 0
                  ? `${calculateChangePercent(stocks[0].ltp, stocks[0].close).toFixed(2)}%`
                  : "0%"}
            </div>
            <div className="text-muted-foreground text-sm">Biggest Loss</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">
              {loading
                ? "..."
                : stocks.length > 0
                  ? `${calculateChangePercent(stocks[stocks.length - 1].ltp, stocks[stocks.length - 1].close).toFixed(2)}%`
                  : "0%"}
            </div>
            <div className="text-muted-foreground text-sm">Smallest Loss</div>
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
              <StockCard
                key={stock.searchId || index}
                stock={stock}
                rank={index + 1}
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
    </div>
  );
}
