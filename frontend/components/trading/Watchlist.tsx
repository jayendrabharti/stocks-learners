"use client";

import React from "react";
import Link from "next/link";
import { useWatchlist } from "../../providers/WatchlistProvider";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface WatchlistProps {
  showHeader?: boolean;
  maxItems?: number;
  variant?: "default" | "compact";
}

export const Watchlist: React.FC<WatchlistProps> = ({
  showHeader = true,
  maxItems,
  variant = "default",
}) => {
  const {
    watchlist,
    loading,
    error,
    removeFromWatchlist,
    clearWatchlist,
    refreshWatchlist,
    watchlistCount,
  } = useWatchlist();

  const displayItems = maxItems ? watchlist.slice(0, maxItems) : watchlist;
  const isCompact = variant === "compact";

  if (loading) {
    return (
      <Card className="border-border bg-background">
        {showHeader && (
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground flex items-center">
              <Star className="text-chart-5 mr-2 h-5 w-5" />
              Watchlist
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={isCompact ? "p-4" : "p-6"}>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-muted/30 animate-pulse rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="bg-muted h-4 w-20 rounded" />
                    <div className="bg-muted h-3 w-16 rounded" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="bg-muted h-4 w-12 rounded" />
                    <div className="bg-muted h-3 w-10 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border bg-background">
        {showHeader && (
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground flex items-center">
              <Star className="text-chart-5 mr-2 h-5 w-5" />
              Watchlist
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={isCompact ? "p-4" : "p-6"}>
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshWatchlist}
              className="text-chart-1 border-chart-1 hover:bg-chart-1/5"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (watchlist.length === 0) {
    return (
      <Card className="border-border bg-background">
        {showHeader && (
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground flex items-center">
              <Star className="text-chart-5 mr-2 h-5 w-5" />
              Watchlist
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={isCompact ? "p-4" : "p-6"}>
          <div className="space-y-4 text-center">
            <Eye className="text-muted-foreground/50 mx-auto h-12 w-12" />
            <div>
              <p className="text-foreground font-medium">
                No stocks in watchlist
              </p>
              <p className="text-muted-foreground text-sm">
                Add stocks to your watchlist to track their performance
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-chart-1 hover:bg-chart-1/90"
            >
              <Link href="/stocks">Browse Stocks</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-background">
      {showHeader && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center">
              <Star className="text-chart-5 mr-2 h-5 w-5" />
              Watchlist
              <Badge
                variant="secondary"
                className="bg-chart-1/10 text-chart-1 ml-2"
              >
                {watchlistCount}
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshWatchlist}
                className="h-8 w-8 p-0"
                title="Refresh watchlist"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {!isCompact && watchlist.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearWatchlist}
                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                  title="Clear watchlist"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className={isCompact ? "p-4" : "p-6"}>
        <div className="space-y-3">
          {displayItems.map((item) => (
            <WatchlistItem
              key={item.id}
              item={item}
              onRemove={removeFromWatchlist}
              compact={isCompact}
            />
          ))}
        </div>

        {maxItems && watchlist.length > maxItems && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" asChild>
              <Link href="/stocks">View All {watchlistCount} Stocks</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface WatchlistItemProps {
  item: any;
  onRemove: (stockSymbol: string, exchange: string) => Promise<void>;
  compact?: boolean;
}

const WatchlistItem: React.FC<WatchlistItemProps> = ({
  item,
  onRemove,
  compact = false,
}) => {
  const [removing, setRemoving] = React.useState(false);

  // For now, we'll use mock price data since we don't have live price integration yet
  // In a real implementation, you would fetch current market prices for each stock
  const mockPrice = Math.random() * 1000 + 100;
  const mockChange = (Math.random() - 0.5) * 20;
  const mockChangePercent = (mockChange / mockPrice) * 100;

  const isPositive = mockChange >= 0;
  const isNeutral = mockChange === 0;

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setRemoving(true);
      await onRemove(item.stockSymbol, item.exchange);
    } catch (error) {
      console.error("Error removing from watchlist:", error);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Link href={`/stocks/${item.stockSymbol}`}>
      <div
        className={cn(
          "bg-muted/30 hover:bg-muted/50 group flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors",
          compact && "p-2",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <p
              className={cn(
                "text-foreground font-semibold",
                compact && "text-sm",
              )}
            >
              {item.stockSymbol}
            </p>
            <Badge variant="outline" className="text-xs">
              {item.exchange}
            </Badge>
          </div>
          <p
            className={cn(
              "text-muted-foreground truncate",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {item.stockName}
          </p>
          <p
            className={cn(
              "text-muted-foreground",
              compact ? "text-xs" : "text-sm",
            )}
          >
            ₹{mockPrice.toFixed(2)}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="flex items-center space-x-1">
              {isPositive ? (
                <TrendingUp className="text-chart-1 h-3 w-3" />
              ) : isNeutral ? (
                <Minus className="text-muted-foreground h-3 w-3" />
              ) : (
                <TrendingDown className="text-destructive h-3 w-3" />
              )}
              <p
                className={cn(
                  "font-semibold",
                  compact ? "text-xs" : "text-sm",
                  isPositive
                    ? "text-chart-1"
                    : isNeutral
                      ? "text-muted-foreground"
                      : "text-destructive",
                )}
              >
                {isPositive ? "+" : ""}
                {mockChange.toFixed(2)}
              </p>
            </div>
            <p
              className={cn(
                compact ? "text-xs" : "text-sm",
                isPositive
                  ? "text-chart-1"
                  : isNeutral
                    ? "text-muted-foreground"
                    : "text-destructive",
              )}
            >
              {isPositive ? "+" : ""}
              {mockChangePercent.toFixed(2)}%
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={removing}
            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
            title="Remove from watchlist"
          >
            {removing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Link>
  );
};
