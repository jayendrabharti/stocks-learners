"use client";

import { useWallet } from "@/hooks/useWallet";
import { useSession } from "@/providers/SessionProvider";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

export default function WalletBalance() {
  const { user, status } = useSession();
  const { summary, loading, error } = useWallet();

  // Don't show wallet for unauthenticated users
  if (status !== "authenticated" || !user) {
    return null;
  }

  if (error) {
    return null; // Silently fail in navbar
  }

  if (loading) {
    return (
      <div className="border-border bg-accent flex items-center gap-2 rounded-full border px-3 py-1.5">
        <Wallet className="text-muted-foreground h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (!summary) return null;

  const virtualCash = parseFloat(summary.virtualCash);
  const totalPnL = parseFloat(summary.totalPnL);
  const isPnLPositive = totalPnL >= 0;

  // Format currency in Indian style (₹1,00,000.00)
  const formatIndianCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: summary.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="border-border bg-accent flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
      <Wallet className="text-primary h-4 w-4" />
      <span className="font-semibold">{formatIndianCurrency(virtualCash)}</span>

      {totalPnL !== 0 && (
        <div
          className={cn(
            "flex items-center gap-0.5 text-xs",
            isPnLPositive
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400",
          )}
        >
          {isPnLPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>
            {isPnLPositive ? "+" : ""}
            {summary.totalPnLPercent.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
}
