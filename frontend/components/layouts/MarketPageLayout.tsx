"use client";

import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MarketTimingResponse, isMarketOpen } from "@/services/marketApi";

interface MarketPageLayoutProps {
  title: string;
  icon: ReactNode;
  description?: string;
  marketTiming: MarketTimingResponse | null;
  lastUpdated: Date;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  children: ReactNode;
  headerActions?: ReactNode;
}

/**
 * Unified layout for market pages (top-gainers, top-losers, etc.)
 * Provides consistent header, market status, and refresh functionality
 */
export function MarketPageLayout({
  title,
  icon,
  description,
  marketTiming,
  lastUpdated,
  loading,
  refreshing,
  onRefresh,
  children,
  headerActions,
}: MarketPageLayoutProps) {
  const marketIsOpen = isMarketOpen(marketTiming);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-4">
          {/* Back Button */}
          <Link href="/stocks">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          {/* Title and Icon */}
          <div className="flex flex-1 items-center gap-3">
            {icon}
            <div>
              <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
                {title}
              </h1>
              {description && (
                <p className="text-muted-foreground text-sm">{description}</p>
              )}
            </div>
          </div>

          {/* Optional Header Actions */}
          {headerActions}
        </div>

        {/* Market Status Bar */}
        <Card className="bg-muted/50 border-border/50">
          <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-3">
              {/* Market Status Badge */}
              <Badge
                variant={marketIsOpen ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  marketIsOpen
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
                )}
              >
                {marketIsOpen ? "🟢 Market Open" : "🔴 Market Closed"}
              </Badge>

              {/* Last Updated Time */}
              <div className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  Last updated:{" "}
                  <span className="font-medium">
                    {lastUpdated.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </span>
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={onRefresh}
              disabled={refreshing || loading}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-4 w-4",
                  (refreshing || loading) && "animate-spin",
                )}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
