"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PortfolioHolding,
  getPurchaseLots,
  PurchaseLot,
} from "@/services/tradingApi";
import { useWallet } from "@/hooks/useWallet";
import { usePortfolio } from "@/providers/PortfolioProvider";
import {
  SellStockDialog,
  MarketStatus,
  ProductTypeInfo,
} from "@/components/trading";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wallet,
  BarChart3,
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ApiClient from "@/utils/ApiClient";

// Extended holding with live price data
interface HoldingWithLivePrice extends PortfolioHolding {
  livePrice?: number;
  livePnL?: number;
  livePnLPercent?: number;
  liveCurrentValue?: number;
  isExpanded?: boolean;
  purchaseLots?: PurchaseLot[];
  lotsLoading?: boolean;
}

export default function PortfolioPage() {
  // Use PortfolioProvider for holdings data
  const {
    allHoldings,
    cncHoldings,
    misHoldings,
    summary,
    warnings,
    loading,
    refreshing,
    refreshPortfolio,
    portfolioStats,
    lastUpdated,
    isMarketOpen: marketOpen,
  } = usePortfolio();

  const [error, setError] = useState<string | null>(null);
  const [selectedHolding, setSelectedHolding] =
    useState<HoldingWithLivePrice | null>(null);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "cnc" | "mis">("all");

  // Separate state for expansion - keyed by holding ID
  const [expandedHoldings, setExpandedHoldings] = useState<
    Record<string, boolean>
  >({});
  const [purchaseLotsCache, setPurchaseLotsCache] = useState<
    Record<string, PurchaseLot[]>
  >({});
  const [lotsLoading, setLotsLoading] = useState<Record<string, boolean>>({});

  const { summary: walletSummary, loading: walletLoading } = useWallet();

  const handleSellClick = (holding: PortfolioHolding) => {
    setSelectedHolding(holding);
    setShowSellDialog(true);
  };

  const handleSellSuccess = () => {
    refreshPortfolio(); // Refresh portfolio after sale
  };

  // Toggle expansion and fetch purchase lots if not already loaded
  const toggleExpanded = async (holding: HoldingWithLivePrice) => {
    const isCurrentlyExpanded = expandedHoldings[holding.id] || false;
    const newExpandedState = !isCurrentlyExpanded;

    // Update expansion state
    setExpandedHoldings((prev) => ({
      ...prev,
      [holding.id]: newExpandedState,
    }));

    // If expanding and lots not loaded, fetch them
    if (newExpandedState && !purchaseLotsCache[holding.id]) {
      fetchPurchaseLots(holding);
    }
  };

  // Fetch purchase lots for a specific holding
  const fetchPurchaseLots = async (holding: HoldingWithLivePrice) => {
    try {
      // Mark as loading
      setLotsLoading((prev) => ({ ...prev, [holding.id]: true }));

      const lotsData = await getPurchaseLots(
        holding.stockSymbol,
        holding.exchange,
        holding.product,
      );

      // Cache the lots
      setPurchaseLotsCache((prev) => ({
        ...prev,
        [holding.id]: lotsData.purchaseLots,
      }));

      setLotsLoading((prev) => ({ ...prev, [holding.id]: false }));
    } catch (error) {
      console.error("Error fetching purchase lots:", error);
      setLotsLoading((prev) => ({ ...prev, [holding.id]: false }));
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  const formatDecimal = (value: string | number, decimals: number = 2) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return numValue.toFixed(decimals);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground mb-4 text-lg">{error}</p>
            <Button onClick={refreshPortfolio}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use portfolio stats from provider (calculated with live prices)
  const totalInvested = portfolioStats.totalInvested;
  const currentValue = portfolioStats.currentValue;
  const totalPnL = portfolioStats.totalPnL;
  const totalPnLPercent = portfolioStats.totalPnLPercent;
  const isPnLPositive = totalPnL >= 0;

  // Get the current holdings based on active tab
  const displayHoldings =
    activeTab === "all"
      ? allHoldings
      : activeTab === "cnc"
        ? cncHoldings
        : misHoldings;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">
            Track your investments and performance
          </p>
          {lastUpdated && (
            <p className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3" />
              Last updated: {lastUpdated.toLocaleTimeString("en-IN")}
              <span className="mx-1">•</span>
              <div
                className={`h-2 w-2 rounded-full ${marketOpen ? "bg-chart-1" : "bg-destructive"}`}
              />
              <span>{marketOpen ? "Market Open" : "Market Closed"}</span>
              {refreshing && (
                <>
                  <span className="mx-1">•</span>
                  <span className="animate-pulse">Updating...</span>
                </>
              )}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshPortfolio}
          disabled={refreshing}
        >
          <RefreshCw
            className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Market Status */}
      <div className="mb-6">
        <MarketStatus showFullMessage />
      </div>

      {/* Warnings for stale MIS positions */}
      {warnings?.staleMISPositions && warnings.staleMISPositions.count > 0 && (
        <div className="mb-6">
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                  Stale Intraday Positions Detected
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  You have {warnings.staleMISPositions.count} MIS position(s)
                  from previous trading day(s). These should have been squared
                  off by 3:30 PM IST on the trading day. Please close these
                  positions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {/* Virtual Cash */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Virtual Cash</CardTitle>
            <Wallet className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.virtualCash || "0")}
            </div>
            <p className="text-muted-foreground text-xs">Available to invest</p>
          </CardContent>
        </Card>

        {/* Total Invested */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invested</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalInvested)}
            </div>
            <p className="text-muted-foreground text-xs">
              Total amount invested
            </p>
          </CardContent>
        </Card>

        {/* Current Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentValue)}
            </div>
            <p className="text-muted-foreground text-xs">Portfolio value</p>
          </CardContent>
        </Card>

        {/* Total P&L */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {isPnLPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                isPnLPositive ? "text-green-600" : "text-red-600",
              )}
            >
              {isPnLPositive ? "+" : ""}
              {formatCurrency(totalPnL)}
            </div>
            <p
              className={cn(
                "text-xs",
                isPnLPositive ? "text-green-600" : "text-red-600",
              )}
            >
              {isPnLPositive ? "+" : ""}
              {formatDecimal(totalPnLPercent, 2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Holdings ({allHoldings.length})</CardTitle>
            {(cncHoldings.length > 0 || misHoldings.length > 0) && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={activeTab === "all" ? "default" : "outline"}
                  onClick={() => setActiveTab("all")}
                >
                  All ({allHoldings.length})
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "cnc" ? "default" : "outline"}
                  onClick={() => setActiveTab("cnc")}
                  className="flex items-center gap-1"
                >
                  CNC ({cncHoldings.length})
                  <ProductTypeInfo productType="CNC" />
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "mis" ? "default" : "outline"}
                  onClick={() => setActiveTab("mis")}
                  className="flex items-center gap-1"
                >
                  MIS ({misHoldings.length})
                  <ProductTypeInfo productType="MIS" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayHoldings.length === 0 ? (
            <div className="py-12 text-center">
              <BarChart3 className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">
                {activeTab === "all"
                  ? "No holdings yet"
                  : activeTab === "cnc"
                    ? "No delivery holdings"
                    : "No intraday positions"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === "all"
                  ? "Start investing by searching for stocks"
                  : activeTab === "cnc"
                    ? "You don't have any delivery holdings"
                    : "You don't have any intraday positions"}
              </p>
              {activeTab === "all" && (
                <Link href="/stocks">
                  <Button>Explore Stocks</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">
                      <div className="w-6" /> {/* Space for expand icon */}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Stock</th>
                    <th className="px-4 py-3 text-right font-medium">Qty</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Avg Price
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Current Price
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Invested
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Current Value
                    </th>
                    <th className="px-4 py-3 text-right font-medium">P&L</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayHoldings.map((holding) => {
                    // Use live P&L if available, fallback to stored values
                    const pnl =
                      holding.livePnL ??
                      parseFloat(holding.unrealizedPnL || "0");
                    const pnlPercent =
                      holding.livePnLPercent ?? holding.unrealizedPnLPerc ?? 0;
                    const currentPrice =
                      holding.livePrice ??
                      parseFloat(holding.currentPrice || "0");
                    const currentValue =
                      holding.liveCurrentValue ??
                      parseFloat(holding.currentValue || "0");
                    const isProfitable = pnl >= 0;

                    return (
                      <React.Fragment key={holding.id}>
                        <tr className="hover:bg-accent/50 border-b">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleExpanded(holding)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Show purchase lots"
                            >
                              {expandedHoldings[holding.id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/stocks/${holding.stockSymbol}?exchange=${holding.exchange}`}
                              className="hover:underline"
                            >
                              <div className="flex items-center gap-2">
                                <div className="font-medium">
                                  {holding.stockSymbol}
                                </div>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-xs font-medium",
                                    holding.product === "CNC"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                      : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
                                  )}
                                >
                                  {holding.product}
                                </span>
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {holding.stockName}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {holding.exchange}
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {holding.quantity}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(holding.averagePrice)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(currentPrice)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(holding.totalInvested)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(currentValue)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div
                              className={cn(
                                "font-medium",
                                isProfitable
                                  ? "text-green-600"
                                  : "text-red-600",
                              )}
                            >
                              {isProfitable ? "+" : ""}
                              {formatCurrency(pnl)}
                            </div>
                            <div
                              className={cn(
                                "text-xs",
                                isProfitable
                                  ? "text-green-600"
                                  : "text-red-600",
                              )}
                            >
                              {isProfitable ? "+" : ""}
                              {formatDecimal(pnlPercent, 2)}%
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSellClick(holding)}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              Sell
                            </Button>
                          </td>
                        </tr>

                        {/* Nested Purchase Lots */}
                        {expandedHoldings[holding.id] && (
                          <tr className="bg-accent/30">
                            <td colSpan={9} className="px-4 py-3">
                              {lotsLoading[holding.id] ? (
                                <div className="flex items-center justify-center py-4">
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  <span className="text-muted-foreground text-sm">
                                    Loading purchase history...
                                  </span>
                                </div>
                              ) : purchaseLotsCache[holding.id] &&
                                purchaseLotsCache[holding.id].length > 0 ? (
                                <div className="ml-8">
                                  <h4 className="text-muted-foreground mb-2 text-sm font-semibold">
                                    Purchase History (
                                    {purchaseLotsCache[holding.id].length}{" "}
                                    {purchaseLotsCache[holding.id].length === 1
                                      ? "lot"
                                      : "lots"}
                                    )
                                  </h4>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-border/50 border-b">
                                        <th className="text-muted-foreground py-2 text-left font-medium">
                                          Date
                                        </th>
                                        <th className="text-muted-foreground py-2 text-right font-medium">
                                          Qty
                                        </th>
                                        <th className="text-muted-foreground py-2 text-right font-medium">
                                          Purchase Price
                                        </th>
                                        <th className="text-muted-foreground py-2 text-right font-medium">
                                          Invested
                                        </th>
                                        <th className="text-muted-foreground py-2 text-right font-medium">
                                          Current Value
                                        </th>
                                        <th className="text-muted-foreground py-2 text-right font-medium">
                                          P&L
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {purchaseLotsCache[holding.id].map(
                                        (lot) => {
                                          // Recalculate with LIVE price from main holding
                                          const liveCurrentPrice =
                                            holding.livePrice ??
                                            parseFloat(holding.currentPrice);
                                          const lotCurrentValue =
                                            liveCurrentPrice * lot.quantity;
                                          const lotInvested = parseFloat(
                                            lot.totalInvested,
                                          );
                                          const lotPnl =
                                            lotCurrentValue - lotInvested;
                                          const lotPnlPercent =
                                            lotInvested > 0
                                              ? (lotPnl / lotInvested) * 100
                                              : 0;
                                          const isLotProfitable = lotPnl >= 0;

                                          return (
                                            <tr
                                              key={lot.id}
                                              className="border-border/30 border-b"
                                            >
                                              <td className="text-muted-foreground py-2 text-left">
                                                {new Date(
                                                  lot.purchaseDate,
                                                ).toLocaleDateString("en-IN", {
                                                  day: "2-digit",
                                                  month: "short",
                                                  year: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </td>
                                              <td className="py-2 text-right">
                                                {lot.quantity}
                                              </td>
                                              <td className="py-2 text-right">
                                                {formatCurrency(
                                                  lot.purchasePrice,
                                                )}
                                              </td>
                                              <td className="py-2 text-right">
                                                {formatCurrency(
                                                  lot.totalInvested,
                                                )}
                                              </td>
                                              <td className="py-2 text-right">
                                                {formatCurrency(
                                                  lotCurrentValue,
                                                )}
                                              </td>
                                              <td className="py-2 text-right">
                                                <div
                                                  className={cn(
                                                    "font-medium",
                                                    isLotProfitable
                                                      ? "text-green-600"
                                                      : "text-red-600",
                                                  )}
                                                >
                                                  {isLotProfitable ? "+" : ""}
                                                  {formatCurrency(lotPnl)}
                                                </div>
                                                <div
                                                  className={cn(
                                                    "text-xs",
                                                    isLotProfitable
                                                      ? "text-green-600"
                                                      : "text-red-600",
                                                  )}
                                                >
                                                  {isLotProfitable ? "+" : ""}
                                                  {formatDecimal(
                                                    lotPnlPercent,
                                                    2,
                                                  )}
                                                  %
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        },
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-muted-foreground py-2 text-center text-sm">
                                  No purchase history found
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sell Dialog */}
      {selectedHolding && (
        <SellStockDialog
          open={showSellDialog}
          onClose={() => {
            setShowSellDialog(false);
            setSelectedHolding(null);
          }}
          stock={{
            symbol: selectedHolding.stockSymbol,
            name: selectedHolding.stockName,
            exchange: selectedHolding.exchange,
            currentPrice:
              selectedHolding.livePrice ??
              parseFloat(selectedHolding.currentPrice || "0"),
            isin: selectedHolding.isin,
          }}
          holding={{
            quantity: selectedHolding.quantity,
            averagePrice: parseFloat(selectedHolding.averagePrice),
            product: selectedHolding.product,
          }}
          onSuccess={handleSellSuccess}
        />
      )}
    </div>
  );
}
