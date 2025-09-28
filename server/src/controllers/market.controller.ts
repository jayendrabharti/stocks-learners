import { Request, Response } from "express";
import { MarketDataService } from "../services/marketDataService.js";
import { sendResponse } from "../utils/ResponseHelpers.js";
import { getErrorMessage } from "../utils/utils.js";

const marketDataService = MarketDataService.getInstance();

/**
 * @route GET /market/price/:stockSymbol
 * @desc Get live stock price
 * @access Private
 */
export const getLivePrice = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { stockSymbol } = req.params;
    const { exchange } = req.query;

    console.log(`📊 Getting live price for ${stockSymbol} on ${exchange}`);

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

    const price = await marketDataService.getLivePrice(stockSymbol, exchange);

    if (price) {
      return sendResponse({
        res,
        success: true,
        data: price,
        statusCode: 200,
      });
    }

    return sendResponse({
      res,
      success: false,
      message: "Stock price not found or market data unavailable",
      error: { message: "Price data not available" },
      statusCode: 404,
    });
  } catch (error) {
    console.error(
      "❌ Error in getLivePrice controller:",
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
 * @route POST /market/prices
 * @desc Get live prices for multiple stocks
 * @access Private
 */
export const getMultiplePrices = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { stocks } = req.body;

    console.log(`📊 Getting live prices for multiple stocks`);

    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return sendResponse({
        res,
        success: false,
        message: "Stocks array is required and must contain at least one stock",
        error: { message: "Invalid stocks array" },
        statusCode: 400,
      });
    }

    if (stocks.length > 50) {
      return sendResponse({
        res,
        success: false,
        message: "Maximum 50 stocks allowed per request",
        error: { message: "Too many stocks requested" },
        statusCode: 400,
      });
    }

    // Validate each stock entry
    for (const stock of stocks) {
      if (!stock.symbol || !stock.exchange) {
        return sendResponse({
          res,
          success: false,
          message: "Each stock must have symbol and exchange properties",
          error: { message: "Invalid stock format" },
          statusCode: 400,
        });
      }
    }

    const prices = await marketDataService.getLivePrices(stocks);

    return sendResponse({
      res,
      success: true,
      data: { prices },
      statusCode: 200,
    });
  } catch (error) {
    console.error(
      "❌ Error in getMultiplePrices controller:",
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
 * @route GET /market/status
 * @desc Get market status (open/closed)
 * @access Private
 */
export const getMarketStatus = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`🏪 Getting market status`);

    // Use NSE as default exchange
    const marketInfo = await marketDataService.isMarketOpen("NSE");

    return sendResponse({
      res,
      success: true,
      data: {
        isOpen: marketInfo.isOpen,
        session: marketInfo.currentSession,
        sessionInfo: marketInfo,
        timestamp: new Date().toISOString(),
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error(
      "❌ Error in getMarketStatus controller:",
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
 * @route POST /market/update-portfolio-prices
 * @desc Update portfolio prices for a user (admin endpoint)
 * @access Private
 */
export const updatePortfolioPrices = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.body;

    console.log(
      `🔄 Updating portfolio prices for user: ${userId || req.user.id}`
    );

    const targetUserId = userId || req.user.id;

    await marketDataService.updatePortfolioPrices(targetUserId);

    return sendResponse({
      res,
      success: true,
      message: "Portfolio prices updated successfully",
      statusCode: 200,
    });
  } catch (error) {
    console.error(
      "❌ Error in updatePortfolioPrices controller:",
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
