import prisma from "../prisma/client.js";
import { accessSecret, accessTokenCookieOptions } from "../utils/auth.js";
import { getErrorMessage } from "../utils/utils.js";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export default async function validToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const accessToken = req.cookies?.accessToken || req.headers["access-token"];

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: { message: "Access token required. Please login." },
      });
    }

    const { id: userId } = jwt.verify(
      accessToken,
      accessSecret
    ) as AccessTokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // User deleted but token still exists - don't clear cookie here
      // Let the refresh mechanism handle it
      return res.status(401).json({
        success: false,
        error: { message: "User not found. Please login again." },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    // Handle JWT errors (expired, invalid, etc.)
    if (err instanceof jwt.JsonWebTokenError) {
      // CRITICAL FIX: Don't clear cookie on TokenExpiredError
      // The frontend ApiClient needs the cookie to exist for the refresh flow to work
      // Only clear cookie for truly invalid tokens (malformed, wrong signature)

      if (err instanceof jwt.TokenExpiredError) {
        // Don't clear cookie - just return 401 so ApiClient can refresh
        return res.status(401).json({
          success: false,
          error: {
            message: "Access token expired. Please refresh your session.",
            code: "TOKEN_EXPIRED",
          },
        });
      }

      // Only clear cookie for invalid/malformed tokens
      res.clearCookie("accessToken", accessTokenCookieOptions);

      return res.status(401).json({
        success: false,
        error: {
          message: "Invalid access token. Please login again.",
          code: "INVALID_TOKEN",
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: { message: getErrorMessage(err, "Unauthorized Access") },
    });
  }
}
