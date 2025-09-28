import { Router } from "express";
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  getWatchlistCount,
} from "../controllers/watchlist.controller.js";
import validToken from "../middlewares/validToken.js";

const router = Router();

// All watchlist routes require authentication
router.use(validToken);

// Watchlist management routes
router.post("/add", addToWatchlist);
router.delete("/remove/:stockSymbol", removeFromWatchlist);
router.get("/", getWatchlist);
router.get("/count", getWatchlistCount);

export default router;
