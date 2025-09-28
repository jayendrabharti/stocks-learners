import { Router } from "express";
import {
  getWallet,
  createWallet,
  getPortfolioSummary,
  updateCashBalance,
  createPortfolioSnapshot,
} from "../controllers/wallet.controller.js";
import validToken from "../middlewares/validToken.js";

const router = Router();

// All wallet routes require authentication
router.use(validToken);

// Wallet management routes
router.get("/", getWallet);
router.post("/create", createWallet);
router.get("/portfolio-summary", getPortfolioSummary);
router.post("/update-cash", updateCashBalance);
router.post("/snapshot", createPortfolioSnapshot);

export default router;
