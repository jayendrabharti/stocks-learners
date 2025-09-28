"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Plus, Minus, Eye } from "lucide-react";
import { InstrumentSearch, StockPrice } from "../../types/trading";
import { stockApiService } from "../../services/stockApi";
import {
  formatCurrency,
  formatPercentage,
  getChangeColor,
  getChangeBgColor,
} from "../../lib/tradingUtils";

interface StockCardProps {
  stock: InstrumentSearch;
  showDetails?: boolean;
  showActions?: boolean;
  onBuy?: (stock: InstrumentSearch) => void;
  onSell?: (stock: InstrumentSearch) => void;
  onAddToWatchlist?: (stock: InstrumentSearch) => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  showDetails = true,
  showActions = true,
  onBuy,
  onSell,
  onAddToWatchlist,
}) => {
  const [livePrice, setLivePrice] = useState<StockPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch live price when component mounts (only if showDetails is true)
  useEffect(() => {
    if (showDetails && stock.symbol && stock.exchange) {
      fetchLivePrice();
    }
  }, [stock.symbol, stock.exchange, showDetails]);

  const fetchLivePrice = async () => {
    try {
      if (!stock.symbol || !stock.exchange) return;

      setLoading(true);
      setError(null);
      const price = await stockApiService.getLivePrice(
        stock.symbol,
        stock.exchange,
      );
      setLivePrice(price);
    } catch (err) {
      console.error("Failed to fetch live price:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch price");
    } finally {
      setLoading(false);
    }
  };

  const getCompanyLogoUrl = (symbol: string) => {
    // Using Groww's logo API (similar to how they display logos)
    return `https://assets-netstorage.groww.in/stock-assets/logos/${symbol}.png`;
  };

  const getExchangeBadgeColor = (exchange: string) => {
    switch (exchange) {
      case "NSE":
        return "bg-blue-100 text-blue-800";
      case "BSE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 transition-colors hover:bg-gray-50">
      <div className="flex items-center space-x-3">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          <img
            src={getCompanyLogoUrl(stock.symbol || "")}
            alt={`${stock.name || "Company"} logo`}
            className="h-10 w-10 rounded-full bg-gray-100 object-cover"
            onError={(e) => {
              // Fallback to initials if logo fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = "none";

              const fallback = target.nextElementSibling as HTMLDivElement;
              if (fallback) {
                fallback.style.display = "flex";
              }
            }}
          />
          <div
            className="h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-800"
            style={{ display: "none" }}
          >
            {stock.symbol ? stock.symbol.substring(0, 2) : "??"}
          </div>
        </div>

        {/* Stock Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="truncate text-sm font-medium text-gray-900">
              {stock.symbol || "N/A"}
            </h3>
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${getExchangeBadgeColor(stock.exchange || "")}`}
            >
              {stock.exchange || "N/A"}
            </span>
          </div>

          <p className="truncate text-xs text-gray-500">
            {stock.name || "N/A"}
          </p>

          {stock.instrumentType && (
            <p className="text-xs text-gray-400">
              {stock.instrumentType} • {stock.sector || "N/A"}
            </p>
          )}
        </div>

        {/* Price Info */}
        {showDetails && (
          <div className="flex-shrink-0 text-right">
            {loading ? (
              <div className="animate-pulse">
                <div className="mb-1 h-4 w-16 rounded bg-gray-200"></div>
                <div className="h-3 w-12 rounded bg-gray-200"></div>
              </div>
            ) : error ? (
              <div className="text-xs text-red-500">Price unavailable</div>
            ) : livePrice ? (
              <>
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(livePrice.ltp)}
                </div>
                <div
                  className={`flex items-center space-x-1 text-xs ${getChangeColor(livePrice.change)}`}
                >
                  {livePrice.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{formatPercentage(livePrice.changePercent)}</span>
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-400">No price data</div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => onBuy?.(stock)}
            className="inline-flex flex-1 items-center justify-center rounded-md border border-transparent bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
          >
            <Plus className="mr-1 h-3 w-3" />
            Buy
          </button>

          <button
            onClick={() => onSell?.(stock)}
            className="inline-flex flex-1 items-center justify-center rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
          >
            <Minus className="mr-1 h-3 w-3" />
            Sell
          </button>

          <button
            onClick={() => onAddToWatchlist?.(stock)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            <Eye className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};
