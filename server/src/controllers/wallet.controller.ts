import { Request, Response } from "express";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../prisma/client.js";

const INITIAL_WALLET_BALANCE = 1000000; // ₹10,00,000

/**
 * Initialize wallet for a user (called during registration or first access)
 */
export const initializeWallet = async (userId: string) => {
  try {
    // Check if wallet already exists
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      // Create new wallet with initial balance
      wallet = await prisma.wallet.create({
        data: {
          userId,
          virtualCash: INITIAL_WALLET_BALANCE,
        },
      });
    }

    return wallet;
  } catch (error) {
    console.error("Error initializing wallet:", error);
    throw new Error("Failed to initialize wallet");
  }
};

/**
 * Get wallet balance for authenticated user
 */
export const getWalletBalance = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not authenticated",
      });
    }

    // Try to get existing wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    // If wallet doesn't exist, initialize it
    if (!wallet) {
      wallet = await initializeWallet(userId);
    }

    return res.status(200).json({
      success: true,
      data: {
        virtualCash: wallet.virtualCash.toString(),
        currency: wallet.currency,
        userId: wallet.userId,
        updatedAt: wallet.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve wallet balance",
    });
  }
};

/**
 * Get detailed wallet information including portfolio metrics
 */
export const getWalletDetails = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not authenticated",
      });
    }

    // Get or initialize wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await initializeWallet(userId);
    }

    // Get recent transactions (last 10)
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { executedAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        quantity: true,
        price: true,
        totalAmount: true,
        stockSymbol: true,
        stockName: true,
        exchange: true,
        executedAt: true,
        status: true,
      },
    });

    // Get current portfolio holdings
    const portfolio = await prisma.portfolio.findMany({
      where: { userId, quantity: { gt: 0 } },
      select: {
        stockSymbol: true,
        stockName: true,
        quantity: true,
        averagePrice: true,
        currentPrice: true,
        currentValue: true,
        unrealizedPnL: true,
        unrealizedPnLPerc: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        virtualCash: wallet.virtualCash.toString(),
        currency: wallet.currency,
        totalInvested: wallet.totalInvested.toString(),
        currentValue: wallet.currentValue.toString(),
        totalPnL: wallet.totalPnL.toString(),
        totalPnLPercent: wallet.totalPnLPercent,
        dayPnL: wallet.dayPnL.toString(),
        dayPnLPercent: wallet.dayPnLPercent,
        initialBalance: INITIAL_WALLET_BALANCE,
        portfolio,
        recentTransactions,
        lastUpdatedAt: wallet.lastUpdatedAt,
        updatedAt: wallet.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting wallet details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve wallet details",
    });
  }
};

/**
 * Get wallet summary - quick overview for navbar/dashboard
 */
export const getWalletSummary = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not authenticated",
      });
    }

    // Get or initialize wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: {
        virtualCash: true,
        currency: true,
        totalInvested: true,
        currentValue: true,
        totalPnL: true,
        totalPnLPercent: true,
        dayPnL: true,
        dayPnLPercent: true,
      },
    });

    if (!wallet) {
      const newWallet = await initializeWallet(userId);
      wallet = {
        virtualCash: newWallet.virtualCash,
        currency: newWallet.currency,
        totalInvested: newWallet.totalInvested,
        currentValue: newWallet.currentValue,
        totalPnL: newWallet.totalPnL,
        totalPnLPercent: newWallet.totalPnLPercent,
        dayPnL: newWallet.dayPnL,
        dayPnLPercent: newWallet.dayPnLPercent,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        virtualCash: wallet.virtualCash.toString(),
        currency: wallet.currency,
        totalInvested: wallet.totalInvested.toString(),
        currentValue: wallet.currentValue.toString(),
        totalPnL: wallet.totalPnL.toString(),
        totalPnLPercent: wallet.totalPnLPercent,
        dayPnL: wallet.dayPnL.toString(),
        dayPnLPercent: wallet.dayPnLPercent,
      },
    });
  } catch (error) {
    console.error("Error getting wallet summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve wallet summary",
    });
  }
};

/**
 * Update wallet balance (internal use only - called during buy/sell)
 */
export const updateWalletBalance = async (
  userId: string,
  amount: number | Decimal,
  operation: "ADD" | "DEDUCT"
): Promise<{ success: boolean; newBalance: Decimal }> => {
  try {
    // Get current wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Convert amount to Decimal if it's a number
    const amountDecimal =
      typeof amount === "number" ? new Decimal(amount) : amount;

    // Calculate new balance
    const currentBalance = new Decimal(wallet.virtualCash.toString());
    const newBalance =
      operation === "ADD"
        ? currentBalance.add(amountDecimal)
        : currentBalance.sub(amountDecimal);

    // Prevent negative balance
    if (newBalance.isNegative()) {
      throw new Error("Insufficient funds");
    }

    // Update wallet
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: {
        virtualCash: newBalance.toNumber(),
        updatedAt: new Date(),
      },
    });

    return { success: true, newBalance: updatedWallet.virtualCash };
  } catch (error) {
    console.error("Error updating wallet balance:", error);
    throw error;
  }
};

/**
 * Recalculate wallet portfolio metrics from holdings
 * This should be called after portfolio updates or price updates
 */
export const recalculateWalletMetrics = async (
  userId: string
): Promise<void> => {
  try {
    // Get all holdings
    const holdings = await prisma.portfolio.findMany({
      where: { userId, quantity: { gt: 0 } },
    });

    // Calculate metrics
    const totalInvested = holdings.reduce(
      (sum, h) => sum.add(new Decimal(h.totalInvested.toString())),
      new Decimal(0)
    );

    const currentValue = holdings.reduce(
      (sum, h) => sum.add(new Decimal(h.currentValue.toString())),
      new Decimal(0)
    );

    const totalPnL = currentValue.sub(totalInvested);
    const totalPnLPercent = totalInvested.isZero()
      ? 0
      : totalPnL.div(totalInvested).mul(100).toNumber();

    // Update wallet with new metrics
    await prisma.wallet.update({
      where: { userId },
      data: {
        totalInvested: totalInvested.toNumber(),
        currentValue: currentValue.toNumber(),
        totalPnL: totalPnL.toNumber(),
        totalPnLPercent,
        lastUpdatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error recalculating wallet metrics:", error);
    throw error;
  }
};
