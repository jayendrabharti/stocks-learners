import prisma from "../prisma/client.js";
import { getNewGrowwAccessToken } from "./getNewGrowwAccessToken.js";

/**
 * Calculate the next 6 AM expiration time
 * Access tokens expire at 6 AM every morning (IST/UTC+5:30)
 *
 * Logic:
 * - If current time is before 6 AM today → expires at 6 AM today
 * - If current time is after 6 AM today → expires at 6 AM tomorrow
 */
function getNext6AM(): Date {
  const now = new Date();
  const next6AM = new Date();

  // Set to 6:00 AM today
  next6AM.setHours(6, 0, 0, 0);

  // If it's already past 6 AM today, set to 6 AM tomorrow
  if (now >= next6AM) {
    next6AM.setDate(next6AM.getDate() + 1);
  }

  // Subtract 1 minute (60,000 ms) for early expiry
  next6AM.setTime(next6AM.getTime() - 60 * 1000);

  return next6AM;
}

/**
 * Get Groww access token with database caching
 *
 * Features:
 * - Caches tokens in database to avoid unnecessary API calls
 * - Automatically generates new token when expired (5 minutes before 6 AM)
 * - Fallback to direct API call if database is unavailable
 * - Tokens expire at 6 AM every morning
 *
 * @returns Promise<string | null> The access token or null if generation failed
 */
export default async function getGrowwAccessToken(): Promise<string | null> {
  let token: string | null = null;

  try {
    const dbToken = await prisma.growwAccessToken.findUnique({
      where: { id: 1 },
    });

    const expired =
      !dbToken ||
      !dbToken.expiresAt ||
      dbToken.expiresAt.getTime() < Date.now();

    if (!expired) {
      // Token exists and is not expired, use cached token
      token = dbToken.token;
      console.log(
        `🔄 Using cached Groww token. Expires at: ${dbToken.expiresAt.toLocaleString()}`
      );
    } else {
      // Token is expired or doesn't exist, get new token
      const result = await getNewGrowwAccessToken();
      if (result.success && result.access_token) {
        token = result.access_token;

        // Calculate expiration time (next 6 AM)
        const expiresAt = getNext6AM();

        // Save new token to database
        await prisma.growwAccessToken.upsert({
          where: { id: 1 },
          update: {
            token: token,
            expiresAt: expiresAt,
          },
          create: {
            id: 1,
            token: token,
            expiresAt: expiresAt,
          },
        });

        console.log(
          `🔑 New Groww access token saved. Expires at: ${expiresAt.toLocaleString()}`
        );
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown database error";
    console.warn(
      "⚠️ Database not available, generating token without caching:",
      errorMessage
    );
    // Fallback: get token without database caching
    const result = await getNewGrowwAccessToken();
    if (result.success && result.access_token) {
      token = result.access_token;
      const expiresAt = getNext6AM();
      console.log(
        `🔑 New Groww access token generated (not cached). Would expire at: ${expiresAt.toLocaleString()}`
      );
    }
  }

  return token;
}
