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
import { useWallet } from "@/hooks/useWallet";
import { getPortfolio, getTransactionHistory } from "@/services/tradingApi";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Star,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { watchlist } = useWatchlist();
  const { summary: walletSummary, loading: walletLoading } = useWallet();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portfolioData, transactionsData] = await Promise.all([
          getPortfolio(),
          getTransactionHistory(1, 5),
        ]);
        setPortfolio(portfolioData);
        setRecentTransactions(transactionsData.transactions);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const portfolioStats = {
    totalValue: portfolio?.summary
      ? parseFloat(portfolio.summary.currentValue)
      : 0,
    totalInvested: portfolio?.summary
      ? parseFloat(portfolio.summary.totalInvested)
      : 0,
    totalStocks: portfolio?.holdings?.length || 0,
    totalProfit: portfolio?.summary
      ? parseFloat(portfolio.summary.totalPnL)
      : 0,
    totalProfitPerc: portfolio?.summary?.totalPnLPercent || 0,
    virtualCash: walletSummary ? parseFloat(walletSummary.virtualCash) : 0,
    dayPnL: portfolio?.summary
      ? parseFloat(portfolio.summary.dayPnL || "0")
      : 0,
    dayPnLPercent: portfolio?.summary?.dayPnLPercent || 0,
  };

  if (loading || walletLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

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
              {portfolioStats.dayPnL >= 0 ? (
                <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  portfolioStats.dayPnL >= 0 ? "text-green-500" : "text-red-500"
                }
              >
                ₹{Math.abs(portfolioStats.dayPnL).toLocaleString()} (
                {portfolioStats.dayPnLPercent}%)
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
              <Link href="/portfolio">View Full Portfolio</Link>
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
              <Link href="/watchlist">View Watchlist</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity or Market Summary could go here */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest trading activity</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/transactions">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        transaction.type === "BUY"
                          ? "bg-green-100 text-green-600 dark:bg-green-900/20"
                          : "bg-red-100 text-red-600 dark:bg-red-900/20"
                      }`}
                    >
                      {transaction.type === "BUY" ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.stockSymbol}</p>
                      <p className="text-muted-foreground text-sm">
                        {transaction.quantity} shares @ ₹
                        {parseFloat(transaction.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ₹{parseFloat(transaction.totalAmount).toLocaleString()}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(transaction.executedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
              <Activity className="mb-2 h-8 w-8" />
              <p>No recent transactions</p>
              <Button asChild variant="link" size="sm" className="mt-2">
                <Link href="/stocks">Start Trading</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Overview */}
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
