import {
  emailLogin,
  emailVerify,
  getNewAccessToken,
  getUser,
  googleAuthCallback,
  googleAuthUrl,
  logoutUser,
  refreshUserToken,
  updateUser,
} from "../controllers/auth.controllers.js";
import validToken from "../middlewares/validToken.js";
import {
  emailLoginLimiter,
  otpVerifyLimiter,
  refreshLimiter,
  generalAuthLimiter,
  oauthLimiter,
} from "../middlewares/rateLimiter.js";
import express from "express";

const authRouter = express.Router();

// Protected routes
authRouter.get("/user", validToken, getUser);
authRouter.post("/user", validToken, updateUser);
authRouter.post("/logout", validToken, logoutUser);

// Token refresh with rate limiting
authRouter.post("/refresh", refreshLimiter, refreshUserToken);
authRouter.get("/refresh", refreshLimiter, getNewAccessToken);

// Email auth with rate limiting
authRouter.post("/email/login", emailLoginLimiter, emailLogin);
authRouter.post("/email/verify", otpVerifyLimiter, emailVerify);

// Google OAuth with rate limiting
authRouter.get("/google/url", generalAuthLimiter, googleAuthUrl);
authRouter.get("/google/callback", oauthLimiter, googleAuthCallback);

export default authRouter;
