import { Router } from "express";
import {
  submitContactForm,
  getAllContactForms,
  getContactForm,
  updateContactFormStatus,
  deleteContactForm,
} from "../controllers/contact.controller.js";
import validToken from "../middlewares/validToken.js";

const router = Router();

// Public route - anyone can submit
router.post("/submit", submitContactForm);

// Admin routes - require authentication and admin privileges
router.get("/", validToken, getAllContactForms);
router.get("/:id", validToken, getContactForm);
router.put("/:id", validToken, updateContactFormStatus);
router.delete("/:id", validToken, deleteContactForm);

export default router;
