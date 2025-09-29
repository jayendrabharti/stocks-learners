import { Router } from "express";
import {
  searchInstruments,
  getInstrumentBySymbol,
  getInstrumentLiveData,
  getInstrumentHistoricalData,
} from "../controllers/instruments.controller.js";

const router = Router();

router.get("/", searchInstruments);
router.get("/live-data", getInstrumentLiveData);
router.get("/historical-data", getInstrumentHistoricalData);
router.get("/:symbol", getInstrumentBySymbol);

export default router;
