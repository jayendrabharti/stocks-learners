import prisma from "../prisma/client.js";
import {
  accessSecret,
  accessTokenCookieOptions,
  accessTokenExpiry,
  clientBaseUrl,
  getExpiryDate,
  refreshSecret,
  refreshTokenCookieOptions,
  refreshTokenExpiry,
  testUser,
} from "../utils/auth.js";
import jwt from "jsonwebtoken";
import ms, { StringValue } from "ms";
import { getErrorMessage } from "../utils/utils.js";
import { Request, Response } from "express";
import { sendResponse } from "../utils/ResponseHelpers.js";
import { oAuth2Client } from "../utils/googleClient.js";
import { User } from "@prisma/client";
import crypto from "crypto";
import sendMail from "../utils/sendMail.js";
import axios from "axios";

export const generateTokens = async (
  req: Request,
  res: Response,
  user: User
) => {
  const clientRefreshToken =
    req.cookies?.refreshToken || req.headers["refresh-token"];

  // Only query database if we have a token
  if (clientRefreshToken) {
    try {
      const existingToken = await prisma.refreshToken.findUnique({
        where: { token: clientRefreshToken },
      });

      if (existingToken) {
        jwt.verify(clientRefreshToken, refreshSecret);

        await prisma.refreshToken.update({
          where: {
            token: clientRefreshToken,
          },
          data: {
            isRevoked: true,
          },
        });
      }
    } catch (error) {
      // Token verification failed or DB error - continue with new token generation
      console.log("Error revoking existing token:", error);
    }
  }

  const accessToken = jwt.sign(
    { id: user.id, email: user.email } as AccessTokenPayload,
    accessSecret,
    { expiresIn: accessTokenExpiry as StringValue }
  );

  const refreshToken = jwt.sign(
    { id: user.id, createdAt: new Date() } as RefreshTokenPayload,
    refreshSecret,
    {
      expiresIn: refreshTokenExpiry as StringValue,
    }
  );

  const clientInfo = {
    userAgent: req?.headers?.["user-agent"] ?? "N/A",
    host: req?.headers?.["host"] ?? "N/A",
    ip:
      (req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress) ??
      "N/A",
  };

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getExpiryDate(refreshTokenExpiry),
      clientInfo,
    },
  });

  res
    .cookie("accessToken", accessToken, accessTokenCookieOptions)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  return { accessToken, refreshToken };
};

export const getUser = async (req: Request, res: Response) => {
  try {
    return sendResponse({
      res,
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to get user information"),
      },
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    // Whitelist only allowed fields - prevent updating sensitive fields
    const { name, phone, dateOfBirth, avatar } = req.body;

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          error: { message: "Name must be a non-empty string" },
        });
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      if (phone !== null) {
        // Validate phone number format (10 digits)
        if (!/^\d{10}$/.test(phone)) {
          return sendResponse({
            res,
            statusCode: 400,
            success: false,
            error: { message: "Phone number must be exactly 10 digits" },
          });
        }
      }
      updateData.phone = phone;
    }

    if (dateOfBirth !== undefined) {
      if (dateOfBirth !== null) {
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          return sendResponse({
            res,
            statusCode: 400,
            success: false,
            error: { message: "Invalid date format" },
          });
        }
        updateData.dateOfBirth = dob;
      } else {
        updateData.dateOfBirth = null;
      }
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    // Only update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        error: { message: "No valid fields to update" },
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return sendResponse({
      res,
      success: true,
      data: { user },
      message: "User updated successfully",
    });
  } catch (error) {
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to update user information"),
      },
    });
  }
};

export const refreshUserToken = async (req: Request, res: Response) => {
  const clientRefreshToken =
    req.cookies?.refreshToken || req.headers["refresh-token"];

  if (!clientRefreshToken) {
    return sendResponse({
      res,
      statusCode: 401,
      success: false,
      error: {
        message: "Unauthorized request - no refresh token provided",
      },
    });
  }

  try {
    const { id: userId } = jwt.verify(
      clientRefreshToken,
      refreshSecret
    ) as RefreshTokenPayload;

    const dbRefreshToken = await prisma.refreshToken.findUnique({
      where: {
        userId_token: {
          userId: userId,
          token: clientRefreshToken,
        },
      },
      include: { user: true },
    });

    // Token not found or revoked - clear cookies
    if (!dbRefreshToken || dbRefreshToken.isRevoked) {
      res
        .clearCookie("accessToken", accessTokenCookieOptions)
        .clearCookie("refreshToken", refreshTokenCookieOptions);

      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        error: {
          message: "Invalid or revoked refresh token. Please login again.",
        },
      });
    }

    // Check if token is expired
    if (dbRefreshToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { id: dbRefreshToken.id },
      });

      res
        .clearCookie("accessToken", accessTokenCookieOptions)
        .clearCookie("refreshToken", refreshTokenCookieOptions);

      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        error: {
          message: "Refresh token expired. Please login again.",
        },
      });
    }

    if (!dbRefreshToken?.user) {
      throw new Error("User not found");
    }

    await generateTokens(req, res, dbRefreshToken.user);

    return sendResponse({
      res,
      success: true,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    // Clear cookies on any JWT error
    res
      .clearCookie("accessToken", accessTokenCookieOptions)
      .clearCookie("refreshToken", refreshTokenCookieOptions);

    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(
          error,
          "Failed to refresh token. Please login again."
        ),
      },
      statusCode: 403,
    });
  }
};

export const getNewAccessToken = async (req: Request, res: Response) => {
  const clientRefreshToken =
    req.cookies?.refreshToken || req.headers["refresh-token"];

  if (!clientRefreshToken) {
    return sendResponse({
      res,
      statusCode: 401,
      success: false,
      error: {
        message: "Unauthorized request - no refresh token provided",
      },
    });
  }

  try {
    const { id: userId } = jwt.verify(
      clientRefreshToken,
      refreshSecret
    ) as RefreshTokenPayload;

    const dbRefreshToken = await prisma.refreshToken.findUnique({
      where: { userId: userId, token: clientRefreshToken },
      include: { user: true },
    });

    // Token not found or revoked - clear cookies
    if (!dbRefreshToken || dbRefreshToken.isRevoked) {
      res
        .clearCookie("accessToken", accessTokenCookieOptions)
        .clearCookie("refreshToken", refreshTokenCookieOptions);

      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        error: {
          message: "Invalid or revoked refresh token. Please login again.",
        },
      });
    }

    // Check if token is expired
    if (dbRefreshToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { id: dbRefreshToken.id },
      });

      res
        .clearCookie("accessToken", accessTokenCookieOptions)
        .clearCookie("refreshToken", refreshTokenCookieOptions);

      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        error: {
          message: "Refresh token expired. Please login again.",
        },
      });
    }

    if (!dbRefreshToken?.user) {
      throw new Error("User not found");
    }

    await generateTokens(req, res, dbRefreshToken.user);

    return sendResponse({
      res,
      success: true,
      data: {
        accessTokenExpiresAt: new Date(Date.now() + ms(accessTokenExpiry)),
        // Note: Refresh token is set in httpOnly cookie, not returned in body
      },
      message: "Token refreshed successfully",
    });
  } catch (error) {
    // Clear cookies on any JWT error
    res
      .clearCookie("accessToken", accessTokenCookieOptions)
      .clearCookie("refreshToken", refreshTokenCookieOptions);

    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(
          error,
          "Failed to refresh token. Please login again."
        ),
      },
      statusCode: 403,
    });
  }
};

export const emailLogin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Input validation
    if (!email) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        error: { message: "Email is required" },
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        error: { message: "Invalid email format" },
      });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
        },
      });
    }
    if (!user) throw new Error("User creation failed");

    // Delete any existing OTPs for this user
    await prisma.otp.deleteMany({ where: { userId: user.id } });

    let otp;
    if (testUser && testUser.email === email) {
      otp = testUser.otp;
    } else {
      otp = crypto.randomInt(100000, 1000000).toString();
    }
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    await prisma.otp.create({
      data: {
        userId: user.id,
        otp,
        expiresAt,
      },
    });

    if (!(testUser && testUser.email === email)) {
      await sendMail({
        to: email,
        subject: "Your OTP Code",
        content: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
      });
    }

    return sendResponse({
      res,
      success: true,
      message: `OTP sent to ${email}`,
      data: { otpExpiresAt: expiresAt },
    });
  } catch (error) {
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to login with email"),
      },
    });
  }
};

export const emailVerify = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // Input validation
    if (!email || !otp) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        error: { message: "Email and OTP are required" },
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        error: { message: "OTP must be a 6-digit number" },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { otp: true },
    });

    if (!user) throw new Error("User not found");
    if (!user.otp) throw new Error("No OTP found. Please request a new one.");

    // Check if OTP is locked (too many failed attempts)
    if (user.otp.lockedAt && user.otp.lockedAt > new Date()) {
      const minutesLeft = Math.ceil(
        (user.otp.lockedAt.getTime() - Date.now()) / (60 * 1000)
      );
      return sendResponse({
        res,
        statusCode: 429,
        success: false,
        error: {
          message: `Too many failed attempts. Please try again in ${minutesLeft} minute(s) or request a new OTP.`,
        },
      });
    }

    // Check if OTP is expired
    if (user.otp.expiresAt < new Date()) {
      await prisma.otp.delete({ where: { id: user.otp.id } });
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        error: { message: "OTP has expired. Please request a new one." },
      });
    }

    // Verify OTP
    const validOtp = user.otp.otp === otp;

    if (validOtp) {
      // Success - delete OTP and generate tokens
      await prisma.otp.delete({ where: { id: user.otp.id } });
      await generateTokens(req, res, user);

      return sendResponse({
        res,
        success: true,
        message: "OTP verified successfully",
        data: { user: { id: user.id, email: user.email, name: user.name } },
      });
    } else {
      // Failed attempt - increment counter
      const newAttempts = user.otp.attempts + 1;

      if (newAttempts >= 5) {
        // Lock for 15 minutes after 5 failed attempts
        await prisma.otp.update({
          where: { id: user.otp.id },
          data: {
            attempts: newAttempts,
            lockedAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          },
        });

        return sendResponse({
          res,
          statusCode: 429,
          success: false,
          error: {
            message:
              "Too many failed attempts. OTP locked for 15 minutes. Please request a new OTP.",
          },
        });
      } else {
        // Increment attempt counter
        await prisma.otp.update({
          where: { id: user.otp.id },
          data: { attempts: newAttempts },
        });

        const remainingAttempts = 5 - newAttempts;
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          error: {
            message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
          },
        });
      }
    }
  } catch (error) {
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to verify email"),
      },
    });
  }
};

export const googleAuthUrl = (_req: Request, res: Response) => {
  try {
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      prompt: "consent",
    });
    return sendResponse({
      res,
      success: true,
      data: { url: authorizeUrl },
    });
  } catch (error) {
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to get Google Auth URL"),
      },
    });
  }
};

export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code;
    if (!code || typeof code !== "string") {
      return sendResponse({
        res,
        success: false,
        error: {
          message: "Authorization code is required",
        },
        statusCode: 400,
      });
    }

    const { tokens } = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(tokens);

    const { id_token, access_token } = tokens;

    const { data: GoogleUserInfo } = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );
    const { email, name, picture } = GoogleUserInfo as {
      email: string;
      name: string;
      picture: string;
    };

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          avatar: picture,
        },
      });
    }

    await generateTokens(req, res, user);

    return res.redirect(clientBaseUrl);
  } catch (error) {
    console.error("Google Auth Callback Error:", error);
    return res.redirect(
      encodeURI(
        `${clientBaseUrl}/login?error=Failed to authenticate with Google`
      )
    );
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const clientRefreshToken =
      req.cookies?.refreshToken || req.headers["refresh-token"];

    if (clientRefreshToken) {
      // Delete only if token belongs to the user
      await prisma.refreshToken.deleteMany({
        where: {
          token: clientRefreshToken,
          userId: req.user.id, // Verify ownership
        },
      });
    }

    // Always clear cookies on logout
    res
      .clearCookie("accessToken", accessTokenCookieOptions)
      .clearCookie("refreshToken", refreshTokenCookieOptions);

    return sendResponse({
      res,
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    // Even on error, clear cookies
    res
      .clearCookie("accessToken", accessTokenCookieOptions)
      .clearCookie("refreshToken", refreshTokenCookieOptions);

    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to logout"),
      },
    });
  }
};
