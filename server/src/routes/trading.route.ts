import { Router } from "express";
import {
  buyStock,
  sellStock,
  getTransactionHistory,
  getPortfolio,
} from "../controllers/trading.controller.js";
import validToken from "../middlewares/validToken.js";

const router = Router();

// All routes require authentication
router.use(validToken);

/**
 * @route   POST /api/trading/buy
 * @desc    Buy stocks - Place a market buy order
 * @access  Private
 */
router.post("/buy", buyStock);

/**
 * @route   POST /api/trading/sell
 * @desc    Sell stocks - Place a market sell order
 * @access  Private
 */
router.post("/sell", sellStock);

/**
 * @route   GET /api/trading/transactions
 * @desc    Get user's transaction history with pagination
 * @access  Private
 */
router.get("/transactions", getTransactionHistory);

/**
 * @route   GET /api/trading/portfolio
 * @desc    Get user's portfolio holdings
 * @access  Private
 */
router.get("/portfolio", getPortfolio);

export default router;
