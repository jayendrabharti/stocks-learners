import { Router } from "express";
import {
  searchInstruments,
  getInstrumentBySymbol,
  getInstrumentLiveData,
  getBatchInstrumentLiveData,
  getInstrumentHistoricalData,
} from "../controllers/instruments.controller.js";

const router = Router();

router.get("/", searchInstruments);
router.get("/live-data", getInstrumentLiveData);
router.post("/batch-live-data", getBatchInstrumentLiveData);
router.get("/historical-data", getInstrumentHistoricalData);
router.get("/:symbol", getInstrumentBySymbol);

export default router;
