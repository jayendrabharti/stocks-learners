"use client";

import React, { useState, useEffect } from "react";
import { StockSearch } from "../../../../components/trading/StockSearch";
import { Watchlist } from "../../../../components/trading/Watchlist";
import { WatchlistButton } from "../../../../components/trading/WatchlistButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Search,
  BarChart3,
  Eye,
  Clock,
  Star,
  Plus,
  Activity,
  Wallet,
  PieChart,
  HelpCircle,
  Volume2,
  Users,
  ChevronRight,
} from "lucide-react";
import {
  marketApi,
  Stock,
  MostBoughtStock,
  formatCurrency,
  formatNumber,
  calculateChangePercent,
  isMarketOpen,
  MarketTimingResponse,
} from "../../../../services/marketApi";
import { SearchSkeleton } from "../../../../components/ui/SearchSkeleton";
import Link from "next/link";
import { cn } from "../../../../lib/utils";

// StockCard component for consistent stock display
interface StockCardProps {
  stock: Stock | MostBoughtStock;
  type?: "gainer" | "loser" | "volume" | "popular";
  size?: "sm" | "md";
}

function StockCard({ stock, type = "gainer", size = "md" }: StockCardProps) {
  let displayData;
  let changePercent: number;
  let change: number;
  let price: number;
  let symbol: string;
  let companyName: string;
  let logo: string;

  // Handle different stock types
  if ("company" in stock) {
    // MostBoughtStock type
    displayData = stock.stats;
    changePercent = stock.stats.dayChangePerc;
    change = stock.stats.dayChange;
    price = stock.stats.ltp;
    symbol = stock.company.companyShortName;
    companyName = stock.company.companyName;
    logo = stock.company.imageUrl;
  } else {
    // Stock type
    changePercent = calculateChangePercent(stock.ltp, stock.close);
    change = stock.ltp - stock.close;
    price = stock.ltp;
    symbol = stock.companyShortName || stock.nseScriptCode;
    companyName = stock.companyName;
    logo = stock.logoUrl;
  }

  const isPositive = change >= 0;
  const isNeutral = change === 0;

  // Use nseScriptCode for navigation instead of searchId
  const stockId =
    "company" in stock ? stock.company.nseScriptCode : stock.nseScriptCode;

  return (
    <Card
      className={cn(
        "group border-border/50 hover:border-border transition-all duration-200 hover:shadow-lg",
        size === "sm" ? "p-3" : "p-4",
      )}
    >
      <CardContent className={size === "sm" ? "p-3" : "p-4"}>
        <Link href={`/stocks/${stockId}`} className="block">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={cn(
                  "bg-muted flex-shrink-0 overflow-hidden rounded-full",
                  size === "sm" ? "h-8 w-8" : "h-10 w-10",
                )}
              >
                <img
                  src={logo}
                  alt={symbol}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
                <div className="bg-muted text-muted-foreground hidden h-full w-full items-center justify-center text-xs font-medium">
                  {symbol.slice(0, 2)}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "text-foreground group-hover:text-primary truncate font-semibold transition-colors",
                    size === "sm" ? "text-sm" : "text-base",
                  )}
                >
                  {symbol}
                </div>
                <div
                  className={cn(
                    "text-muted-foreground truncate",
                    size === "sm" ? "text-xs" : "text-sm",
                  )}
                >
                  {companyName}
                </div>
                {type === "volume" && "volume" in stock && stock.volume && (
                  <div className="text-chart-4 mt-1 text-xs">
                    Vol: {formatNumber(stock.volume)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 text-right">
                <div
                  className={cn(
                    "text-foreground font-semibold",
                    size === "sm" ? "text-sm" : "text-base",
                  )}
                >
                  ₹{price.toFixed(2)}
                </div>
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 font-medium",
                    size === "sm" ? "text-xs" : "text-sm",
                    isNeutral
                      ? "text-muted-foreground"
                      : isPositive
                        ? "text-chart-1"
                        : "text-destructive",
                  )}
                >
                  {!isNeutral &&
                    (isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    ))}
                  <span>
                    {isPositive ? "+" : ""}
                    {change.toFixed(2)}
                  </span>
                  <span>
                    ({isPositive ? "+" : ""}
                    {changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Watchlist Button */}
        <div className="mt-3 flex justify-end">
          <WatchlistButton
            stockData={{
              stockSymbol: symbol,
              stockName: companyName,
              exchange: "NSE", // Default to NSE since most stocks are NSE listed
              isin: "company" in stock ? stock.company.isin : stock.isin,
            }}
            variant="outline"
            size="sm"
            showText={true}
            className="text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function StocksPage() {
  // Market data states
  const [topGainers, setTopGainers] = useState<Stock[]>([]);
  const [topLosers, setTopLosers] = useState<Stock[]>([]);
  const [mostBought, setMostBought] = useState<MostBoughtStock[]>([]);
  const [volumeShockers, setVolumeShockers] = useState<Stock[]>([]);
  const [marketTiming, setMarketTiming] = useState<MarketTimingResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);

        // Use the efficient getAllMarketData method
        const data = await marketApi.getAllMarketData({
          gainersPageSize: 4,
          losersPageSize: 4,
          volumePageSize: 6,
          mostBoughtSize: 4,
        });

        setTopGainers(data.topGainers);
        setTopLosers(data.topLosers);
        setMostBought(data.mostBought);
        setVolumeShockers(data.volumeShockers);
        setMarketTiming(data.marketTiming);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching market data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();

    // Refresh data every 30 seconds during market hours
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mock portfolio data - replace with real data from your backend
  const portfolioStats = {
    totalValue: 1000000,
    investedValue: 0,
    currentValue: 1000000,
    totalPnL: 0,
    totalPnLPercent: 0,
    dayPnL: 0,
    dayPnLPercent: 0,
  };

  // Check if market is open
  const marketIsOpen = isMarketOpen(marketTiming);

  return (
    <div className="grid grid-cols-1 gap-6 p-2 lg:grid-cols-3">
      {/* Left Column - Portfolio & Quick Stats */}
      <div className="space-y-6 lg:col-span-2">
        {/* Portfolio Overview */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Portfolio Overview</CardTitle>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                <div
                  className={`h-2 w-2 rounded-full ${marketIsOpen ? "bg-chart-1" : "bg-destructive"}`}
                />
                <span>{marketIsOpen ? "Market Open" : "Market Closed"}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="text-center md:text-left">
                <div className="mb-2 flex items-center justify-center md:justify-start">
                  <div className="bg-chart-1/10 mr-2 rounded-lg p-2">
                    <Wallet className="text-chart-1 h-5 w-5" />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">
                    Total Value
                  </span>
                </div>
                <p className="text-foreground text-3xl font-bold">
                  ₹{portfolioStats.totalValue.toLocaleString()}
                </p>
                <Badge variant="secondary" className="mt-1">
                  Virtual Money
                </Badge>
              </div>

              <div className="text-center md:text-left">
                <div className="mb-2 flex items-center justify-center md:justify-start">
                  <div className="bg-chart-2/10 mr-2 rounded-lg p-2">
                    <Activity className="text-chart-2 h-5 w-5" />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">
                    Invested
                  </span>
                </div>
                <p className="text-foreground text-3xl font-bold">
                  ₹{portfolioStats.investedValue.toLocaleString()}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Available: ₹{portfolioStats.currentValue.toLocaleString()}
                </p>
              </div>

              <div className="text-center md:text-left">
                <div className="mb-2 flex items-center justify-center md:justify-start">
                  <div className="bg-chart-4/10 mr-2 rounded-lg p-2">
                    <PieChart className="text-chart-4 h-5 w-5" />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">
                    Total P&L
                  </span>
                </div>
                <p className="text-muted-foreground text-3xl font-bold">
                  ₹{portfolioStats.totalPnL.toLocaleString()}
                </p>
                <Badge
                  variant={
                    portfolioStats.totalPnLPercent >= 0
                      ? "default"
                      : "destructive"
                  }
                  className="mt-1"
                >
                  {portfolioStats.totalPnLPercent >= 0 ? "+" : ""}
                  {portfolioStats.totalPnLPercent}%
                </Badge>
              </div>
            </div>

            <div className="border-border mt-6 border-t pt-6">
              <div className="flex flex-row gap-2">
                <Link href="/dashboard/portfolio" className="contents">
                  <Button
                    variant="outline"
                    className="hover:border-chart-2/30 hover:bg-chart-2/5 h-auto flex-1 flex-col gap-2 p-4"
                  >
                    <BarChart3 className="text-chart-2 h-5 w-5" />
                    <span className="text-chart-2 font-medium">Portfolio</span>
                  </Button>
                </Link>
                <Link href="/dashboard/watchlist" className="contents">
                  <Button
                    variant="outline"
                    className="hover:border-chart-4/30 hover:bg-chart-4/5 h-auto flex-1 flex-col gap-2 p-4"
                  >
                    <Eye className="text-chart-4 h-5 w-5" />
                    <span className="text-chart-4 font-medium">Watchlist</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Movers */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Top Gainers */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-chart-1/10 rounded-lg p-2">
                    <TrendingUp className="text-chart-1 h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Top Gainers</CardTitle>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <div
                        className={`h-2 w-2 rounded-full ${marketIsOpen ? "bg-chart-1" : "bg-destructive"}`}
                      />
                      {marketIsOpen ? "Live" : "Closed"}
                    </div>
                  </div>
                </div>
                <Link href="/stocks/top-gainers">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-chart-1 hover:bg-chart-1/5 hover:text-chart-1"
                  >
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <SearchSkeleton key={index} />
                  ))
                : topGainers.map((stock, index) => (
                    <StockCard
                      key={stock.searchId || index}
                      stock={stock}
                      type="gainer"
                      size="sm"
                    />
                  ))}
            </CardContent>
          </Card>

          {/* Top Losers */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-destructive/10 rounded-lg p-2">
                    <TrendingDown className="text-destructive h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Top Losers</CardTitle>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <div
                        className={`h-2 w-2 rounded-full ${marketIsOpen ? "bg-chart-1" : "bg-destructive"}`}
                      />
                      {marketIsOpen ? "Live" : "Closed"}
                    </div>
                  </div>
                </div>
                <Link href="/stocks/top-losers">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/5 hover:text-destructive"
                  >
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <SearchSkeleton key={index} />
                  ))
                : topLosers.map((stock, index) => (
                    <StockCard
                      key={stock.searchId || index}
                      stock={stock}
                      type="loser"
                      size="sm"
                    />
                  ))}
            </CardContent>
          </Card>
        </div>

        {/* Most Bought Stocks */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-chart-2/10 rounded-lg p-2">
                  <Users className="text-chart-2 h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Most Bought on Groww
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Popular among investors
                  </p>
                </div>
              </div>
              <Link href="/stocks/most-bought">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-chart-2 hover:bg-chart-2/5 hover:text-chart-2"
                >
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <SearchSkeleton key={index} />
                  ))
                : mostBought.map((stock, index) => (
                    <StockCard
                      key={stock.company.searchId || index}
                      stock={stock}
                      type="popular"
                      size="sm"
                    />
                  ))}
            </div>
          </CardContent>
        </Card>

        {/* Volume Shockers */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-chart-4/10 rounded-lg p-2">
                  <Volume2 className="text-chart-4 h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Volume Shockers</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Unusual trading activity
                  </p>
                </div>
              </div>
              <Link href="/stocks/volume-shockers">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-chart-4 hover:bg-chart-4/5 hover:text-chart-4"
                >
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <SearchSkeleton key={index} />
                  ))
                : volumeShockers.map((stock, index) => (
                    <StockCard
                      key={stock.searchId || index}
                      stock={stock}
                      type="volume"
                      size="sm"
                    />
                  ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Watchlist & Features */}
      <div className="space-y-6">
        {/* Watchlist */}
        <Watchlist maxItems={5} />

        {/* Coming Soon Features */}
        <div className="border-border from-muted/30 to-muted/50 rounded-2xl border bg-gradient-to-br shadow-lg">
          <div className="p-6">
            <div className="mb-4 flex items-center">
              <div className="bg-chart-2 flex h-8 w-8 items-center justify-center rounded-lg">
                <Star className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-foreground ml-3 text-lg font-bold">
                Coming Soon
              </h3>
            </div>
            <div className="space-y-3">
              <div className="bg-background/70 flex items-center rounded-lg p-3">
                <div className="bg-chart-2 mr-3 h-2 w-2 rounded-full"></div>
                <span className="text-foreground text-sm font-medium">
                  Options Trading
                </span>
              </div>
              <div className="bg-background/70 flex items-center rounded-lg p-3">
                <div className="bg-chart-4 mr-3 h-2 w-2 rounded-full"></div>
                <span className="text-foreground text-sm font-medium">
                  Futures Trading
                </span>
              </div>
              <div className="bg-background/70 flex items-center rounded-lg p-3">
                <div className="bg-chart-1 mr-3 h-2 w-2 rounded-full"></div>
                <span className="text-foreground text-sm font-medium">
                  SIP Investment
                </span>
              </div>
              <div className="bg-background/70 flex items-center rounded-lg p-3">
                <div className="bg-chart-5 mr-3 h-2 w-2 rounded-full"></div>
                <span className="text-foreground text-sm font-medium">
                  Mutual Funds
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div className="border-border bg-card rounded-2xl border shadow-lg">
          <div className="p-6">
            <div className="mb-4 flex items-center">
              <HelpCircle className="text-chart-2 mr-2 h-5 w-5" />
              <h3 className="text-foreground text-lg font-bold">Need Help?</h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">
              New to trading? Check out our learning resources to get started.
            </p>
            <button className="bg-chart-2 hover:bg-chart-2/90 w-full rounded-lg px-4 py-2 font-medium text-white transition-colors">
              Learning Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
