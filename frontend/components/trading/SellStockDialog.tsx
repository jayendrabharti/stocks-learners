"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSellStock } from "@/hooks/useTrading";
import { useWallet } from "@/hooks/useWallet";
import { Loader2, TrendingDown, Package, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SellStockDialogProps {
  open: boolean;
  onClose: () => void;
  stock: {
    symbol: string;
    name: string;
    exchange: string;
    currentPrice: number;
    isin?: string;
  };
  holding: {
    quantity: number;
    averagePrice: number;
    product?: "CNC" | "MIS"; // Product type of the holding being sold
  };
  onSuccess?: () => void;
}

export default function SellStockDialog({
  open,
  onClose,
  stock,
  holding,
  onSuccess,
}: SellStockDialogProps) {
  const [quantity, setQuantity] = useState<number>(1);
  // Initialize product type based on holding, default to DELIVERY if not specified
  const [productType, setProductType] = useState<"DELIVERY" | "INTRADAY">(
    holding.product === "MIS" ? "INTRADAY" : "DELIVERY",
  );
  const { executeSell, loading } = useSellStock();
  const { refetch: refetchWallet } = useWallet();

  // Update product type when holding changes
  useEffect(() => {
    setProductType(holding.product === "MIS" ? "INTRADAY" : "DELIVERY");
  }, [holding.product]);

  // Reset quantity when dialog opens
  useEffect(() => {
    if (open) {
      setQuantity(Math.min(1, holding.quantity));
    }
  }, [open, holding.quantity]);

  const totalAmount = stock.currentPrice * quantity;
  const costBasis = holding.averagePrice * quantity;
  const profitLoss = totalAmount - costBasis;
  const profitLossPercent = (profitLoss / costBasis) * 100;
  const isProfitable = profitLoss >= 0;

  const handleSell = async () => {
    if (quantity <= 0 || quantity > holding.quantity) return;

    try {
      await executeSell({
        stockSymbol: stock.symbol,
        stockName: stock.name,
        exchange: stock.exchange,
        quantity,
        price: stock.currentPrice,
        isin: stock.isin,
        product: productType === "DELIVERY" ? "CNC" : "MIS", // Map UI label to API product type
      });

      // Refetch wallet to update balance
      await refetchWallet();

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close dialog
      onClose();
    } catch (error) {
      // Error is already handled by the hook with toast
      console.error("Sell error:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Sell {stock.name}
          </DialogTitle>
          <DialogDescription>
            {stock.symbol} • {stock.exchange}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Type Selector */}
          <div className="space-y-2">
            <Label>Product Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={productType === "DELIVERY" ? "default" : "outline"}
                onClick={() => setProductType("DELIVERY")}
                disabled={holding.product !== undefined}
                className={cn(
                  "w-full",
                  productType === "DELIVERY" &&
                    "bg-primary text-primary-foreground",
                )}
              >
                Delivery (CNC)
              </Button>
              <Button
                type="button"
                variant={productType === "INTRADAY" ? "default" : "outline"}
                onClick={() => setProductType("INTRADAY")}
                disabled={holding.product !== undefined}
                className={cn(
                  "w-full",
                  productType === "INTRADAY" &&
                    "bg-primary text-primary-foreground",
                )}
              >
                Intraday (MIS)
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              {holding.product !== undefined ? (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Selling from your{" "}
                  {productType === "DELIVERY"
                    ? "Delivery (CNC)"
                    : "Intraday (MIS)"}{" "}
                  holdings
                </span>
              ) : productType === "DELIVERY" ? (
                "Sell from holdings"
              ) : (
                "Sell intraday position"
              )}
            </p>
          </div>

          {/* Current Price */}
          <div className="bg-accent flex items-center justify-between rounded-lg p-3">
            <span className="text-muted-foreground text-sm">Current Price</span>
            <span className="text-lg font-bold">
              {formatCurrency(stock.currentPrice)}
            </span>
          </div>

          {/* Holdings Info */}
          <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
            <Package className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm">You Own:</span>
            <span className="ml-auto text-sm font-semibold">
              {holding.quantity} shares @ {formatCurrency(holding.averagePrice)}
            </span>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Sell</Label>
            <div className="flex gap-2">
              <Input
                id="quantity"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ""); // Remove non-digits
                  if (val === "") {
                    setQuantity(0);
                  } else {
                    const numVal = parseInt(val);
                    setQuantity(Math.min(numVal, holding.quantity));
                  }
                }}
                onBlur={() => {
                  // Ensure minimum of 1 when user leaves the field
                  if (quantity === 0) setQuantity(1);
                }}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => setQuantity(holding.quantity)}
              >
                All
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Maximum: {holding.quantity} shares
            </p>
          </div>

          {/* Sale Amount */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">Sale Amount</span>
            <span className="text-primary text-lg font-bold">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {/* Profit/Loss */}
          <div
            className={`rounded-lg border p-3 ${
              isProfitable
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {isProfitable ? "Profit" : "Loss"}
              </span>
              <div className="text-right">
                <div
                  className={`text-lg font-bold ${
                    isProfitable
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {isProfitable ? "+" : ""}
                  {formatCurrency(profitLoss)}
                </div>
                <div
                  className={`text-sm ${
                    isProfitable
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {isProfitable ? "+" : ""}
                  {profitLossPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Warning if trying to sell more than owned */}
          {quantity > holding.quantity && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
              <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" />
              <div className="text-sm text-red-600 dark:text-red-400">
                <p className="font-semibold">Insufficient Holdings</p>
                <p>You only own {holding.quantity} shares.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSell}
            disabled={loading || quantity <= 0 || quantity > holding.quantity}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Sell {quantity} {quantity === 1 ? "Share" : "Shares"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
