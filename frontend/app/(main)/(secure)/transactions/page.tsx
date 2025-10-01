"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getTransactionHistory,
  Transaction,
  TransactionHistoryResponse,
} from "@/services/tradingApi";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Filter,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [productFilter, setProductFilter] = useState<"ALL" | "CNC" | "MIS">(
    "ALL",
  );

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filter, productFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactionHistory(
        pagination.page,
        pagination.limit,
        filter === "ALL" ? undefined : filter,
      );

      // Filter by product type on client side
      let filteredTransactions = data.transactions;
      if (productFilter !== "ALL") {
        filteredTransactions = data.transactions.filter(
          (t) => t.product === productFilter,
        );
      }

      setTransactions(filteredTransactions);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-6 h-10 w-48" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">
            View all your buy and sell transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Transaction Type Filter */}
            <div className="flex items-center gap-4">
              <Filter className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Type:</span>
              <div className="flex gap-2">
                <Button
                  variant={filter === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilter("ALL");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  All
                </Button>
                <Button
                  variant={filter === "BUY" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilter("BUY");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={cn(
                    filter === "BUY" && "bg-green-600 hover:bg-green-700",
                  )}
                >
                  <ArrowUpCircle className="mr-1 h-4 w-4" />
                  Buy
                </Button>
                <Button
                  variant={filter === "SELL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilter("SELL");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={cn(
                    filter === "SELL" && "bg-red-600 hover:bg-red-700",
                  )}
                >
                  <ArrowDownCircle className="mr-1 h-4 w-4" />
                  Sell
                </Button>
              </div>
            </div>

            {/* Product Type Filter */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Product:</span>
              <div className="flex gap-2">
                <Button
                  variant={productFilter === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setProductFilter("ALL");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  All
                </Button>
                <Button
                  variant={productFilter === "CNC" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setProductFilter("CNC");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={cn(
                    productFilter === "CNC" && "bg-blue-600 hover:bg-blue-700",
                  )}
                >
                  CNC
                </Button>
                <Button
                  variant={productFilter === "MIS" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setProductFilter("MIS");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={cn(
                    productFilter === "MIS" &&
                      "bg-orange-600 hover:bg-orange-700",
                  )}
                >
                  MIS
                </Button>
              </div>
            </div>

            <div className="text-muted-foreground ml-auto text-sm">
              Total: {pagination.total} transactions
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Transactions (Page {pagination.page} of {pagination.totalPages})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">
                No transactions yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Start trading to see your transaction history
              </p>
              <Link href="/stocks">
                <Button>Explore Stocks</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const isBuy = transaction.type === "BUY";

                return (
                  <div
                    key={transaction.id}
                    className="hover:bg-accent/50 flex items-center gap-4 rounded-lg border p-4"
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full",
                        isBuy
                          ? "bg-green-100 dark:bg-green-950"
                          : "bg-red-100 dark:bg-red-950",
                      )}
                    >
                      {isBuy ? (
                        <ArrowUpCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <ArrowDownCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>

                    {/* Stock Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-sm font-semibold",
                            isBuy
                              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                          )}
                        >
                          {transaction.type}
                        </span>
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            transaction.product === "CNC"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
                          )}
                        >
                          {transaction.product}
                        </span>
                        <Link
                          href={`/stocks/${transaction.stockSymbol}?exchange=${transaction.exchange}`}
                          className="font-medium hover:underline"
                        >
                          {transaction.stockSymbol}
                        </Link>
                        <span className="text-muted-foreground text-sm">
                          {transaction.stockName}
                        </span>
                        <span className="bg-muted rounded px-2 py-0.5 text-xs">
                          {transaction.exchange}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-1 text-sm">
                        {transaction.quantity} shares @{" "}
                        {formatCurrency(transaction.price)}
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {formatDate(transaction.executedAt)}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <div
                        className={cn(
                          "text-lg font-bold",
                          isBuy ? "text-red-600" : "text-green-600",
                        )}
                      >
                        {isBuy ? "-" : "+"}
                        {formatCurrency(transaction.netAmount)}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Balance: {formatCurrency(transaction.balanceAfter)}
                      </div>
                      <div
                        className={cn(
                          "mt-1 inline-block rounded px-2 py-0.5 text-xs",
                          transaction.status === "COMPLETED"
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
                        )}
                      >
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1 || loading}
              >
                Previous
              </Button>
              <div className="text-muted-foreground text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
