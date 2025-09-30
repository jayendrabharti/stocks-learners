"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWatchlist } from "@/providers/WatchlistProvider";
import Link from "next/link";
import {
  BarChart3,
  Star,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function DashboardPage() {
  const { watchlist } = useWatchlist();

  // Mock portfolio data - replace with real data later
  const portfolioStats = {
    totalValue: 125000,
    todayChange: 2500,
    todayChangePerc: 2.04,
    totalStocks: 8,
    totalProfit: 15000,
    totalProfitPerc: 13.6,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome to your Dashboard</h2>
          <p className="text-muted-foreground">
            Track your investments and manage your portfolio
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Activity className="mr-1 h-3 w-3" />
          Live Market Data
        </Badge>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Portfolio Value
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{portfolioStats.totalValue.toLocaleString()}
            </div>
            <div className="text-muted-foreground flex items-center text-xs">
              {portfolioStats.todayChange >= 0 ? (
                <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  portfolioStats.todayChange >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                ₹{Math.abs(portfolioStats.todayChange).toLocaleString()} (
                {portfolioStats.todayChangePerc}%)
              </span>
              <span className="ml-1">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stocks</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioStats.totalStocks}
            </div>
            <p className="text-muted-foreground text-xs">Active positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              +₹{portfolioStats.totalProfit.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              +{portfolioStats.totalProfitPerc}% overall
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watchlist</CardTitle>
            <Star className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{watchlist.length}</div>
            <p className="text-muted-foreground text-xs">Stocks tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Portfolio Management
            </CardTitle>
            <CardDescription>
              View and manage your investment portfolio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Current Holdings:</span>
                <p className="font-medium">
                  {portfolioStats.totalStocks} stocks
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Portfolio Value:</span>
                <p className="font-medium">
                  ₹{portfolioStats.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard/portfolio">View Full Portfolio</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Watchlist
            </CardTitle>
            <CardDescription>
              Monitor stocks you're interested in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tracked Stocks:</span>
                <p className="font-medium">{watchlist.length} items</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>
                <p className="font-medium">Real-time</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/watchlist">View Watchlist</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity or Market Summary could go here */}
      <Card>
        <CardHeader>
          <CardTitle>Market Summary</CardTitle>
          <CardDescription>
            Quick overview of market performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center justify-center py-8">
            <p>Market data and recent activity will be displayed here</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/stocks">Browse Stocks</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/stocks/top-gainers">Top Gainers</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/stocks/top-losers">Top Losers</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
