"use client";

import React, { useState } from "react";
import { StockSearch } from "../../../../components/trading/StockSearch";
import { InstrumentSearch } from "../../../../types/trading";
import {
  TrendingUp,
  TrendingDown,
  Search,
  BarChart3,
  DollarSign,
  Eye,
  Clock,
  Star,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  PieChart,
  Bell,
  Settings,
  HelpCircle,
} from "lucide-react";

export default function DashboardPage() {
  const [selectedStock, setSelectedStock] = useState<InstrumentSearch | null>(
    null,
  );

  const handleStockSelect = (stock: InstrumentSearch) => {
    setSelectedStock(stock);
    console.log("Selected stock:", stock);
  };

  // Mock data - replace with real data from your backend
  const portfolioStats = {
    totalValue: 1000000,
    investedValue: 0,
    currentValue: 1000000,
    totalPnL: 0,
    totalPnLPercent: 0,
    dayPnL: 0,
    dayPnLPercent: 0,
  };

  const topGainers = [
    { symbol: "RELIANCE", price: 2847.5, change: 2.45, changePercent: 0.86 },
    { symbol: "TCS", price: 4168.25, change: 45.2, changePercent: 1.1 },
    { symbol: "INFY", price: 1756.8, change: 23.15, changePercent: 1.33 },
    { symbol: "HDFC", price: 1654.9, change: 19.85, changePercent: 1.22 },
  ];

  const topLosers = [
    { symbol: "ITC", price: 456.7, change: -8.3, changePercent: -1.79 },
    { symbol: "SBIN", price: 812.45, change: -12.55, changePercent: -1.52 },
    { symbol: "ICICIBANK", price: 1245.6, change: -18.4, changePercent: -1.45 },
    {
      symbol: "HDFCBANK",
      price: 1687.25,
      change: -23.75,
      changePercent: -1.39,
    },
  ];

  const watchlistStocks = [
    { symbol: "NIFTY 50", price: 19674.25, change: 156.8, changePercent: 0.8 },
    { symbol: "SENSEX", price: 65953.48, change: 501.22, changePercent: 0.77 },
    {
      symbol: "BANKNIFTY",
      price: 44267.85,
      change: -89.15,
      changePercent: -0.2,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Search Bar - Top Priority */}
      <div className="mb-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center">
            <Search className="mr-3 h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Search & Trade Stocks
            </h2>
          </div>
          <StockSearch
            onStockSelect={handleStockSelect}
            placeholder="Search for stocks, ETFs, indices... (e.g., RELIANCE, TCS, NIFTY)"
            className="mb-4"
          />

          {/* Selected Stock Quick Actions */}
          {selectedStock && (
            <div className="mt-6 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedStock.symbol}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedStock.name} • {selectedStock.exchange}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    {selectedStock.instrumentType}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="flex items-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  Buy
                </button>
                <button className="flex items-center rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700">
                  <ArrowDownRight className="mr-1 h-4 w-4" />
                  Sell
                </button>
                <button className="flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700">
                  <Star className="mr-1 h-4 w-4" />
                  Watchlist
                </button>
                <button className="flex items-center rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200">
                  <BarChart3 className="mr-1 h-4 w-4" />
                  Analyze
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Portfolio & Quick Stats */}
        <div className="space-y-6 lg:col-span-2">
          {/* Portfolio Overview */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  Portfolio Overview
                </h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="mr-1 h-4 w-4" />
                  <span>Updated now</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="text-center md:text-left">
                  <div className="mb-2 flex items-center justify-center md:justify-start">
                    <Wallet className="mr-2 h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">
                      Total Value
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{portfolioStats.totalValue.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">Virtual Money</p>
                </div>

                <div className="text-center md:text-left">
                  <div className="mb-2 flex items-center justify-center md:justify-start">
                    <Activity className="mr-2 h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                      Invested
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{portfolioStats.investedValue.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Available: ₹{portfolioStats.currentValue.toLocaleString()}
                  </p>
                </div>

                <div className="text-center md:text-left">
                  <div className="mb-2 flex items-center justify-center md:justify-start">
                    <PieChart className="mr-2 h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">
                      Total P&L
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-600">
                    ₹{portfolioStats.totalPnL.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {portfolioStats.totalPnLPercent >= 0 ? "+" : ""}
                    {portfolioStats.totalPnLPercent}%
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <button className="flex items-center justify-center rounded-xl bg-green-50 p-3 text-green-700 transition-colors hover:bg-green-100">
                    <Plus className="mr-2 h-5 w-5" />
                    <span className="font-medium">Buy Stocks</span>
                  </button>
                  <button className="flex items-center justify-center rounded-xl bg-blue-50 p-3 text-blue-700 transition-colors hover:bg-blue-100">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    <span className="font-medium">Portfolio</span>
                  </button>
                  <button className="flex items-center justify-center rounded-xl bg-purple-50 p-3 text-purple-700 transition-colors hover:bg-purple-100">
                    <Eye className="mr-2 h-5 w-5" />
                    <span className="font-medium">Watchlist</span>
                  </button>
                  <button className="flex items-center justify-center rounded-xl bg-orange-50 p-3 text-orange-700 transition-colors hover:bg-orange-100">
                    <Clock className="mr-2 h-5 w-5" />
                    <span className="font-medium">History</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Market Movers */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Top Gainers */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Top Gainers
                  </h3>
                </div>
              </div>
              <div className="space-y-3 p-6">
                {topGainers.map((stock, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-green-50 p-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {stock.symbol}
                      </p>
                      <p className="text-sm text-gray-600">
                        ₹{stock.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +{stock.change.toFixed(2)}
                      </p>
                      <p className="text-sm text-green-600">
                        +{stock.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center">
                  <TrendingDown className="mr-2 h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Top Losers
                  </h3>
                </div>
              </div>
              <div className="space-y-3 p-6">
                {topLosers.map((stock, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-red-50 p-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {stock.symbol}
                      </p>
                      <p className="text-sm text-gray-600">
                        ₹{stock.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        {stock.change.toFixed(2)}
                      </p>
                      <p className="text-sm text-red-600">
                        {stock.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Watchlist & Features */}
        <div className="space-y-6">
          {/* Watchlist */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="mr-2 h-5 w-5 text-yellow-500" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Market Indices
                  </h3>
                </div>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  View All
                </button>
              </div>
            </div>
            <div className="space-y-4 p-6">
              {watchlistStocks.map((stock, index) => (
                <div
                  key={index}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {stock.symbol}
                    </p>
                    <p className="text-sm text-gray-600">
                      ₹{stock.price.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className={`text-right ${stock.change >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    <p className="font-semibold">
                      {stock.change >= 0 ? "+" : ""}
                      {stock.change.toFixed(2)}
                    </p>
                    <p className="text-sm">
                      {stock.changePercent >= 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon Features */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg">
            <div className="p-6">
              <div className="mb-4 flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <h3 className="ml-3 text-lg font-bold text-gray-900">
                  Coming Soon
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center rounded-lg bg-white/70 p-3">
                  <div className="mr-3 h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Options Trading
                  </span>
                </div>
                <div className="flex items-center rounded-lg bg-white/70 p-3">
                  <div className="mr-3 h-2 w-2 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Futures Trading
                  </span>
                </div>
                <div className="flex items-center rounded-lg bg-white/70 p-3">
                  <div className="mr-3 h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    SIP Investment
                  </span>
                </div>
                <div className="flex items-center rounded-lg bg-white/70 p-3">
                  <div className="mr-3 h-2 w-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Mutual Funds
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
            <div className="p-6">
              <div className="mb-4 flex items-center">
                <HelpCircle className="mr-2 h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Need Help?</h3>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                New to trading? Check out our learning resources to get started.
              </p>
              <button className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700">
                Learning Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
