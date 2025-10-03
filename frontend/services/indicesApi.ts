import ApiClient from "@/utils/ApiClient";

// Types
export interface IndexHeader {
  searchId: string;
  growwCompanyId: string;
  isin: string;
  displayName: string;
  shortName: string;
  type: string;
  isFnoEnabled: boolean;
  nseScriptCode?: string;
  bseScriptCode?: string;
  isBseTradable: boolean;
  isNseTradable: boolean;
  logoUrl: string;
  floatingShares?: number;
  isBseFnoEnabled: boolean;
  isNseFnoEnabled: boolean;
}

export interface IndexData {
  header: IndexHeader;
  yearLowPrice?: number;
  yearHighPrice?: number;
}

export interface IndicesResponse {
  allAssets: IndexData[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: string;
  message?: string;
}

// API Functions
export const getIndices = async (
  searchTerm: string = "nifty",
  page: number = 0,
  size: number = 25,
): Promise<IndexData[]> => {
  try {
    const response = await ApiClient.get<ApiResponse<IndexData[]>>(
      `/api/indices?search=${searchTerm}&page=${page}&size=${size}`,
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching indices:", error);
    return [];
  }
};

export const getMajorIndices = async (): Promise<IndexData[]> => {
  try {
    const response =
      await ApiClient.get<ApiResponse<IndexData[]>>("/api/indices/major");

    const result = response.data.data || [];
    return result;
  } catch (error) {
    console.error("API - Error fetching major indices:", error);
    return [];
  }
};

export const getIndexDetails = async (
  searchId: string,
): Promise<IndexData | null> => {
  try {
    const response = await ApiClient.get<ApiResponse<IndexData>>(
      `/api/indices/${searchId}`,
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching index details:", error);
    return null;
  }
};

// Helper Functions
export const formatIndexValue = (value: number): string => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(2)} K`;
  }
  return `₹${value.toFixed(2)}`;
};

export const getIndexChangeColor = (
  current: number,
  previous: number,
): string => {
  if (current > previous) return "text-green-600";
  if (current < previous) return "text-red-600";
  return "text-gray-600";
};

export const calculate52WeekRange = (
  yearLow?: number,
  yearHigh?: number,
): string => {
  if (!yearLow || !yearHigh) return "0%";
  const range = yearHigh - yearLow;
  const percentage = ((range / yearLow) * 100).toFixed(2);
  return `${percentage}%`;
};

export const groupIndices = (indices: IndexData[]) => {
  const majorIndices = [
    "nifty",
    "nifty-bank",
    "nifty-financial-services",
    "sp-bse-sensex",
    "nifty-midcap-select",
    "sp-bse-bankex",
  ];

  const sectoralKeywords = [
    "auto",
    "bank",
    "financial",
    "it",
    "pharma",
    "fmcg",
    "metal",
    "oil",
    "gas",
    "realty",
    "media",
    "psu",
  ];

  const major: IndexData[] = [];
  const sectoral: IndexData[] = [];
  const other: IndexData[] = [];

  indices.forEach((index) => {
    const searchId = index.header.searchId.toLowerCase();

    if (majorIndices.includes(searchId)) {
      major.push(index);
    } else if (sectoralKeywords.some((keyword) => searchId.includes(keyword))) {
      sectoral.push(index);
    } else {
      other.push(index);
    }
  });

  return { major, sectoral, other };
};
