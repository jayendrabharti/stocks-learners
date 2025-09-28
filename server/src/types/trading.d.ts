import type {
  TransactionType,
  TransactionStatus,
  OrderType,
  Currency,
  RiskLevel,
  TradingStyle,
  MarketCapSize,
} from "@prisma/client";

// ========================
// Wallet & Portfolio Types
// ========================

declare global {
  interface WalletData {
    id: string;
    userId: string;
    virtualCash: number;
    currency: Currency;
    totalInvested: number;
    currentValue: number;
    totalPnL: number;
    totalPnLPercent: number;
    dayPnL: number;
    dayPnLPercent: number;
    lastUpdatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }

  interface PortfolioHolding {
    id: string;
    userId: string;
    stockSymbol: string;
    stockName: string;
    exchange: string;
    isin?: string;
    quantity: number;
    averagePrice: number;
    totalInvested: number;
    currentPrice: number;
    currentValue: number;
    unrealizedPnL: number;
    unrealizedPnLPerc: number;
    dayChange: number;
    dayChangePercent: number;
    createdAt: Date;
    updatedAt: Date;
    lastPriceUpdate: Date;
  }

  interface TransactionData {
    id: string;
    userId: string;
    stockSymbol: string;
    stockName: string;
    exchange: string;
    isin?: string;
    type: TransactionType;
    quantity: number;
    price: number;
    totalAmount: number;
    brokerage: number;
    taxes: number;
    totalCharges: number;
    netAmount: number;
    balanceAfter: number;
    status: TransactionStatus;
    executedAt: Date;
    tradingOrderId?: string;
    createdAt: Date;
    updatedAt: Date;
  }

  interface WatchlistItem {
    id: string;
    userId: string;
    stockSymbol: string;
    stockName: string;
    exchange: string;
    isin?: string;
    addedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }

  // ========================
  // Trading Request Types
  // ========================

  interface BuyStockRequest {
    stockSymbol: string;
    stockName: string;
    exchange: string;
    quantity: number;
    orderType: OrderType;
    price?: number; // Required for LIMIT orders
    isin?: string;
  }

  interface SellStockRequest {
    stockSymbol: string;
    exchange: string;
    quantity: number;
    orderType: OrderType;
    price?: number; // Required for LIMIT orders
  }

  interface AddToWatchlistRequest {
    stockSymbol: string;
    stockName: string;
    exchange: string;
    isin?: string;
  }

  // ========================
  // Market Data Types
  // ========================

  interface LiveStockPrice {
    symbol: string;
    exchange: string;
    ltp: number; // Last Traded Price
    open: number;
    high: number;
    low: number;
    previousClose: number;
    change: number;
    changePercent: number;
    volume?: number | undefined;
    marketCap?: number | undefined;
    lastFetched: Date;
  }

  interface StockQuote {
    symbol: string;
    name: string;
    exchange: string;
    isin?: string | undefined;
    ltp: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    change: number;
    changePercent: number;
    volume?: number | undefined;
    marketCap?: number | undefined;
    sector?: string | undefined;
    industry?: string | undefined;
    marketCapSize?: MarketCapSize | undefined;
    isDerivativeAllowed?: boolean | undefined;
    lastUpdated: Date;
  }

  // ========================
  // Portfolio Analytics Types
  // ========================

  interface PortfolioSummary {
    totalValue: number;
    totalInvested: number;
    totalPnL: number;
    totalPnLPercent: number;
    dayPnL: number;
    dayPnLPercent: number;
    cashBalance: number;
    currency: Currency;
    totalHoldings: number;
    profitableHoldings: number;
    lossHoldings: number;
    topGainer?:
      | {
          symbol: string;
          name: string;
          pnlPercent: number;
        }
      | undefined;
    topLoser?:
      | {
          symbol: string;
          name: string;
          pnlPercent: number;
        }
      | undefined;
  }

  interface PortfolioPerformance {
    summary: PortfolioSummary;
    holdings: PortfolioHolding[];
    recentTransactions: TransactionData[];
    watchlist: WatchlistItem[];
  }

  // ========================
  // Trading Validation Types
  // ========================

  interface TradingValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }

  interface MarketSessionInfo {
    exchange: string;
    isOpen: boolean;
    isHoliday: boolean;
    holidayReason?: string | undefined;
    currentSession?: string; // "PRE_MARKET" | "REGULAR" | "POST_MARKET" | "CLOSED"
    nextSessionTime?: Date | undefined;
  }

  // ========================
  // User Preferences Types
  // ========================

  interface UserTradingPreferences {
    id: string;
    userId: string;
    defaultExchange: string;
    riskTolerance: RiskLevel;
    tradingStyle: TradingStyle;
    priceAlerts: boolean;
    orderAlerts: boolean;
    portfolioAlerts: boolean;
    emailNotifications: boolean;
    defaultView: string;
    chartPreferences: object;
    createdAt: Date;
    updatedAt: Date;
  }

  // ========================
  // Service Response Types
  // ========================

  interface TradingServiceResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
      code: string;
      message: string;
      details?: any;
    };
  }

  // ========================
  // Pagination Types
  // ========================

  interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }

  interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }

  // ========================
  // Filter Types
  // ========================

  interface TransactionFilters extends PaginationParams {
    type?: TransactionType;
    stockSymbol?: string;
    exchange?: string;
    dateFrom?: Date;
    dateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
  }

  interface PortfolioFilters extends PaginationParams {
    exchange?: string;
    profitableOnly?: boolean;
    lossOnly?: boolean;
    sector?: string;
    minValue?: number;
    maxValue?: number;
  }
}
