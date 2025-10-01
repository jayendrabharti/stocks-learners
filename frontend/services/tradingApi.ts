import ApiClient from "@/utils/ApiClient";

export type ProductType = "CNC" | "MIS";

export interface BuyStockRequest {
  stockSymbol: string;
  stockName: string;
  exchange: string;
  quantity: number;
  price: number;
  isin?: string;
  product?: ProductType; // CNC (Delivery) or MIS (Intraday)
}

export interface SellStockRequest {
  stockSymbol: string;
  stockName: string;
  exchange: string;
  quantity: number;
  price: number;
  isin?: string;
  product?: ProductType; // CNC (Delivery) or MIS (Intraday)
}

export interface Transaction {
  id: string;
  userId: string;
  stockSymbol: string;
  stockName: string;
  exchange: string;
  isin?: string;
  product: ProductType; // CNC or MIS
  type: "BUY" | "SELL";
  quantity: number;
  price: string;
  totalAmount: string;
  brokerage: string;
  taxes: string;
  totalCharges: string;
  netAmount: string;
  balanceAfter: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  executedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioHolding {
  id: string;
  userId: string;
  stockSymbol: string;
  stockName: string;
  exchange: string;
  isin?: string;
  product: ProductType; // CNC or MIS
  quantity: number;
  averagePrice: string;
  totalInvested: string;
  currentPrice: string;
  currentValue: string;
  unrealizedPnL: string;
  unrealizedPnLPerc: number;
  dayChange: string;
  dayChangePercent: number;
  tradeDate: string; // For MIS square-off tracking
  createdAt: string;
  updatedAt: string;
  lastPriceUpdate: string;
}

export interface PortfolioSummary {
  virtualCash: string;
  // CNC (Delivery) metrics
  totalInvested: string;
  currentValue: string;
  totalPnL: string;
  totalPnLPercent: number;
  // MIS (Intraday) metrics
  misMarginUsed?: string;
  misPositionsValue?: string;
  misPnL?: string;
  // Available balances
  availableForCNC?: string;
  availableForMIS?: string;
}

export interface PortfolioResponse {
  holdings: {
    all: PortfolioHolding[];
    cnc: PortfolioHolding[];
    mis: PortfolioHolding[];
  };
  summary: PortfolioSummary | null;
  warnings?: {
    staleMISPositions?: {
      count: number;
      message: string;
      positions: Array<{
        stockSymbol: string;
        quantity: number;
        tradeDate: string;
      }>;
    } | null;
  };
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Buy stocks - Place a market buy order
 */
export const buyStock = async (data: BuyStockRequest) => {
  const response = await ApiClient.post("/trading/buy", data);
  return response.data;
};

/**
 * Sell stocks - Place a market sell order
 */
export const sellStock = async (data: SellStockRequest) => {
  const response = await ApiClient.post("/trading/sell", data);
  return response.data;
};

/**
 * Get transaction history with optional filters
 */
export const getTransactionHistory = async (
  page: number = 1,
  limit: number = 20,
  type?: "BUY" | "SELL",
  stockSymbol?: string,
): Promise<TransactionHistoryResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (type) params.append("type", type);
  if (stockSymbol) params.append("stockSymbol", stockSymbol);

  const response = await ApiClient.get(`/trading/transactions?${params}`);
  return response.data.data;
};

/**
 * Get user's portfolio holdings
 */
export const getPortfolio = async (): Promise<PortfolioResponse> => {
  const response = await ApiClient.get("/trading/portfolio");
  return response.data.data;
};
