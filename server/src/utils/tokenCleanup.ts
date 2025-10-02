import prisma from "../prisma/client.js";

/**
 * Cleanup expired and revoked refresh tokens from database
 * This should be run periodically (e.g., daily cron job)
 */
export const cleanupExpiredTokens = async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } }, // Expired tokens
          { isRevoked: true }, // Revoked tokens
        ],
      },
    });

    console.log(
      `✅ Token cleanup: Removed ${result.count} expired/revoked tokens`
    );
    return result.count;
  } catch (error) {
    console.error("❌ Token cleanup error:", error);
    throw error;
  }
};

/**
 * Cleanup expired OTPs from database
 */
export const cleanupExpiredOTPs = async () => {
  try {
    const result = await prisma.otp.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    console.log(`✅ OTP cleanup: Removed ${result.count} expired OTPs`);
    return result.count;
  } catch (error) {
    console.error("❌ OTP cleanup error:", error);
    throw error;
  }
};

/**
 * Run all cleanup tasks
 */
export const runCleanupTasks = async () => {
  console.log("🧹 Starting cleanup tasks...");

  try {
    await Promise.all([cleanupExpiredTokens(), cleanupExpiredOTPs()]);
    console.log("✅ All cleanup tasks completed successfully");
  } catch (error) {
    console.error("❌ Cleanup tasks failed:", error);
  }
};

// Run cleanup on startup
runCleanupTasks();

// Run cleanup every 24 hours
setInterval(() => {
  runCleanupTasks();
}, 24 * 60 * 60 * 1000); // 24 hours
