import ApiClient from "../utils/ApiClient";

// Backend API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: string;
}

// Types for API responses
export interface Stock {
  isin: string;
  gsin?: string;
  companyName: string;
  companyShortName: string;
  searchId: string;
  ltp: number;
  logoUrl: string;
  nseScriptCode: string;
  bseScriptCode: string;
  type: string;
  marketCap?: number;
  volumeWeekAvg?: number;
  close: number;
  yearHigh: number;
  yearLow: number;
  volume?: number;
  tag?: string;
  tagColor?: string;
}

export interface MostBoughtStock {
  company: {
    isin: string;
    growwContractId: string;
    companyName: string;
    searchId: string;
    nseScriptCode: string;
    companyShortName: string;
    bseScriptCode: string;
    imageUrl: string;
  };
  stats: {
    type: string;
    high: number;
    low: number;
    close: number;
    ltp: number;
    dayChange: number;
    dayChangePerc: number;
    lowPriceRange: number;
    highPriceRange: number;
  };
}

export interface TopMoversResponse {
  data: {
    title: string;
    stocks: Stock[];
  };
}

export interface MostBoughtResponse {
  exploreCompanies: {
    POPULAR_STOCKS_MOST_BOUGHT: MostBoughtStock[];
  };
}

export interface MarketTimingResponse {
  dateMarketTimeMap: {
    [date: string]: {
      marketOpenTime: string;
      marketCloseTime: string;
      preOpenStartTime: string;
      preOpenEndTime: string;
    };
  };
}

export const marketApi = {
  // Get top gainers
  getTopGainers: async (pageSize: number = 4): Promise<Stock[]> => {
    const response = await ApiClient.get<ApiResponse<Stock[]>>(
      `/market/top-gainers?pageSize=${pageSize}`,
    );
    return response.data.data;
  },

  // Get top losers
  getTopLosers: async (pageSize: number = 4): Promise<Stock[]> => {
    const response = await ApiClient.get<ApiResponse<Stock[]>>(
      `/market/top-losers?pageSize=${pageSize}`,
    );
    return response.data.data;
  },

  // Get volume shockers
  getVolumeShockers: async (pageSize: number = 6): Promise<Stock[]> => {
    const response = await ApiClient.get<ApiResponse<Stock[]>>(
      `/market/volume-shockers?pageSize=${pageSize}`,
    );
    return response.data.data;
  },

  // Get most bought stocks
  getMostBoughtStocks: async (size: number = 4): Promise<MostBoughtStock[]> => {
    const response = await ApiClient.get<ApiResponse<MostBoughtStock[]>>(
      `/market/most-bought?size=${size}`,
    );
    return response.data.data;
  },

  // Get market timing
  getMarketTiming: async (): Promise<MarketTimingResponse | null> => {
    const response =
      await ApiClient.get<ApiResponse<MarketTimingResponse>>(`/market/timing`);
    return response.data.data;
  },

  // Get all market data in one call (more efficient)
  getAllMarketData: async (options?: {
    gainersPageSize?: number;
    losersPageSize?: number;
    volumePageSize?: number;
    mostBoughtSize?: number;
  }): Promise<{
    topGainers: Stock[];
    topLosers: Stock[];
    volumeShockers: Stock[];
    mostBought: MostBoughtStock[];
    marketTiming: MarketTimingResponse | null;
  }> => {
    const params = new URLSearchParams();
    if (options?.gainersPageSize)
      params.append("gainersPageSize", options.gainersPageSize.toString());
    if (options?.losersPageSize)
      params.append("losersPageSize", options.losersPageSize.toString());
    if (options?.volumePageSize)
      params.append("volumePageSize", options.volumePageSize.toString());
    if (options?.mostBoughtSize)
      params.append("mostBoughtSize", options.mostBoughtSize.toString());

    const response = await ApiClient.get<
      ApiResponse<{
        topGainers: Stock[];
        topLosers: Stock[];
        volumeShockers: Stock[];
        mostBought: MostBoughtStock[];
        marketTiming: MarketTimingResponse | null;
      }>
    >(`/market/all?${params.toString()}`);

    return response.data.data;
  },
};

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(1)}Cr`;
  } else if (num >= 100000) {
    return `${(num / 100000).toFixed(1)}L`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toFixed(2);
};

export const calculateChangePercent = (
  current: number,
  previous: number,
): number => {
  return ((current - previous) / previous) * 100;
};

export const isMarketOpen = (
  marketTiming: MarketTimingResponse | null,
): boolean => {
  if (!marketTiming) return false;

  const today = new Date().toISOString().split("T")[0];
  const todayTiming = marketTiming.dateMarketTimeMap[today];

  if (!todayTiming) return false;

  const now = new Date();
  const currentTime = now.toTimeString().split(" ")[0];

  return (
    currentTime >= todayTiming.marketOpenTime &&
    currentTime <= todayTiming.marketCloseTime
  );
};
