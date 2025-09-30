import { Request, Response } from "express";
import {
  WatchlistService,
  AddToWatchlistRequest,
} from "../services/watchlistService.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Get user's watchlist
 */
export const getUserWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const watchlist = await WatchlistService.getUserWatchlist(userId);

    res.status(200).json({
      success: true,
      data: watchlist,
      count: watchlist.length,
    });
  } catch (error) {
    console.error("Get watchlist error:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch watchlist",
    });
  }
};

/**
 * Add stock to watchlist
 */
export const addToWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { stockSymbol, stockName, exchange, isin }: AddToWatchlistRequest =
      req.body;

    if (!stockSymbol || !stockName || !exchange) {
      res.status(400).json({
        success: false,
        message: "Stock symbol, name, and exchange are required",
      });
      return;
    }

    const watchlistItem = await WatchlistService.addToWatchlist(userId, {
      stockSymbol,
      stockName,
      exchange,
      isin: isin || null,
    });

    res.status(201).json({
      success: true,
      message: "Stock added to watchlist successfully",
      data: watchlistItem,
    });
  } catch (error) {
    console.error("Add to watchlist error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to add stock to watchlist";
    const statusCode = message.includes("already in") ? 409 : 500;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

/**
 * Remove stock from watchlist
 */
export const removeFromWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { stockSymbol, exchange } = req.params;

    if (!stockSymbol || !exchange) {
      res.status(400).json({
        success: false,
        message: "Stock symbol and exchange are required",
      });
      return;
    }

    await WatchlistService.removeFromWatchlist(userId, stockSymbol, exchange);

    res.status(200).json({
      success: true,
      message: "Stock removed from watchlist successfully",
    });
  } catch (error) {
    console.error("Remove from watchlist error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove stock from watchlist";
    const statusCode = message.includes("not found") ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

/**
 * Check if stock is in watchlist
 */
export const checkWatchlistStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { stockSymbol, exchange } = req.params;

    if (!stockSymbol || !exchange) {
      res.status(400).json({
        success: false,
        message: "Stock symbol and exchange are required",
      });
      return;
    }

    const isInWatchlist = await WatchlistService.isInWatchlist(
      userId,
      stockSymbol,
      exchange
    );

    res.status(200).json({
      success: true,
      data: {
        isInWatchlist,
      },
    });
  } catch (error) {
    console.error("Check watchlist status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check watchlist status",
    });
  }
};

/**
 * Get watchlist count
 */
export const getWatchlistCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const count = await WatchlistService.getWatchlistCount(userId);

    res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    console.error("Get watchlist count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get watchlist count",
    });
  }
};

/**
 * Clear entire watchlist
 */
export const clearWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    await WatchlistService.clearWatchlist(userId);

    res.status(200).json({
      success: true,
      message: "Watchlist cleared successfully",
    });
  } catch (error) {
    console.error("Clear watchlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear watchlist",
    });
  }
};
