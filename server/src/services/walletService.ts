import prisma from "../prisma/client.js";
import { Currency } from "@prisma/client";
import { getErrorMessage } from "../utils/utils.js";
import {
  WalletData,
  TradingServiceResponse,
  PortfolioSummary,
} from "../types/trading.js";

export class WalletService {
  private static instance: WalletService;

  private constructor() {}

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Create wallet for new user with default balance
   */
  public async createWallet(
    userId: string,
    initialBalance: number = 1000000.0,
    currency: Currency = Currency.INR
  ): Promise<TradingServiceResponse<WalletData>> {
    try {
      console.log(`📊 Creating wallet for user: ${userId}`);

      // Check if wallet already exists
      const existingWallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (existingWallet) {
        return {
          success: false,
          error: {
            code: "WALLET_EXISTS",
            message: "Wallet already exists for this user",
          },
        };
      }

      const wallet = await prisma.wallet.create({
        data: {
          userId,
          virtualCash: initialBalance,
          currency,
        },
      });

      console.log(`✅ Wallet created successfully for user: ${userId}`);

      return {
        success: true,
        data: this.formatWalletData(wallet),
        message: "Wallet created successfully",
      };
    } catch (error) {
      console.error("❌ Error creating wallet:", getErrorMessage(error));
      return {
        success: false,
        error: {
          code: "WALLET_CREATE_ERROR",
          message: "Failed to create wallet",
          details: getErrorMessage(error),
        },
      };
    }
  }

  /**
   * Get user's wallet data
   */
  public async getWallet(
    userId: string
  ): Promise<TradingServiceResponse<WalletData>> {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return {
          success: false,
          error: {
            code: "WALLET_NOT_FOUND",
            message: "Wallet not found for this user",
          },
        };
      }

      return {
        success: true,
        data: this.formatWalletData(wallet),
      };
    } catch (error) {
      console.error("❌ Error getting wallet:", getErrorMessage(error));
      return {
        success: false,
        error: {
          code: "WALLET_GET_ERROR",
          message: "Failed to get wallet",
          details: getErrorMessage(error),
        },
      };
    }
  }

  /**
   * Update virtual cash balance
   */
  public async updateCashBalance(
    userId: string,
    amount: number,
    operation: "ADD" | "SUBTRACT"
  ): Promise<TradingServiceResponse<WalletData>> {
    try {
      console.log(
        `💰 Updating cash balance for user ${userId}: ${operation} ${amount}`
      );

      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return {
          success: false,
          error: {
            code: "WALLET_NOT_FOUND",
            message: "Wallet not found",
          },
        };
      }

      const currentCash = Number(wallet.virtualCash);
      let newCashBalance: number;

      if (operation === "ADD") {
        newCashBalance = currentCash + amount;
      } else {
        newCashBalance = currentCash - amount;

        // Check if user has sufficient funds
        if (newCashBalance < 0) {
          return {
            success: false,
            error: {
              code: "INSUFFICIENT_FUNDS",
              message: "Insufficient virtual cash balance",
            },
          };
        }
      }

      const updatedWallet = await prisma.wallet.update({
        where: { userId },
        data: {
          virtualCash: newCashBalance,
          lastUpdatedAt: new Date(),
        },
      });

      console.log(
        `✅ Cash balance updated: ${currentCash} -> ${newCashBalance}`
      );

      return {
        success: true,
        data: this.formatWalletData(updatedWallet),
        message: `Cash balance ${
          operation === "ADD" ? "added" : "deducted"
        } successfully`,
      };
    } catch (error) {
      console.error("❌ Error updating cash balance:", getErrorMessage(error));
      return {
        success: false,
        error: {
          code: "CASH_UPDATE_ERROR",
          message: "Failed to update cash balance",
          details: getErrorMessage(error),
        },
      };
    }
  }

  /**
   * Check if user has sufficient funds
   */
  public async hasSufficientFunds(
    userId: string,
    amount: number
  ): Promise<boolean> {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        select: { virtualCash: true },
      });

      if (!wallet) {
        return false;
      }

      return Number(wallet.virtualCash) >= amount;
    } catch (error) {
      console.error(
        "❌ Error checking sufficient funds:",
        getErrorMessage(error)
      );
      return false;
    }
  }

  /**
   * Get portfolio summary
   */
  public async getPortfolioSummary(
    userId: string
  ): Promise<TradingServiceResponse<PortfolioSummary>> {
    try {
      const [wallet, holdings] = await Promise.all([
        prisma.wallet.findUnique({ where: { userId } }),
        prisma.portfolio.findMany({ where: { userId } }),
      ]);

      if (!wallet) {
        return {
          success: false,
          error: {
            code: "WALLET_NOT_FOUND",
            message: "Wallet not found",
          },
        };
      }

      // Calculate portfolio metrics
      const totalHoldings = holdings.length;
      const profitableHoldings = holdings.filter(
        (h) => Number(h.unrealizedPnL) > 0
      ).length;
      const lossHoldings = holdings.filter(
        (h) => Number(h.unrealizedPnL) < 0
      ).length;

      // Find top gainer and loser
      const topGainer = holdings
        .filter((h) => Number(h.unrealizedPnLPerc) > 0)
        .sort((a, b) => b.unrealizedPnLPerc - a.unrealizedPnLPerc)[0];

      const topLoser = holdings
        .filter((h) => Number(h.unrealizedPnLPerc) < 0)
        .sort((a, b) => a.unrealizedPnLPerc - b.unrealizedPnLPerc)[0];

      const walletData: WalletData = {
        id: wallet.id,
        userId: wallet.userId,
        virtualCash: Number(wallet.virtualCash),
        currency: wallet.currency,
        totalInvested: Number(wallet.totalInvested),
        currentValue: Number(wallet.currentValue),
        totalPnL: Number(wallet.totalPnL),
        totalPnLPercent: wallet.totalPnLPercent,
        dayPnL: Number(wallet.dayPnL),
        dayPnLPercent: wallet.dayPnLPercent,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
        lastUpdatedAt: wallet.updatedAt,
      };

      const summary: PortfolioSummary = {
        wallet: walletData,
        currentValue: Number(wallet.currentValue),
        totalInvested: Number(wallet.totalInvested),
        totalPnL: Number(wallet.totalPnL),
        totalPnLPercent: wallet.totalPnLPercent,
        dayPnL: Number(wallet.dayPnL),
        dayPnLPercent: wallet.dayPnLPercent,
        cashBalance: Number(wallet.virtualCash),
        currency: wallet.currency,
        totalHoldings,
        profitableHoldings,
        lossHoldings,
        sectorAllocation: [], // TODO: Calculate sector allocation from holdings
        exchangeBreakdown: [], // TODO: Calculate exchange breakdown from holdings
        ...(topGainer && {
          topGainer: {
            symbol: topGainer.stockSymbol,
            name: topGainer.stockName,
            pnlPercent: topGainer.unrealizedPnLPerc,
          },
        }),
        ...(topLoser && {
          topLoser: {
            symbol: topLoser.stockSymbol,
            name: topLoser.stockName,
            pnlPercent: topLoser.unrealizedPnLPerc,
          },
        }),
      };

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      console.error(
        "❌ Error getting portfolio summary:",
        getErrorMessage(error)
      );
      return {
        success: false,
        error: {
          code: "PORTFOLIO_SUMMARY_ERROR",
          message: "Failed to get portfolio summary",
          details: getErrorMessage(error),
        },
      };
    }
  }

  /**
   * Create portfolio snapshot
   */
  public async createPortfolioSnapshot(
    userId: string
  ): Promise<TradingServiceResponse<void>> {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Check if snapshot already exists for today
      const existingSnapshot = await prisma.portfolioSnapshot.findUnique({
        where: {
          userId_date: {
            userId,
            date: new Date(today + "T00:00:00.000Z"),
          },
        },
      });

      if (existingSnapshot) {
        return {
          success: true,
          message: "Portfolio snapshot already exists for today",
        };
      }

      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return {
          success: false,
          error: {
            code: "WALLET_NOT_FOUND",
            message: "Wallet not found",
          },
        };
      }

      await prisma.portfolioSnapshot.create({
        data: {
          userId,
          date: new Date(today + "T00:00:00.000Z"),
          totalValue: Number(wallet.currentValue),
          totalInvested: Number(wallet.totalInvested),
          totalPnL: Number(wallet.totalPnL),
          totalPnLPercent: wallet.totalPnLPercent,
          cashBalance: Number(wallet.virtualCash),
          dayPnL: Number(wallet.dayPnL),
          dayPnLPercent: wallet.dayPnLPercent,
        },
      });

      return {
        success: true,
        message: "Portfolio snapshot created successfully",
      };
    } catch (error) {
      console.error(
        "❌ Error creating portfolio snapshot:",
        getErrorMessage(error)
      );
      return {
        success: false,
        error: {
          code: "SNAPSHOT_CREATE_ERROR",
          message: "Failed to create portfolio snapshot",
          details: getErrorMessage(error),
        },
      };
    }
  }

  // ========================
  // Private Helper Methods
  // ========================

  private formatWalletData(wallet: any): WalletData {
    return {
      id: wallet.id,
      userId: wallet.userId,
      virtualCash: Number(wallet.virtualCash),
      currency: wallet.currency,
      totalInvested: Number(wallet.totalInvested),
      currentValue: Number(wallet.currentValue),
      totalPnL: Number(wallet.totalPnL),
      totalPnLPercent: wallet.totalPnLPercent,
      dayPnL: Number(wallet.dayPnL),
      dayPnLPercent: wallet.dayPnLPercent,
      lastUpdatedAt: wallet.lastUpdatedAt,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}
