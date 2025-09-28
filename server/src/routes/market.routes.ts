import { Router } from "express";
import {
  getLivePrice,
  getMultiplePrices,
  getMarketStatus,
  updatePortfolioPrices,
} from "../controllers/market.controller.js";
import validToken from "../middlewares/validToken.js";

const router = Router();

// All market data routes require authentication
router.use(validToken);

// Market data routes
router.get("/price/:stockSymbol", getLivePrice);
router.post("/prices", getMultiplePrices);
router.get("/status", getMarketStatus);
router.post("/update-portfolio-prices", updatePortfolioPrices);

export default router;
