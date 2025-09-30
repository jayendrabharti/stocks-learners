import {
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlistStatus,
  getWatchlistCount,
  clearWatchlist,
} from "../controllers/watchlist.controllers.js";
import validToken from "../middlewares/validToken.js";
import express from "express";

const watchlistRouter = express.Router();

// All watchlist routes require authentication
watchlistRouter.use(validToken);

// Get user's watchlist
watchlistRouter.get("/", getUserWatchlist);

// Get watchlist count
watchlistRouter.get("/count", getWatchlistCount);

// Check if stock is in watchlist
watchlistRouter.get("/status/:stockSymbol/:exchange", checkWatchlistStatus);

// Add stock to watchlist
watchlistRouter.post("/", addToWatchlist);

// Remove stock from watchlist
watchlistRouter.delete("/:stockSymbol/:exchange", removeFromWatchlist);

// Clear entire watchlist
watchlistRouter.delete("/", clearWatchlist);

export default watchlistRouter;
