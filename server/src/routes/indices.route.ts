import { Router } from "express";
import {
  getIndices,
  getMajorIndices,
  getIndexDetails,
} from "../controllers/indices.controller.js";

const router = Router();

// GET /api/indices - Search indices
router.get("/", getIndices);

// GET /api/indices/major - Get major indices
router.get("/major", getMajorIndices);

// GET /api/indices/:searchId - Get specific index details
router.get("/:searchId", getIndexDetails);

export default router;
