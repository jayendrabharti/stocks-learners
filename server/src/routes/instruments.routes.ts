import { Router } from "express";
import {
  searchInstruments,
  getInstrumentBySymbol,
  getInstrumentLiveData,
  getBatchInstrumentLiveData,
  getInstrumentHistoricalData,
  globalSearch,
} from "../controllers/instruments.controller.js";

const router = Router();

// Global search endpoint (Groww API proxy)
router.get("/search", globalSearch);

// Instruments search with filters (local data)
router.get("/", searchInstruments);

// Live data endpoints
router.get("/live-data", getInstrumentLiveData);
router.post("/batch-live-data", getBatchInstrumentLiveData);

// Historical data
router.get("/historical-data", getInstrumentHistoricalData);

// Get by symbol (must be last to avoid route conflicts)
router.get("/:symbol", getInstrumentBySymbol);

export default router;
