"use client";

import ApiClient from "@/utils/ApiClient";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getStockLogoUrl, getStockInitials } from "@/lib/stockUtils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshCw,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { WatchlistButton } from "@/components/trading/WatchlistButton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type Instrument = {
  id?: number;
  exchange: string;
  exchange_token: string;
  trading_symbol: string;
  groww_symbol: string;
  name: string;
  instrument_type: string;
  segment: string;
  series: string;
  isin: string;
  underlying_symbol: string;
  underlying_exchange_token: string;
  expiry_date: string;
  strike_price: number;
  lot_size: number;
  tick_size: number;
  freeze_quantity: number;
  is_reserved: boolean;
  buy_allowed: boolean;
  sell_allowed: boolean;
};

type LiveData = {
  average_price: number;
  bid_quantity: number;
  bid_price: number;
  day_change: number;
  day_change_perc: number;
  upper_circuit_limit: number;
  lower_circuit_limit: number;
  ohlc:
    | string
    | {
        open: number;
        high: number;
        low: number;
        close: number;
      };
  depth: {
    buy: { price: number; quantity: number }[];
    sell: { price: number; quantity: number }[];
  };
  high_trade_range: number;
  implied_volatility: number;
  last_trade_quantity: number;
  last_trade_time: number;
  low_trade_range: number;
  last_price: number;
  market_cap: number;
  offer_price: number;
  offer_quantity: number;
  oi_day_change: number;
  oi_day_change_percentage: number;
  open_interest: number;
  previous_open_interest: number;
  total_buy_quantity: number;
  total_sell_quantity: number;
  volume: number;
  week_52_high: number;
  week_52_low: number;
};

type HistoricalCandle = [number, number, number, number, number, number]; // [timestamp, open, high, low, close, volume]

type HistoricalData = {
  candles: HistoricalCandle[];
  start_time: string;
  end_time: string;
  interval_in_minutes: number;
};

type ChartDataPoint = {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const chartConfig = {
  close: {
    label: "Price",
    color: "hsl(var(--chart-1))",
  },
  volume: {
    label: "Volume",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function StockPage() {
  const { stockId } = useParams();
  const searchParams = useSearchParams();
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(
    null,
  );
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [exchange, setExchange] = useState<"NSE" | "BSE">("NSE");
  const [timeRange, setTimeRange] = useState<
    "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "2Y" | "3Y"
  >("1M");
  const [loading, setLoading] = useState<boolean>(true);
  const [liveDataLoading, setLiveDataLoading] = useState<boolean>(false);
  const [historicalDataLoading, setHistoricalDataLoading] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Read exchange from URL parameters and set it in state
  useEffect(() => {
    const exchangeParam = searchParams.get("exchange");
    if (exchangeParam && (exchangeParam === "NSE" || exchangeParam === "BSE")) {
      setExchange(exchangeParam);
    }
  }, [searchParams]);

  // Trading form state
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"DELIVERY" | "INTRADAY" | "MTF">(
    "DELIVERY",
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [priceType, setPriceType] = useState<"LIMIT" | "MARKET">("LIMIT");

  const fetchInstrumentData = async () => {
    try {
      const {
        data: { data: instrumentData },
      } = await ApiClient.get(`/instruments/${stockId}`);
      setInstrument(instrumentData);
    } catch {
      setError("Failed to fetch instrument data");
    }
  };

  const fetchLiveData = async () => {
    if (!instrument) return;

    setLiveDataLoading(true);
    try {
      const response = await ApiClient.get(
        `/instruments/live-data?exchange=${exchange}&trading_symbol=${instrument.trading_symbol}`,
      );

      if (response.data.success && response.data.quoteData?.payload) {
        setLiveData(response.data.quoteData.payload);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError("No live data available for this instrument");
      }
    } catch (error) {
      console.error("Failed to fetch live data:", error);
      setError(
        "Failed to fetch live data. The market might be closed or the instrument might not be available on the selected exchange.",
      );
    } finally {
      setLiveDataLoading(false);
    }
  };

  const getTimeRangeParams = (range: string) => {
    const now = new Date();
    const endTime = now.toISOString().slice(0, 19).replace("T", " ");
    let startTime: string;
    let intervalMinutes: number;

    switch (range) {
      case "1D":
        startTime = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        intervalMinutes = 15; // 15 minutes for intraday
        break;
      case "1W":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        intervalMinutes = 60; // 1 hour
        break;
      case "1M":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        intervalMinutes = 240; // 4 hours
        break;
      case "3M":
        startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        intervalMinutes = 1440; // 1 day
        break;
      case "6M":
        startTime = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        intervalMinutes = 1440; // 1 day
        break;
      case "1Y":
        startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        intervalMinutes = 10080; // 1 week
        break;
      case "2Y":
        startTime = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        intervalMinutes = 10080; // 1 week
        break;
      case "3Y":
        startTime = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        intervalMinutes = 10080; // 1 week (same as 1Y and 2Y)
        break;
      default:
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        intervalMinutes = 1440;
    }

    return { startTime, endTime, intervalMinutes };
  };

  const fetchHistoricalData = async () => {
    if (!instrument) return;

    setHistoricalDataLoading(true);
    try {
      const { startTime, endTime, intervalMinutes } =
        getTimeRangeParams(timeRange);

      const response = await ApiClient.get(
        `/instruments/historical-data?exchange=${exchange}&trading_symbol=${instrument.trading_symbol}&start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}&interval_in_minutes=${intervalMinutes}`,
      );

      if (
        response.data.success &&
        response.data.historicalData?.payload?.candles
      ) {
        const historical = response.data.historicalData.payload;
        setHistoricalData(historical);

        // Transform candle data for chart
        const chartPoints: ChartDataPoint[] = historical.candles.map(
          (candle: HistoricalCandle) => {
            const date = new Date(candle[0] * 1000);
            const formattedDate =
              intervalMinutes >= 1440
                ? date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : intervalMinutes >= 240
                  ? date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                    });

            return {
              timestamp: candle[0],
              date: formattedDate,
              open: Number(candle[1]),
              high: Number(candle[2]),
              low: Number(candle[3]),
              close: Number(candle[4]),
              volume: Number(candle[5]),
            };
          },
        );

        setChartData(chartPoints);
      } else {
        console.log("No historical data available");
      }
    } catch (error) {
      console.error("Failed to fetch historical data:", error);
    } finally {
      setHistoricalDataLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchInstrumentData();
      setLoading(false);
    };

    initializeData();
  }, [stockId]);

  useEffect(() => {
    if (instrument) {
      fetchLiveData();
    }
  }, [instrument, exchange]);

  useEffect(() => {
    if (instrument) {
      fetchHistoricalData();
    }
  }, [instrument, exchange, timeRange]);

  // Update price when live data changes
  useEffect(() => {
    if (liveData?.last_price && priceType === "LIMIT") {
      setPrice(liveData.last_price);
    }
  }, [liveData?.last_price, priceType]);

  const formatNumber = (num: number | undefined, decimals = 2) => {
    if (num === undefined || num === null) return "-";
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (num: number | undefined) => {
    if (num === undefined || num === null) return "-";
    return `₹${formatNumber(num)}`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const parseOHLC = (
    ohlc: string | { open: number; high: number; low: number; close: number },
  ) => {
    if (typeof ohlc === "string") {
      try {
        // Parse string format like "{open: 149.50,high: 150.50,low: 148.50,close: 149.50}"
        const parsed = ohlc
          .replace(/[{}]/g, "")
          .split(",")
          .reduce((acc, item) => {
            const [key, value] = item.split(":").map((s) => s.trim());
            acc[key] = parseFloat(value);
            return acc;
          }, {} as any);
        return parsed;
      } catch (error) {
        console.error("Failed to parse OHLC:", error);
        return { open: 0, high: 0, low: 0, close: 0 };
      }
    }
    return ohlc;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border-border rounded-lg border p-3 shadow-lg">
          <p className="mb-2 font-semibold">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Open:</span>
              <span className="font-medium">₹{data.open.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">High:</span>
              <span className="text-chart-1 font-medium">
                ₹{data.high.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Low:</span>
              <span className="text-destructive font-medium">
                ₹{data.low.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Close:</span>
              <span className="font-medium">₹{data.close.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium">
                {data.volume.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading)
    return (
      <div className="w-full space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content Skeleton */}
          <div className="flex-1 space-y-6">
            {/* Live Price Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2 text-center">
                      <Skeleton className="mx-auto h-4 w-20" />
                      <Skeleton className="mx-auto h-8 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chart Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-10" />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-80 w-full px-6 pb-6">
                  <Skeleton className="h-full w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Volume Chart and Stats Skeleton */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-48 w-full px-6 pb-6">
                    <Skeleton className="h-full w-full" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Buy/Sell Section Skeleton */}
          <div className="w-80 space-y-4">
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-16" />
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  if (error)
    return <div className="text-destructive p-8 text-center">{error}</div>;

  const isAnyLoading = liveDataLoading || historicalDataLoading;

  return (
    <div className="relative">
      <div className="w-full space-y-6 p-6">
        {/* Main Layout: Content on left, Buy/Sell on right */}
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                {instrument && (
                  <img
                    src={getStockLogoUrl(instrument.trading_symbol)}
                    alt={`${instrument.name} logo`}
                    className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      // Show initials fallback
                      const fallback =
                        target.nextElementSibling as HTMLDivElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                )}
                {instrument && (
                  <div
                    className="bg-primary/10 text-primary flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                    style={{ display: "none" }}
                  >
                    {getStockInitials(instrument.name)}
                  </div>
                )}
                <div>
                  <h1 className="text-primary text-3xl font-bold">
                    {instrument?.name}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {instrument?.trading_symbol} • {exchange} •{" "}
                    {instrument?.segment}
                  </p>
                </div>
                {instrument && (
                  <div className="mt-1">
                    <WatchlistButton
                      stockData={{
                        stockSymbol: stockId as string,
                        stockName: instrument.name,
                        exchange: exchange,
                        isin: instrument.isin || undefined,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Exchange Selector */}
              <div className="flex gap-2">
                <Button
                  variant={exchange === "NSE" ? "default" : "outline"}
                  onClick={() => setExchange("NSE")}
                  disabled={liveDataLoading}
                >
                  NSE
                </Button>
                <Button
                  variant={exchange === "BSE" ? "default" : "outline"}
                  onClick={() => setExchange("BSE")}
                  disabled={liveDataLoading}
                >
                  BSE
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchLiveData}
                  disabled={liveDataLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${liveDataLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Live Price Section */}
            {liveDataLoading ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-2 text-center">
                        <Skeleton className="mx-auto h-4 w-20" />
                        <Skeleton className="mx-auto h-8 w-24" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              liveData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Live Price ({exchange})</CardTitle>
                      {lastUpdated && (
                        <span className="text-muted-foreground text-sm">
                          Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">
                          Last Price
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(liveData.last_price)}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">
                          Day Change
                        </p>
                        <div
                          className={`flex items-center justify-center gap-1 ${
                            liveData.day_change >= 0
                              ? "text-chart-1"
                              : "text-destructive"
                          }`}
                        >
                          {liveData.day_change >= 0 ? (
                            <ArrowUpIcon className="h-4 w-4" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4" />
                          )}
                          <span className="font-semibold">
                            {formatCurrency(liveData.day_change)} (
                            {liveData.day_change_perc?.toFixed(2)}%)
                          </span>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">Volume</p>
                        <p className="text-lg font-semibold">
                          {formatNumber(liveData.volume, 0)}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">
                          Avg Price
                        </p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(liveData.average_price)}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">
                          Market Cap
                        </p>
                        <p className="text-lg font-semibold">
                          {liveData.market_cap
                            ? `₹${(liveData.market_cap / 10000000).toFixed(2)}Cr`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}

            {/* Error message for live data */}
            {!liveData && !liveDataLoading && error && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-muted-foreground text-center">
                    <p>{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={fetchLiveData}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading state for live data */}
            {liveDataLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-muted-foreground text-center">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    <p>Fetching live data...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historical Chart Section */}
            <div className="space-y-6">
              {/* Chart Header with Time Range Selector */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      <CardTitle>Price Chart</CardTitle>
                      {historicalDataLoading && (
                        <RefreshCw className="text-muted-foreground h-4 w-4 animate-spin" />
                      )}
                    </div>

                    {/* Time Range Buttons */}
                    <div className="flex flex-wrap gap-1">
                      {(
                        [
                          "1D",
                          "1W",
                          "1M",
                          "3M",
                          "6M",
                          "1Y",
                          "2Y",
                          "3Y",
                        ] as const
                      ).map((range) => (
                        <Button
                          key={range}
                          variant={timeRange === range ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setTimeRange(range)}
                          disabled={historicalDataLoading}
                          className="h-8 px-3 py-1 text-sm"
                        >
                          {range}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {chartData.length > 0 ? (
                    <div className="h-80 w-full px-6 pb-6">
                      <ChartContainer
                        config={chartConfig}
                        className="h-full w-full"
                      >
                        <LineChart
                          accessibilityLayer
                          data={chartData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border)"
                            opacity={0.3}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 12,
                              fill: "var(--color-muted-foreground)",
                            }}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 12,
                              fill: "var(--color-muted-foreground)",
                            }}
                            domain={["dataMin - 10", "dataMax + 10"]}
                            tickFormatter={(value) => `₹${value.toFixed(0)}`}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="close"
                            stroke="var(--color-chart-1)"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{
                              r: 4,
                              stroke: "var(--color-chart-1)",
                              strokeWidth: 2,
                              fill: "var(--color-background)",
                            }}
                            connectNulls={true}
                          />
                        </LineChart>
                      </ChartContainer>
                    </div>
                  ) : historicalDataLoading ? (
                    <div className="space-y-4 p-6">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-64 w-full rounded-lg" />
                        <div className="flex justify-between pt-2">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-80 items-center justify-center">
                      <div className="text-muted-foreground text-center">
                        <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p className="mb-3 text-sm">No chart data available</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchHistoricalData}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chart Statistics and Volume */}
              {chartData.length > 0 && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Volume Chart */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Volume Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-48 w-full px-6 pb-6">
                        <ChartContainer
                          config={chartConfig}
                          className="h-full w-full"
                        >
                          <BarChart accessibilityLayer data={chartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--color-border)"
                              opacity={0.3}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 10,
                                fill: "var(--color-muted-foreground)",
                              }}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 10,
                                fill: "var(--color-muted-foreground)",
                              }}
                              tickFormatter={(value) => {
                                if (value >= 1000000)
                                  return `${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000)
                                  return `${(value / 1000).toFixed(1)}K`;
                                return value.toString();
                              }}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                              dataKey="volume"
                              fill="var(--color-chart-2)"
                              opacity={0.7}
                              radius={[2, 2, 0, 0]}
                            />
                          </BarChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chart Statistics */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Period Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            High
                          </span>
                          <span className="text-chart-1 font-semibold">
                            ₹
                            {Math.max(...chartData.map((d) => d.high)).toFixed(
                              2,
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Low
                          </span>
                          <span className="text-destructive font-semibold">
                            ₹
                            {Math.min(...chartData.map((d) => d.low)).toFixed(
                              2,
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Avg Volume
                          </span>
                          <span className="font-semibold">
                            {Math.round(
                              chartData.reduce((sum, d) => sum + d.volume, 0) /
                                chartData.length,
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Total Volume
                          </span>
                          <span className="font-semibold">
                            {chartData
                              .reduce((sum, d) => sum + d.volume, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Data Points
                          </span>
                          <span className="font-semibold">
                            {chartData.length}
                          </span>
                        </div>
                        {chartData.length >= 2 && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground text-sm">
                                Period Start
                              </span>
                              <span className="text-xs font-semibold">
                                {new Date(chartData[0].date).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground text-sm">
                                Period End
                              </span>
                              <span className="text-xs font-semibold">
                                {new Date(
                                  chartData[chartData.length - 1].date,
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </>
                        )}
                        {chartData.length >= 2 && (
                          <div className="flex items-center justify-between border-t pt-2">
                            <span className="text-muted-foreground text-sm">
                              Period Change
                            </span>
                            <div className="text-right">
                              <div
                                className={`font-semibold ${
                                  chartData[chartData.length - 1].close >=
                                  chartData[0].open
                                    ? "text-chart-1"
                                    : "text-destructive"
                                }`}
                              >
                                {(
                                  ((chartData[chartData.length - 1].close -
                                    chartData[0].open) /
                                    chartData[0].open) *
                                  100
                                ).toFixed(2)}
                                %
                              </div>
                              <div className="text-muted-foreground text-xs">
                                ₹
                                {(
                                  chartData[chartData.length - 1].close -
                                  chartData[0].open
                                ).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Market Overview Section */}
            {liveData && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* OHLC Data */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Today's Range</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const ohlcData = parseOHLC(liveData.ohlc);
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                              Open
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(ohlcData.open)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                              High
                            </span>
                            <span className="text-chart-1 font-semibold">
                              {formatCurrency(ohlcData.high)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                              Low
                            </span>
                            <span className="text-destructive font-semibold">
                              {formatCurrency(ohlcData.low)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                              Close
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(ohlcData.close)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Circuit Limits */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Circuit Limits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Upper Circuit
                      </span>
                      <span className="text-chart-1 font-semibold">
                        {formatCurrency(liveData.upper_circuit_limit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Lower Circuit
                      </span>
                      <span className="text-destructive font-semibold">
                        {formatCurrency(liveData.lower_circuit_limit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        52W High
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(liveData.week_52_high)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        52W Low
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(liveData.week_52_low)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Market Depth Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Bid/Ask</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Bid Price
                      </span>
                      <span className="text-chart-1 font-semibold">
                        {formatCurrency(liveData.bid_price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Ask Price
                      </span>
                      <span className="text-destructive font-semibold">
                        {formatCurrency(liveData.offer_price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Total Buy Qty
                      </span>
                      <span className="text-sm font-medium">
                        {formatNumber(liveData.total_buy_quantity, 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Total Sell Qty
                      </span>
                      <span className="text-sm font-medium">
                        {formatNumber(liveData.total_sell_quantity, 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Metrics */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Volume
                      </span>
                      <span className="font-semibold">
                        {formatNumber(liveData.volume, 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Avg Price
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(liveData.average_price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Market Cap
                      </span>
                      <span className="text-sm font-medium">
                        {liveData.market_cap
                          ? `₹${(liveData.market_cap / 10000000).toFixed(2)}Cr`
                          : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Last Trade
                      </span>
                      <span className="text-sm font-medium">
                        {formatNumber(liveData.last_trade_quantity, 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Detailed Market Depth */}
            {liveData?.depth && (
              <Card>
                <CardHeader>
                  <CardTitle>Market Depth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="text-chart-1 mb-3 text-sm font-semibold tracking-wide uppercase">
                        Buy Orders
                      </h4>
                      <div className="space-y-2">
                        <div className="text-muted-foreground grid grid-cols-3 gap-2 border-b pb-2 text-xs">
                          <span>Price</span>
                          <span className="text-center">Qty</span>
                          <span className="text-right">Total</span>
                        </div>
                        {liveData.depth.buy?.slice(0, 5).map((order, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-3 gap-2 text-sm"
                          >
                            <span className="text-chart-1 font-medium">
                              {formatCurrency(order.price)}
                            </span>
                            <span className="text-center">
                              {formatNumber(order.quantity, 0)}
                            </span>
                            <span className="text-right font-medium">
                              {formatCurrency(order.price * order.quantity)}
                            </span>
                          </div>
                        )) || (
                          <p className="text-muted-foreground py-4 text-center text-sm">
                            No buy orders available
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-destructive mb-3 text-sm font-semibold tracking-wide uppercase">
                        Sell Orders
                      </h4>
                      <div className="space-y-2">
                        <div className="text-muted-foreground grid grid-cols-3 gap-2 border-b pb-2 text-xs">
                          <span>Price</span>
                          <span className="text-center">Qty</span>
                          <span className="text-right">Total</span>
                        </div>
                        {liveData.depth.sell
                          ?.slice(0, 5)
                          .map((order, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-3 gap-2 text-sm"
                            >
                              <span className="text-destructive font-medium">
                                {formatCurrency(order.price)}
                              </span>
                              <span className="text-center">
                                {formatNumber(order.quantity, 0)}
                              </span>
                              <span className="text-right font-medium">
                                {formatCurrency(order.price * order.quantity)}
                              </span>
                            </div>
                          )) || (
                          <p className="text-muted-foreground py-4 text-center text-sm">
                            No sell orders available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instrument Details */}
            <Card>
              <CardHeader>
                <CardTitle>Instrument Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {instrument &&
                    Object.entries(instrument).map(([key, value]) => {
                      if (key === "id" || key === "name") return null;
                      return (
                        <div key={key} className="space-y-1">
                          <p className="text-muted-foreground text-sm capitalize">
                            {key.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm font-medium">
                            {typeof value === "boolean"
                              ? value
                                ? "Yes"
                                : "No"
                              : String(value)}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Buy/Sell Section */}
          <div className="w-80 space-y-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{instrument?.trading_symbol || "Stock"}</span>
                  <div className="text-right text-sm">
                    <div className="font-semibold">
                      {formatCurrency(liveData?.last_price || 0)}
                    </div>
                    <div
                      className={`text-xs ${
                        (liveData?.day_change || 0) >= 0
                          ? "text-chart-1"
                          : "text-destructive"
                      }`}
                    >
                      {liveData?.day_change_perc?.toFixed(2)}%
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Buy/Sell Toggle */}
                <div className="bg-muted flex rounded-lg p-1">
                  <Button
                    variant={orderSide === "BUY" ? "default" : "ghost"}
                    className={`flex-1 rounded-md ${
                      orderSide === "BUY"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : ""
                    }`}
                    onClick={() => setOrderSide("BUY")}
                  >
                    BUY
                  </Button>
                  <Button
                    variant={orderSide === "SELL" ? "default" : "ghost"}
                    className={`flex-1 rounded-md ${
                      orderSide === "SELL"
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : ""
                    }`}
                    onClick={() => setOrderSide("SELL")}
                  >
                    SELL
                  </Button>
                </div>

                {/* Order Type Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Order Type</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={orderType === "DELIVERY" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setOrderType("DELIVERY")}
                    >
                      Delivery
                    </Button>
                    <Button
                      variant={orderType === "INTRADAY" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setOrderType("INTRADAY")}
                    >
                      Intraday
                    </Button>
                    <Button
                      variant={orderType === "MTF" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setOrderType("MTF")}
                    >
                      MTF
                    </Button>
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Quantity
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                      min="1"
                    />
                    <span className="text-muted-foreground text-xs">qty</span>
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">
                    Price
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="price"
                      type="number"
                      placeholder={liveData?.last_price?.toString() || "0"}
                      value={price || liveData?.last_price || 0}
                      onChange={(e) => setPrice(Number(e.target.value) || 0)}
                      step="0.01"
                      disabled={priceType === "MARKET"}
                    />
                    <select
                      className="border-input bg-background h-10 rounded-md border px-3 py-2 text-xs"
                      value={priceType}
                      onChange={(e) =>
                        setPriceType(e.target.value as "LIMIT" | "MARKET")
                      }
                    >
                      <option value="LIMIT">Limit</option>
                      <option value="MARKET">Market</option>
                    </select>
                  </div>
                </div>

                {/* Investment Summary */}
                <div className="bg-muted space-y-2 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span>Balance:</span>
                    <span className="font-medium">₹0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Approx required:</span>
                    <span className="font-medium">
                      ₹
                      {(
                        (price || liveData?.last_price || 0) * quantity
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Buy/Sell Button */}
                <Button
                  className={`w-full ${
                    orderSide === "BUY"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  onClick={() => {
                    // Handle order placement
                    console.log("Order placed:", {
                      side: orderSide,
                      type: orderType,
                      quantity,
                      price: priceType === "MARKET" ? "MARKET" : price,
                      symbol: instrument?.trading_symbol,
                    });
                  }}
                >
                  {orderSide === "BUY" ? "Buy" : "Sell"}{" "}
                  {instrument?.trading_symbol || "Stock"}
                </Button>

                {/* Charges Breakdown */}
                <div className="text-muted-foreground space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Brokerage:</span>
                    <span>₹5.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST:</span>
                    <span>₹0.90</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total charges:</span>
                    <span>₹5.90</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
