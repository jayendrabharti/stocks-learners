import ApiClient from "../utils/ApiClient";
import {
  InstrumentSearch,
  SearchFilters,
  SearchResponse,
  StockPrice,
  StockQuote,
  ApiResponse,
} from "../types/trading";

export class StockApiService {
  private static instance: StockApiService;

  private constructor() {}

  public static getInstance(): StockApiService {
    if (!StockApiService.instance) {
      StockApiService.instance = new StockApiService();
    }
    return StockApiService.instance;
  }

  /**
   * Search for instruments/stocks
   */
  async searchInstruments(
    query: string,
    filters: SearchFilters = {},
  ): Promise<SearchResponse> {
    try {
      if (!query.trim()) {
        return {
          data: [],
          pagination: {
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      const size = filters.limit || 50;
      const from = filters.page ? (filters.page - 1) * size : 0;

      // Use our Next.js API route to proxy Groww API (avoids CORS issues)
      const response = await fetch(
        `/api/search?from=${from}&query=${encodeURIComponent(query)}&size=${size}&web=true`,
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const apiResponse = await response.json();

      if (!apiResponse.data || !apiResponse.data.content) {
        throw new Error("Invalid response structure");
      }

      // Transform Groww API response to our InstrumentSearch format
      const transformedData: InstrumentSearch[] = apiResponse.data.content
        .filter((item: any) => {
          // Filter based on entity_type and apply filters
          if (
            filters.instrumentType &&
            item.entity_type !== filters.instrumentType
          ) {
            return false;
          }
          // Only show stocks for now, filter out options
          if (!filters.instrumentType && item.entity_type !== "Stocks") {
            return false;
          }
          return true;
        })
        .map((item: any) => ({
          symbol:
            item.symbol ||
            item.nse_scrip_code ||
            item.bse_scrip_code ||
            item.id,
          name: item.title || "N/A",
          exchange:
            item.exchange ||
            (item.nse_scrip_code
              ? "NSE"
              : item.bse_scrip_code
                ? "BSE"
                : "Unknown"),
          instrumentType: item.entity_type || "Unknown",
          isin: item.isin || item.id,
          sector: "N/A", // Not provided by Groww API
          industry: "N/A", // Not provided by Groww API
        }));

      return {
        data: transformedData,
        pagination: {
          page: Math.floor(from / size) + 1,
          limit: size,
          total: transformedData.length, // Groww doesn't provide total count
          totalPages: 1,
          hasNext: transformedData.length === size,
          hasPrev: from > 0,
        },
      };
    } catch (error) {
      console.error("❌ Error searching instruments:", error);
      throw new Error("Failed to search instruments");
    }
  }

  /**
   * Get instrument details by symbol using search API
   */
  async getInstrumentDetails(
    symbol: string,
    exchange: string,
  ): Promise<InstrumentSearch> {
    try {
      // Use the search API to find the specific instrument
      const searchResponse = await this.searchInstruments(symbol, {
        limit: 10,
      });

      // Find exact match by symbol
      const exactMatch = searchResponse.data.find(
        (item) =>
          item.symbol === symbol ||
          item.symbol === symbol.toUpperCase() ||
          (item.symbol && item.symbol.toLowerCase() === symbol.toLowerCase()),
      );

      if (exactMatch) {
        return exactMatch;
      }

      // If no exact match, return the first result or throw error
      if (searchResponse.data.length > 0) {
        return searchResponse.data[0];
      }

      throw new Error(`Instrument not found: ${symbol}`);
    } catch (error) {
      console.error("❌ Error getting instrument details:", error);
      throw new Error("Failed to get instrument details");
    }
  }

  /**
   * Get live stock price
   */
  async getLivePrice(symbol: string, exchange: string): Promise<StockPrice> {
    try {
      const response = await ApiClient.get<ApiResponse<StockPrice>>(
        `/market/price/${symbol}?exchange=${exchange}`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to get live price");
      }

      return response.data.data;
    } catch (error) {
      console.error("❌ Error getting live price:", error);
      throw new Error("Failed to get live price");
    }
  }

  /**
   * Get stock quote with detailed information
   * TODO: Backend endpoint not implemented yet
   */
  async getStockQuote(symbol: string, exchange: string): Promise<StockQuote> {
    try {
      // This endpoint doesn't exist yet in the backend
      throw new Error("Stock quote endpoint not implemented in backend");

      /*
      const response = await ApiClient.get<ApiResponse<StockQuote>>(
        `/market/quote/${symbol}?exchange=${exchange}`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to get stock quote");
      }

      return response.data.data;
      */
    } catch (error) {
      console.error("❌ Error getting stock quote:", error);
      throw new Error("Failed to get stock quote");
    }
  }

  /**
   * Get multiple live prices
   */
  async getMultipleLivePrices(
    symbols: Array<{ symbol: string; exchange: string }>,
  ): Promise<StockPrice[]> {
    try {
      const response = await ApiClient.post<ApiResponse<StockPrice[]>>(
        "/market/prices",
        { symbols },
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to get live prices");
      }

      return response.data.data;
    } catch (error) {
      console.error("❌ Error getting multiple live prices:", error);
      throw new Error("Failed to get live prices");
    }
  }

  /**
   * Check if market is open
   */
  async getMarketStatus(exchange: string = "NSE"): Promise<{
    isOpen: boolean;
    currentSession: string;
    nextSessionTime?: Date;
  }> {
    try {
      const response = await ApiClient.get<
        ApiResponse<{
          isOpen: boolean;
          currentSession: string;
          nextSessionTime?: Date;
        }>
      >(`/market/status?exchange=${exchange}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to get market status");
      }

      return response.data.data;
    } catch (error) {
      console.error("❌ Error getting market status:", error);
      throw new Error("Failed to get market status");
    }
  }
}

export const stockApiService = StockApiService.getInstance();
