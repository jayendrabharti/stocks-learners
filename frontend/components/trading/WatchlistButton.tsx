"use client";

import React, { useState } from "react";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { Button } from "@/components/ui/button";
import { Star, Plus, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddToWatchlistRequest } from "@/services/watchlistApi";

interface WatchlistButtonProps {
  stockData: AddToWatchlistRequest;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showText?: boolean;
  className?: string;
}

export const WatchlistButton: React.FC<WatchlistButtonProps> = ({
  stockData,
  variant = "outline",
  size = "sm",
  showText = true,
  className,
}) => {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [loading, setLoading] = useState(false);

  const inWatchlist = isInWatchlist(stockData.stockSymbol, stockData.exchange);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setLoading(true);

      if (inWatchlist) {
        await removeFromWatchlist(stockData.stockSymbol, stockData.exchange);
      } else {
        await addToWatchlist(stockData);
      }
    } catch (error) {
      console.error("Watchlist toggle error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showText && <span className="ml-2">Loading...</span>}
        </>
      );
    }

    if (inWatchlist) {
      return (
        <>
          <Star className="h-4 w-4 fill-current" />
          {showText && <span className="ml-2">In Watchlist</span>}
        </>
      );
    }

    return (
      <>
        <Plus className="h-4 w-4" />
        {showText && <span className="ml-2">Add to Watchlist</span>}
      </>
    );
  };

  const getButtonVariant = () => {
    if (inWatchlist) {
      return "default";
    }
    return variant;
  };

  const getButtonClassName = () => {
    const baseClasses = cn(className);

    if (inWatchlist) {
      return cn(
        baseClasses,
        "bg-chart-1 hover:bg-chart-1/90 text-white border-chart-1",
      );
    }

    return cn(
      baseClasses,
      variant === "outline" && "border-chart-1 text-chart-1 hover:bg-chart-1/5",
      variant === "ghost" && "text-chart-1 hover:bg-chart-1/5",
    );
  };

  return (
    <Button
      variant={getButtonVariant()}
      size={size}
      onClick={handleToggle}
      disabled={loading}
      className={getButtonClassName()}
      title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
    >
      {getButtonContent()}
    </Button>
  );
};
