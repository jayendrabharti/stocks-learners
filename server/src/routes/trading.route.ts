import { Router } from "express";
import {
  buyStock,
  sellStock,
  getTransactionHistory,
  getPortfolio,
  getPurchaseLots,
  checkStaleMIS,
  processAutoSquareOff,
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

/**
 * @route   GET /api/trading/purchase-lots/:stockSymbol/:exchange/:product
 * @desc    Get individual purchase lots for a specific holding
 * @access  Private
 */
router.get("/purchase-lots/:stockSymbol/:exchange/:product", getPurchaseLots);

/**
 * @route   GET /api/trading/check-stale-mis
 * @desc    Check if user has stale MIS positions (quick check)
 * @access  Private
 */
router.get("/check-stale-mis", checkStaleMIS);

/**
 * @route   POST /api/trading/auto-square-off
 * @desc    Auto square-off stale MIS positions at historical closing prices
 * @access  Private
 */
router.post("/auto-square-off", processAutoSquareOff);

export default router;
