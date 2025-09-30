import ApiClient from "../utils/ApiClient";

export interface WatchlistItem {
  id: string;
  stockSymbol: string;
  stockName: string;
  exchange: string;
  isin?: string | null;
  addedAt: Date;
}

export interface AddToWatchlistRequest {
  stockSymbol: string;
  stockName: string;
  exchange: string;
  isin?: string | null;
}

export interface WatchlistApiResponse {
  success: boolean;
  data: WatchlistItem[];
  count: number;
}

export interface WatchlistStatusResponse {
  success: boolean;
  data: {
    isInWatchlist: boolean;
  };
}

export interface WatchlistCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export class WatchlistApi {
  /**
   * Get user's watchlist
   */
  static async getWatchlist(): Promise<WatchlistItem[]> {
    try {
      const response = await ApiClient.get("/watchlist");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      throw new Error("Failed to fetch watchlist");
    }
  }

  /**
   * Add stock to watchlist
   */
  static async addToWatchlist(
    stockData: AddToWatchlistRequest,
  ): Promise<WatchlistItem> {
    try {
      const response = await ApiClient.post("/watchlist", stockData);
      return response.data.data;
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to add stock to watchlist");
    }
  }

  /**
   * Remove stock from watchlist
   */
  static async removeFromWatchlist(
    stockSymbol: string,
    exchange: string,
  ): Promise<void> {
    try {
      await ApiClient.delete(`/watchlist/${stockSymbol}/${exchange}`);
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to remove stock from watchlist");
    }
  }

  /**
   * Check if stock is in watchlist
   */
  static async checkWatchlistStatus(
    stockSymbol: string,
    exchange: string,
  ): Promise<boolean> {
    try {
      const response = await ApiClient.get(
        `/watchlist/status/${stockSymbol}/${exchange}`,
      );
      return response.data.data.isInWatchlist;
    } catch (error) {
      console.error("Error checking watchlist status:", error);
      return false;
    }
  }

  /**
   * Get watchlist count
   */
  static async getWatchlistCount(): Promise<number> {
    try {
      const response = await ApiClient.get("/watchlist/count");
      return response.data.data.count;
    } catch (error) {
      console.error("Error getting watchlist count:", error);
      return 0;
    }
  }

  /**
   * Clear entire watchlist
   */
  static async clearWatchlist(): Promise<void> {
    try {
      await ApiClient.delete("/watchlist");
    } catch (error) {
      console.error("Error clearing watchlist:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to clear watchlist");
    }
  }
}
