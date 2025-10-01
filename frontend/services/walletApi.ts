import ApiClient from "@/utils/ApiClient";

export interface WalletBalance {
  virtualCash: string;
  currency: string;
  userId: string;
  updatedAt: string;
}

export interface WalletSummary {
  virtualCash: string;
  currency: string;
  totalInvested: string;
  currentValue: string;
  totalPnL: string;
  totalPnLPercent: number;
  dayPnL: string;
  dayPnLPercent: number;
  // MIS (Intraday) fields
  misMarginUsed?: string;
  misPositionsValue?: string;
  misPnL?: string;
  availableForCNC?: string;
  availableForMIS?: string;
}

export interface PortfolioHolding {
  stockSymbol: string;
  stockName: string;
  quantity: number;
  averagePrice: string;
  currentPrice: string;
  currentValue: string;
  unrealizedPnL: string;
  unrealizedPnLPerc: number;
}

export interface RecentTransaction {
  id: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: string;
  totalAmount: string;
  stockSymbol: string;
  stockName: string;
  exchange: string;
  executedAt: string;
  status: string;
}

export interface WalletDetails {
  virtualCash: string;
  currency: string;
  totalInvested: string;
  currentValue: string;
  totalPnL: string;
  totalPnLPercent: number;
  dayPnL: string;
  dayPnLPercent: number;
  initialBalance: number;
  portfolio: PortfolioHolding[];
  recentTransactions: RecentTransaction[];
  lastUpdatedAt: string;
  updatedAt: string;
}

/**
 * Get user's current virtual cash balance
 */
export const getWalletBalance = async (): Promise<WalletBalance> => {
  const response = await ApiClient.get("/wallet/balance");
  return response.data.data;
};

/**
 * Get wallet summary for navbar/dashboard
 */
export const getWalletSummary = async (): Promise<WalletSummary> => {
  const response = await ApiClient.get("/wallet/summary");
  return response.data.data;
};

/**
 * Get detailed wallet information with portfolio and transactions
 */
export const getWalletDetails = async (): Promise<WalletDetails> => {
  const response = await ApiClient.get("/wallet/details");
  return response.data.data;
};
