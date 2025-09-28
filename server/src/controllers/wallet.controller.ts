import { Request, Response } from "express";
import { WalletService } from "../services/walletService.js";
import { sendResponse } from "../utils/ResponseHelpers.js";
import { getErrorMessage } from "../utils/utils.js";

const walletService = WalletService.getInstance();

/**
 * @route GET /wallet
 * @desc Get user's wallet data
 * @access Private
 */
export const getWallet = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`📊 Getting wallet for user: ${req.user.id}`);

    const result = await walletService.getWallet(req.user.id);

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
      message: result.error?.message || "Failed to get wallet",
      error: result.error || { message: "Unknown error" },
      statusCode: result.error?.code === "WALLET_NOT_FOUND" ? 404 : 500,
    });
  } catch (error) {
    console.error("❌ Error in getWallet controller:", getErrorMessage(error));
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
 * @route POST /wallet/create
 * @desc Create wallet for user (usually called during user registration)
 * @access Private
 */
export const createWallet = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`📊 Creating wallet for user: ${req.user.id}`);

    const { initialBalance, currency } = req.body;

    const result = await walletService.createWallet(
      req.user.id,
      initialBalance,
      currency
    );

    if (result.success && result.data) {
      return sendResponse({
        res,
        success: true,
        data: result.data,
        message: result.message || "Wallet created successfully",
        statusCode: 201,
      });
    }

    return sendResponse({
      res,
      success: false,
      message: result.error?.message || "Failed to create wallet",
      error: result.error || { message: "Unknown error" },
      statusCode: result.error?.code === "WALLET_EXISTS" ? 409 : 500,
    });
  } catch (error) {
    console.error(
      "❌ Error in createWallet controller:",
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
 * @route GET /wallet/portfolio-summary
 * @desc Get portfolio summary with wallet data
 * @access Private
 */
export const getPortfolioSummary = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`📊 Getting portfolio summary for user: ${req.user.id}`);

    const result = await walletService.getPortfolioSummary(req.user.id);

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
      message: result.error?.message || "Failed to get portfolio summary",
      error: result.error || { message: "Unknown error" },
      statusCode: result.error?.code === "WALLET_NOT_FOUND" ? 404 : 500,
    });
  } catch (error) {
    console.error(
      "❌ Error in getPortfolioSummary controller:",
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
 * @route POST /wallet/update-cash
 * @desc Update virtual cash balance (for admin/testing purposes)
 * @access Private
 */
export const updateCashBalance = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`💰 Updating cash balance for user: ${req.user.id}`);

    const { amount, operation } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return sendResponse({
        res,
        success: false,
        message: "Valid amount is required",
        statusCode: 400,
      });
    }

    if (!operation || !["ADD", "SUBTRACT"].includes(operation)) {
      return sendResponse({
        res,
        success: false,
        message: "Operation must be either 'ADD' or 'SUBTRACT'",
        statusCode: 400,
      });
    }

    const result = await walletService.updateCashBalance(
      req.user.id,
      amount,
      operation
    );

    if (result.success && result.data) {
      return sendResponse({
        res,
        success: true,
        data: result.data,
        message: result.message || "Cash balance updated successfully",
        statusCode: 200,
      });
    }

    return sendResponse({
      res,
      success: false,
      message: result.error?.message || "Failed to update cash balance",
      error: result.error || { message: "Unknown error" },
      statusCode:
        result.error?.code === "INSUFFICIENT_FUNDS"
          ? 400
          : result.error?.code === "WALLET_NOT_FOUND"
          ? 404
          : 500,
    });
  } catch (error) {
    console.error(
      "❌ Error in updateCashBalance controller:",
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
 * @route POST /wallet/snapshot
 * @desc Create daily portfolio snapshot
 * @access Private
 */
export const createPortfolioSnapshot = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(`📸 Creating portfolio snapshot for user: ${req.user.id}`);

    const result = await walletService.createPortfolioSnapshot(req.user.id);

    if (result.success) {
      return sendResponse({
        res,
        success: true,
        message: result.message || "Portfolio snapshot created successfully",
        statusCode: 200,
      });
    }

    return sendResponse({
      res,
      success: false,
      message: result.error?.message || "Failed to create portfolio snapshot",
      error: result.error || { message: "Unknown error" },
      statusCode: result.error?.code === "WALLET_NOT_FOUND" ? 404 : 500,
    });
  } catch (error) {
    console.error(
      "❌ Error in createPortfolioSnapshot controller:",
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
