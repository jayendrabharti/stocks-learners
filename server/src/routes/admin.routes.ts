import { Router } from "express";
import {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUser,
  deleteUser,
} from "../controllers/admin.controller.js";
import validToken from "../middlewares/validToken.js";

const router = Router();

// All admin routes require authentication
router.use(validToken);

// Dashboard stats
router.get("/stats", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
