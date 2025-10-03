"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Volume2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Stock,
  MostBoughtStock,
  formatNumber,
  calculateChangePercent,
} from "@/services/marketApi";

interface MarketStockCardProps {
  stock: Stock | MostBoughtStock;
  rank: number;
  variant?: "gainer" | "loser" | "volume" | "popular";
}

/**
 * Unified stock card component for market pages
 * Handles all stock types: gainers, losers, volume shockers, most bought
 */
export function MarketStockCard({
  stock,
  rank,
  variant = "gainer",
}: MarketStockCardProps) {
  // Type guards and data extraction
  const isMostBought = "company" in stock;

  // Common properties - extract based on stock type
  const logoUrl = isMostBought ? stock.company.imageUrl : stock.logoUrl;
  const companyShortName = isMostBought
    ? stock.company.companyShortName
    : stock.companyShortName;
  const companyName = isMostBought
    ? stock.company.companyName
    : stock.companyName;
  const nseScriptCode = isMostBought
    ? stock.company.nseScriptCode
    : stock.nseScriptCode;

  // Price calculations
  const ltp = isMostBought ? stock.stats.ltp : stock.ltp;
  const close = isMostBought ? stock.stats.close : stock.close;
  const changePercent = isMostBought
    ? stock.stats.dayChangePerc
    : calculateChangePercent(ltp, close);
  const change = isMostBought ? stock.stats.dayChange : ltp - close;

  const isPositive = change >= 0;
  const isNeutral = change === 0;

  // Variant-specific badge
  const renderVariantBadge = () => {
    switch (variant) {
      case "volume":
        // Volume is only available on Stock type, not MostBoughtStock
        return (
          !isMostBought &&
          stock.volume && (
            <Badge
              variant="default"
              className="bg-purple-100 text-xs text-purple-800 dark:bg-purple-900 dark:text-purple-100"
            >
              <Volume2 className="mr-1 h-3 w-3" />
              {formatNumber(stock.volume)}
            </Badge>
          )
        );
      case "popular":
        return (
          <Badge
            variant="default"
            className="bg-blue-100 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-100"
          >
            <Users className="mr-1 h-3 w-3" />
            Popular
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Link href={`/stocks/${nseScriptCode}`}>
      <Card className="group border-border/50 hover:border-border cursor-pointer transition-all duration-200 hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs font-semibold">
                  #{rank}
                </Badge>
                <div className="bg-muted h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
                  <img
                    src={logoUrl}
                    alt={companyShortName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                  <div className="bg-muted text-muted-foreground hidden h-full w-full items-center justify-center text-xs font-medium">
                    {companyShortName.slice(0, 2)}
                  </div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-foreground group-hover:text-primary truncate font-semibold transition-colors">
                  {companyShortName || nseScriptCode}
                </div>
                <div className="text-muted-foreground truncate text-sm">
                  {companyName}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {renderVariantBadge()}
                  {!isMostBought && stock.marketCap && (
                    <Badge variant="outline" className="text-xs">
                      MCap: ₹{formatNumber(stock.marketCap)}
                    </Badge>
                  )}
                  {isMostBought &&
                    stock.stats.lowPriceRange &&
                    stock.stats.highPriceRange && (
                      <Badge variant="outline" className="text-xs">
                        Range: ₹{stock.stats.lowPriceRange} - ₹
                        {stock.stats.highPriceRange}
                      </Badge>
                    )}
                </div>
              </div>
            </div>

            {/* Right Section - Price */}
            <div className="flex-shrink-0 text-right">
              <div className="text-foreground text-lg font-semibold">
                ₹
                {ltp.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div
                className={cn(
                  "flex items-center justify-end gap-1 text-sm font-medium",
                  isNeutral
                    ? "text-muted-foreground"
                    : isPositive
                      ? "text-chart-1"
                      : "text-destructive",
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : isNeutral ? null : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {isPositive ? "+" : ""}₹{Math.abs(change).toFixed(2)}
                </span>
                <span>
                  ({isPositive ? "+" : ""}
                  {changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                {!isMostBought && stock.yearHigh && stock.yearLow && (
                  <>
                    H: ₹{stock.yearHigh.toFixed(2)} • L: ₹
                    {stock.yearLow.toFixed(2)}
                  </>
                )}
                {isMostBought && stock.stats.high && stock.stats.low && (
                  <>
                    H: ₹{stock.stats.high.toFixed(2)} • L: ₹
                    {stock.stats.low.toFixed(2)}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
