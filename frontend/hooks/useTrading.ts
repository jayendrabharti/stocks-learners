"use client";

import { useState } from "react";
import {
  buyStock,
  sellStock,
  BuyStockRequest,
  SellStockRequest,
} from "@/services/tradingApi";
import { toast } from "sonner";

export const useBuyStock = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeBuy = async (data: BuyStockRequest) => {
    try {
      setLoading(true);
      setError(null);

      const response = await buyStock(data);

      if (response.success) {
        toast.success("Stock purchased successfully!", {
          description: `Bought ${data.quantity} shares of ${data.stockName}`,
        });
        return response.data;
      } else {
        throw new Error(response.message || "Failed to buy stock");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to purchase stock";
      setError(errorMessage);
      toast.error("Purchase Failed", {
        description: errorMessage,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    executeBuy,
    loading,
    error,
  };
};

export const useSellStock = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSell = async (data: SellStockRequest) => {
    try {
      setLoading(true);
      setError(null);

      const response = await sellStock(data);

      if (response.success) {
        toast.success("Stock sold successfully!", {
          description: `Sold ${data.quantity} shares of ${data.stockName}`,
        });
        return response.data;
      } else {
        throw new Error(response.message || "Failed to sell stock");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to sell stock";
      setError(errorMessage);
      toast.error("Sale Failed", {
        description: errorMessage,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    executeSell,
    loading,
    error,
  };
};
