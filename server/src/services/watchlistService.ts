import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

export class WatchlistService {
  /**
   * Get user's watchlist
   */
  static async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    try {
      const watchlistItems = await prisma.watchlist.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          addedAt: "desc",
        },
      });

      return watchlistItems.map((item) => ({
        id: item.id,
        stockSymbol: item.stockSymbol,
        stockName: item.stockName,
        exchange: item.exchange,
        isin: item.isin,
        addedAt: item.addedAt,
      }));
    } catch (error) {
      console.error("Error fetching user watchlist:", error);
      throw new Error("Failed to fetch watchlist");
    }
  }

  /**
   * Add stock to watchlist
   */
  static async addToWatchlist(
    userId: string,
    stockData: AddToWatchlistRequest
  ): Promise<WatchlistItem> {
    try {
      // Check if stock is already in watchlist
      const existingItem = await prisma.watchlist.findUnique({
        where: {
          userId_stockSymbol_exchange: {
            userId,
            stockSymbol: stockData.stockSymbol,
            exchange: stockData.exchange,
          },
        },
      });

      if (existingItem) {
        throw new Error("Stock is already in your watchlist");
      }

      const watchlistItem = await prisma.watchlist.create({
        data: {
          userId,
          stockSymbol: stockData.stockSymbol,
          stockName: stockData.stockName,
          exchange: stockData.exchange,
          isin: stockData.isin || null,
        },
      });

      return {
        id: watchlistItem.id,
        stockSymbol: watchlistItem.stockSymbol,
        stockName: watchlistItem.stockName,
        exchange: watchlistItem.exchange,
        isin: watchlistItem.isin,
        addedAt: watchlistItem.addedAt,
      };
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
    userId: string,
    stockSymbol: string,
    exchange: string
  ): Promise<void> {
    try {
      const deletedItem = await prisma.watchlist.deleteMany({
        where: {
          userId,
          stockSymbol,
          exchange,
        },
      });

      if (deletedItem.count === 0) {
        throw new Error("Stock not found in watchlist");
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to remove stock from watchlist");
    }
  }

  /**
   * Check if stock is in user's watchlist
   */
  static async isInWatchlist(
    userId: string,
    stockSymbol: string,
    exchange: string
  ): Promise<boolean> {
    try {
      const item = await prisma.watchlist.findUnique({
        where: {
          userId_stockSymbol_exchange: {
            userId,
            stockSymbol,
            exchange,
          },
        },
      });

      return !!item;
    } catch (error) {
      console.error("Error checking watchlist status:", error);
      return false;
    }
  }

  /**
   * Get watchlist count for user
   */
  static async getWatchlistCount(userId: string): Promise<number> {
    try {
      const count = await prisma.watchlist.count({
        where: {
          userId,
        },
      });

      return count;
    } catch (error) {
      console.error("Error getting watchlist count:", error);
      return 0;
    }
  }

  /**
   * Clear entire watchlist for user
   */
  static async clearWatchlist(userId: string): Promise<void> {
    try {
      await prisma.watchlist.deleteMany({
        where: {
          userId,
        },
      });
    } catch (error) {
      console.error("Error clearing watchlist:", error);
      throw new Error("Failed to clear watchlist");
    }
  }
}
