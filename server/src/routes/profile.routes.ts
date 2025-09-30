import { Router } from "express";
import multer from "multer";
import { uploadProfilePicture, getProfilePicture, deleteProfilePicture } from "../controllers/profile.controllers.js";
import validToken from "../middlewares/validToken.js";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// Upload profile picture
router.post("/upload", validToken, upload.single('avatar'), uploadProfilePicture);

// Get profile picture URL
router.get("/avatar/:userId", getProfilePicture);

// Delete profile picture
router.delete("/upload", validToken, deleteProfilePicture);

export default router;