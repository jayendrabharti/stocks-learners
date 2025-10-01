import { Router } from "express";
import {
  getWalletBalance,
  getWalletDetails,
  getWalletSummary,
} from "../controllers/wallet.controller.js";
import validToken from "../middlewares/validToken.js";

const router = Router();

// All routes require authentication
router.use(validToken);

/**
 * @route   GET /api/wallet/balance
 * @desc    Get user's current virtual cash balance
 * @access  Private
 */
router.get("/balance", getWalletBalance);

/**
 * @route   GET /api/wallet/details
 * @desc    Get detailed wallet info with portfolio and recent transactions
 * @access  Private
 */
router.get("/details", getWalletDetails);

/**
 * @route   GET /api/wallet/summary
 * @desc    Get wallet summary for navbar/dashboard (quick overview)
 * @access  Private
 */
router.get("/summary", getWalletSummary);

export default router;
