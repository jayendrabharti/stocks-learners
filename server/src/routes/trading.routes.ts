import { Router } from "express";
import {
  buyStock,
  sellStock,
  getPortfolio,
  getTransactions,
  getPortfolioPerformance,
} from "../controllers/trading.controller.js";
import validToken from "../middlewares/validToken.js";

const router = Router();

// All trading routes require authentication
router.use(validToken);

// Trading execution routes
router.post("/buy", buyStock);
router.post("/sell", sellStock);

// Portfolio and transaction routes
router.get("/portfolio", getPortfolio);
router.get("/transactions", getTransactions);
router.get("/portfolio/performance", getPortfolioPerformance);

export default router;
