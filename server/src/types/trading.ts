import {
  TransactionType,
  TransactionStatus,
  OrderType,
  Currency,
} from "@prisma/client";

export interface WalletData {
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

export interface PortfolioHolding {
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

export interface TransactionData {
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
  orderType: OrderType;
  executedAt: Date;
  tradingOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioSummary {
  wallet: WalletData;
  totalHoldings: number;
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayPnL: number;
  dayPnLPercent: number;
  cashBalance: number;
  currency: string;
  profitableHoldings: number;
  lossHoldings: number;
  topGainer?: {
    symbol: string;
    name: string;
    pnlPercent: number;
  };
  topLoser?: {
    symbol: string;
    name: string;
    pnlPercent: number;
  };
  sectorAllocation: { sector: string; value: number; percentage: number }[];
  exchangeBreakdown: { exchange: string; value: number; percentage: number }[];
}

export interface WatchlistItem {
  id: string;
  userId: string;
  stockSymbol: string;
  stockName: string;
  exchange: string;
  isin?: string;
  addedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  currentPrice?: number;
  dayChange?: number;
  dayChangePercent?: number;
  lastPriceUpdate?: Date;
}

export interface BuyStockRequest {
  stockSymbol: string;
  stockName: string;
  exchange: string;
  quantity: number;
  orderType: OrderType;
  price?: number;
  isin?: string;
}

export interface SellStockRequest {
  stockSymbol: string;
  exchange: string;
  quantity: number;
  orderType: OrderType;
  price?: number;
}

export interface AddToWatchlistRequest {
  stockSymbol: string;
  stockName: string;
  exchange: string;
  isin?: string;
}

export interface LiveStockPrice {
  symbol: string;
  exchange: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  change: number;
  changePercent: number;
  volume?: number;
  value?: number;
  timestamp: Date;
  lastFetched?: Date;
  previousClose?: number;
  marketCap?: number;
  pe?: number;
  pb?: number;
}

export interface StockQuote {
  symbol: string;
  name?: string;
  exchange: string;
  isin?: string;
  companyName: string;
  industry?: string;
  sector?: string;
  marketCap?: number;
  bookValue?: number;
  dividendYield?: number;
  pe?: number;
  pb?: number;
  eps?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  priceToSales?: number;
  priceToBook?: number;
  week52High?: number;
  week52Low?: number;
  averageVolume?: number;
  beta?: number;
  faceValue?: number;
  marketLot?: number;
  listingDate?: Date;
  description?: string;
  website?: string;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface TradingServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
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

export interface TransactionFilters extends PaginationParams {
  type?: TransactionType;
  stockSymbol?: string;
  exchange?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface PortfolioFilters extends PaginationParams {
  exchange?: string;
  profitableOnly?: boolean;
  lossOnly?: boolean;
  sector?: string;
  minValue?: number;
  maxValue?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TradingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MarketSessionInfo {
  exchange?: string;
  isOpen: boolean;
  currentSession: "PRE_MARKET" | "MARKET_HOURS" | "POST_MARKET" | "CLOSED";
  nextOpenTime?: Date;
  nextCloseTime?: Date;
  marketTimezone?: string;
  isHoliday?: boolean;
  nextSessionTime?: Date;
  holidayReason?: string;
}
