import rateLimit from "express-rate-limit";

// Balanced rate limiting - not too strict to maintain good UX
// Email login rate limiter - 10 attempts per hour (generous for typos)
export const emailLoginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    success: false,
    error: {
      message:
        "Too many login attempts from this IP. Please try again in an hour.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// OTP verification limiter - 15 attempts per 30 minutes (allows for mistakes)
export const otpVerifyLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 15, // 15 attempts
  message: {
    success: false,
    error: {
      message:
        "Too many verification attempts. Please try again in 30 minutes.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Token refresh limiter - 30 requests per minute (very generous)
export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 refresh per minute
  message: {
    success: false,
    error: {
      message: "Too many token refresh requests. Please wait a moment.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// General auth limiter - 100 requests per 15 minutes
export const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests
  message: {
    success: false,
    error: {
      message: "Too many requests. Please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Google OAuth limiter - prevent callback abuse
export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts
  message: {
    success: false,
    error: {
      message: "Too many OAuth attempts. Please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
