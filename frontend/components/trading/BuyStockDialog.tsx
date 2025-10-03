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
import { useBuyStock } from "@/hooks/useTrading";
import { useWallet } from "@/hooks/useWallet";
import { Loader2, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BuyStockDialogProps {
  open: boolean;
  onClose: () => void;
  stock: {
    symbol: string;
    name: string;
    exchange: string;
    currentPrice: number;
    isin?: string;
  };
  onSuccess?: () => void;
}

export default function BuyStockDialog({
  open,
  onClose,
  stock,
  onSuccess,
}: BuyStockDialogProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [productType, setProductType] = useState<"DELIVERY" | "INTRADAY">(
    "DELIVERY",
  );
  const { executeBuy, loading } = useBuyStock();
  const { summary, refetch: refetchWallet } = useWallet();

  // Reset quantity when dialog opens
  useEffect(() => {
    if (open) {
      setQuantity(1);
    }
  }, [open]);

  const totalAmount = stock.currentPrice * quantity;
  const marginRequired =
    productType === "INTRADAY" ? totalAmount * 0.25 : totalAmount; // 25% margin for MIS
  const availableBalance = summary ? parseFloat(summary.virtualCash) : 0;
  const availableForMIS = summary?.availableForMIS
    ? parseFloat(summary.availableForMIS)
    : availableBalance * 4;
  const effectiveBalance =
    productType === "INTRADAY" ? availableForMIS : availableBalance;
  const canAfford = marginRequired <= effectiveBalance;
  const maxAffordable =
    productType === "INTRADAY"
      ? Math.floor(availableForMIS / (stock.currentPrice * 0.25))
      : Math.floor(availableBalance / stock.currentPrice);
  const leverage = productType === "INTRADAY" ? "4x" : "1x";

  const handleBuy = async () => {
    if (!canAfford) return;

    try {
      await executeBuy({
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
      console.error("Buy error:", error);
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
            <TrendingUp className="h-5 w-5 text-green-600" />
            Buy {stock.name}
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
              {productType === "DELIVERY"
                ? "Hold stocks for long term"
                : "Square off by market close"}
            </p>
          </div>

          {/* Current Price */}
          <div className="bg-accent flex items-center justify-between rounded-lg p-3">
            <span className="text-muted-foreground text-sm">Current Price</span>
            <span className="text-lg font-bold">
              {formatCurrency(stock.currentPrice)}
            </span>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
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
                    setQuantity(Math.min(numVal, maxAffordable));
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
                onClick={() => setQuantity(maxAffordable)}
                disabled={maxAffordable <= 0}
              >
                Max
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Max affordable: {maxAffordable} shares
            </p>
          </div>

          {/* Total Amount */}
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Value</span>
              <span className="text-lg font-bold">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            {productType === "INTRADAY" && (
              <>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Margin Required (25%)
                    </span>
                    <span className="text-primary font-semibold">
                      {formatCurrency(marginRequired)}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
                    <span>Leverage</span>
                    <span className="font-medium text-orange-600">
                      {leverage}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Available Balance */}
          <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
            <Wallet className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm">
              {productType === "INTRADAY" ? "Available for MIS:" : "Available:"}
            </span>
            <span className="ml-auto text-sm font-semibold">
              {formatCurrency(effectiveBalance)}
            </span>
          </div>

          {/* Warning if insufficient funds */}
          {!canAfford && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
              <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" />
              <div className="text-sm text-red-600 dark:text-red-400">
                <p className="font-semibold">Insufficient Funds</p>
                <p>
                  You need {formatCurrency(marginRequired - effectiveBalance)}{" "}
                  more
                  {productType === "INTRADAY" ? " in margin" : ""} to complete
                  this purchase.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleBuy}
            disabled={loading || !canAfford || quantity <= 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Buy {quantity} {quantity === 1 ? "Share" : "Shares"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
