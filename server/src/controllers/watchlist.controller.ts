import { Request, Response } from "express";
import { WatchlistService } from "../services/watchlistService.js";
import { sendResponse } from "../utils/ResponseHelpers.js";
import { getErrorMessage } from "../utils/utils.js";
import { AddToWatchlistRequest } from "../types/trading.js";

const watchlistService = WatchlistService.getInstance();

/**
 * @route POST /watchlist/add
 * @desc Add stock to user's watchlist
 * @access Private
 */
export const addToWatchlist = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`📌 Adding to watchlist for user: ${req.user.id}`);

    const { stockSymbol, stockName, exchange, isin } = req.body;

    if (!stockSymbol || !stockName || !exchange) {
      return sendResponse({
        res,
        success: false,
        message: "Stock symbol, name, and exchange are required",
        error: { message: "Missing required fields" },
        statusCode: 400,
      });
    }

    const addRequest: AddToWatchlistRequest = {
      stockSymbol,
      stockName,
      exchange,
      isin,
    };

    const result = await watchlistService.addToWatchlist(
      req.user.id,
      addRequest
    );

    if (result.success && result.data) {
      return sendResponse({
        res,
        success: true,
        data: result.data,
        message: result.message || "Stock added to watchlist successfully",
        statusCode: 201,
      });
    }

    return sendResponse({
      res,
      success: false,
      message: result.error?.message || "Failed to add stock to watchlist",
      error: result.error || { message: "Unknown error" },
      statusCode:
        result.error?.code === "STOCK_ALREADY_IN_WATCHLIST"
          ? 409
          : result.error?.code === "WATCHLIST_LIMIT_EXCEEDED"
          ? 429
          : 500,
    });
  } catch (error) {
    console.error(
      "❌ Error in addToWatchlist controller:",
      getErrorMessage(error)
    );
    return sendResponse({
      res,
      success: false,
      message: "Internal server error",
      error: { message: getErrorMessage(error) },
      statusCode: 500,
    });
  }
};

/**
 * @route DELETE /watchlist/remove/:stockSymbol
 * @desc Remove stock from user's watchlist
 * @access Private
 */
export const removeFromWatchlist = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { stockSymbol } = req.params;
    const { exchange } = req.query;

    console.log(
      `🗑️ Removing from watchlist for user: ${req.user.id}, stock: ${stockSymbol}`
    );

    if (!stockSymbol) {
      return sendResponse({
        res,
        success: false,
        message: "Stock symbol is required",
        error: { message: "Missing stock symbol" },
        statusCode: 400,
      });
    }

    if (!exchange || typeof exchange !== "string") {
      return sendResponse({
        res,
        success: false,
        message: "Exchange is required as query parameter",
        error: { message: "Missing exchange parameter" },
        statusCode: 400,
      });
    }

    const result = await watchlistService.removeFromWatchlist(
      req.user.id,
      stockSymbol,
      exchange
    );

    if (result.success) {
      return sendResponse({
        res,
        success: true,
        message: result.message || "Stock removed from watchlist successfully",
        statusCode: 200,
      });
    }

    return sendResponse({
      res,
      success: false,
      message: result.error?.message || "Failed to remove stock from watchlist",
      error: result.error || { message: "Unknown error" },
      statusCode: result.error?.code === "STOCK_NOT_IN_WATCHLIST" ? 404 : 500,
    });
  } catch (error) {
    console.error(
      "❌ Error in removeFromWatchlist controller:",
      getErrorMessage(error)
    );
    return sendResponse({
      res,
      success: false,
      message: "Internal server error",
      error: { message: getErrorMessage(error) },
      statusCode: 500,
    });
  }
};

/**
 * @route GET /watchlist
 * @desc Get user's watchlist with live prices
 * @access Private
 */
export const getWatchlist = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`👀 Getting watchlist for user: ${req.user.id}`);

    const result = await watchlistService.getWatchlist(req.user.id);

    if (result.success && result.data) {
      return sendResponse({
        res,
        success: true,
        data: result.data,
        statusCode: 200,
      });
    }

    return sendResponse({
      res,
      success: false,
      message: result.error?.message || "Failed to get watchlist",
      error: result.error || { message: "Unknown error" },
      statusCode: 500,
    });
  } catch (error) {
    console.error(
      "❌ Error in getWatchlist controller:",
      getErrorMessage(error)
    );
    return sendResponse({
      res,
      success: false,
      message: "Internal server error",
      error: { message: getErrorMessage(error) },
      statusCode: 500,
    });
  }
};

/**
 * @route GET /watchlist/count
 * @desc Get user's watchlist stock count
 * @access Private
 */
export const getWatchlistCount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`🔢 Getting watchlist count for user: ${req.user.id}`);

    const count = await watchlistService.getWatchlistCount(req.user.id);

    return sendResponse({
      res,
      success: true,
      data: { count },
      statusCode: 200,
    });
  } catch (error) {
    console.error(
      "❌ Error in getWatchlistCount controller:",
      getErrorMessage(error)
    );
    return sendResponse({
      res,
      success: false,
      message: "Internal server error",
      error: { message: getErrorMessage(error) },
      statusCode: 500,
    });
  }
};
