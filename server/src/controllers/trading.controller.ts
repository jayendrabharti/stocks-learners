import { Request, Response } from "express";
import { TradingService } from "../services/tradingService.js";
import { sendResponse } from "../utils/ResponseHelpers.js";
import { getErrorMessage } from "../utils/utils.js";
import { BuyStockRequest, SellStockRequest } from "../types/trading.js";

const tradingService = TradingService.getInstance();

/**
 * @route POST /trading/buy
 * @desc Buy stock shares
 * @access Private
 */
export const buyStock = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`📈 Buy order for user: ${req.user.id}`);

    const {
      stockSymbol,
      stockName,
      exchange,
      quantity,
      orderType,
      price,
      isin,
    } = req.body;

    if (!stockSymbol || !stockName || !exchange || !quantity || !orderType) {
      return sendResponse({
        res,
        success: false,
        message:
          "Stock symbol, name, exchange, quantity, and order type are required",
        error: { message: "Missing required fields" },
        statusCode: 400,
      });
    }

    if (typeof quantity !== "number" || quantity <= 0) {
      return sendResponse({
        res,
        success: false,
        message: "Quantity must be a positive number",
        error: { message: "Invalid quantity" },
        statusCode: 400,
      });
    }

    if (
      orderType === "LIMIT" &&
      (!price || typeof price !== "number" || price <= 0)
    ) {
      return sendResponse({
        res,
        success: false,
        message: "Price is required for limit orders and must be positive",
        error: { message: "Invalid price for limit order" },
        statusCode: 400,
      });
    }

    const buyRequest: BuyStockRequest = {
      stockSymbol,
      stockName,
      exchange,
      quantity,
      orderType,
      price,
      isin,
    };

    const result = await tradingService.buyStock(req.user.id, buyRequest);

    if (result.success && result.data) {
      return sendResponse({
        res,
        success: true,
        data: result.data,
        message: result.message || "Stock purchased successfully",
        statusCode: 201,
      });
    }

    return sendResponse({
      res,
      success: false,
      message: result.error?.message || "Failed to buy stock",
      error: result.error || { message: "Unknown error" },
      statusCode:
        result.error?.code === "INSUFFICIENT_FUNDS"
          ? 400
          : result.error?.code === "MARKET_CLOSED"
          ? 403
          : result.error?.code === "WALLET_NOT_FOUND"
          ? 404
          : 500,
    });
  } catch (error) {
    console.error("❌ Error in buyStock controller:", getErrorMessage(error));
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
 * @route POST /trading/sell
 * @desc Sell stock shares
 * @access Private
 */
export const sellStock = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`📉 Sell order for user: ${req.user.id}`);

    const { stockSymbol, exchange, quantity, orderType, price } = req.body;

    if (!stockSymbol || !exchange || !quantity || !orderType) {
      return sendResponse({
        res,
        success: false,
        message:
          "Stock symbol, exchange, quantity, and order type are required",
        error: { message: "Missing required fields" },
        statusCode: 400,
      });
    }

    if (typeof quantity !== "number" || quantity <= 0) {
      return sendResponse({
        res,
        success: false,
        message: "Quantity must be a positive number",
        error: { message: "Invalid quantity" },
        statusCode: 400,
      });
    }

    if (
      orderType === "LIMIT" &&
      (!price || typeof price !== "number" || price <= 0)
    ) {
      return sendResponse({
        res,
        success: false,
        message: "Price is required for limit orders and must be positive",
        error: { message: "Invalid price for limit order" },
        statusCode: 400,
      });
    }

    const sellRequest: SellStockRequest = {
      stockSymbol,
      exchange,
      quantity,
      orderType,
      price,
    };

    const result = await tradingService.sellStock(req.user.id, sellRequest);

    if (result.success && result.data) {
      return sendResponse({
        res,
        success: true,
        data: result.data,
        message: result.message || "Stock sold successfully",
        statusCode: 200,
      });
    }

    return sendResponse({
      res,
      success: false,
      message: result.error?.message || "Failed to sell stock",
      error: result.error || { message: "Unknown error" },
      statusCode:
        result.error?.code === "INSUFFICIENT_SHARES"
          ? 400
          : result.error?.code === "MARKET_CLOSED"
          ? 403
          : result.error?.code === "HOLDING_NOT_FOUND"
          ? 404
          : result.error?.code === "WALLET_NOT_FOUND"
          ? 404
          : 500,
    });
  } catch (error) {
    console.error("❌ Error in sellStock controller:", getErrorMessage(error));
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
 * @route GET /trading/portfolio
 * @desc Get user's stock portfolio
 * @access Private
 */
export const getPortfolio = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`📊 Getting portfolio for user: ${req.user.id}`);

    const result = await tradingService.getPortfolio(req.user.id);

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
      message: result.error?.message || "Failed to get portfolio",
      error: result.error || { message: "Unknown error" },
      statusCode: result.error?.code === "WALLET_NOT_FOUND" ? 404 : 500,
    });
  } catch (error) {
    console.error(
      "❌ Error in getPortfolio controller:",
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
 * @route GET /trading/transactions
 * @desc Get user's transaction history
 * @access Private
 */
export const getTransactions = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`📋 Getting transactions for user: ${req.user.id}`);

    const { page = "1", limit = "50", type, stockSymbol } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return sendResponse({
        res,
        success: false,
        message: "Page must be a positive number",
        error: { message: "Invalid page parameter" },
        statusCode: 400,
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return sendResponse({
        res,
        success: false,
        message: "Limit must be between 1 and 100",
        error: { message: "Invalid limit parameter" },
        statusCode: 400,
      });
    }

    const result = await tradingService.getTransactions(req.user.id, {
      page: pageNum,
      limit: limitNum,
      type: type as any, // Import TransactionType from @prisma/client
      stockSymbol: stockSymbol as string,
    });

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
      message: result.error?.message || "Failed to get transactions",
      error: result.error || { message: "Unknown error" },
      statusCode: result.error?.code === "WALLET_NOT_FOUND" ? 404 : 500,
    });
  } catch (error) {
    console.error(
      "❌ Error in getTransactions controller:",
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
 * @route GET /trading/portfolio/performance
 * @desc Get portfolio performance metrics (to be implemented)
 * @access Private
 */
export const getPortfolioPerformance = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(
      `📊 Getting portfolio performance for user: ${req.user.id} - Feature coming soon`
    );

    return sendResponse({
      res,
      success: false,
      message: "Portfolio performance feature is not yet implemented",
      error: { message: "Feature not available" },
      statusCode: 501,
    });
  } catch (error) {
    console.error(
      "❌ Error in getPortfolioPerformance controller:",
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
