import { Request, Response } from "express";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../prisma/client.js";
import {
  updateWalletBalance,
  recalculateWalletMetrics,
} from "./wallet.controller.js";

/**
 * Buy stocks - Place a market buy order (supports CNC and MIS)
 */
export const buyStock = async (
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

    const {
      stockSymbol,
      stockName,
      exchange,
      quantity,
      price,
      isin,
      product = "CNC", // Default to CNC (delivery)
    } = req.body;

    // Validate inputs
    if (!stockSymbol || !stockName || !exchange || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0",
      });
    }

    // Validate product type
    if (product !== "CNC" && product !== "MIS") {
      return res.status(400).json({
        success: false,
        message: "Invalid product type. Must be CNC or MIS",
      });
    }

    // Market hours validation for MIS
    if (product === "MIS") {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      const istTime = new Date(now.getTime() + istOffset);
      const hours = istTime.getUTCHours();
      const minutes = istTime.getUTCMinutes();
      const currentMinutes = hours * 60 + minutes;

      const marketStart = 9 * 60 + 15; // 9:15 AM
      const marketEnd = 15 * 60 + 30; // 3:30 PM

      // Check if it's a weekend
      const dayOfWeek = istTime.getUTCDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6

      if (isWeekend) {
        return res.status(400).json({
          success: false,
          message: "MIS (Intraday) orders can only be placed on weekdays",
        });
      }

      if (currentMinutes < marketStart || currentMinutes > marketEnd) {
        return res.status(400).json({
          success: false,
          message:
            "MIS (Intraday) orders can only be placed during market hours (9:15 AM - 3:30 PM IST)",
          currentTime: istTime.toISOString(),
        });
      }
    }

    // Calculate total amount
    const totalAmount = new Decimal(price).mul(quantity);

    // Calculate margin required based on product type
    const MIS_MARGIN_PERCENTAGE = 0.25; // 25% margin for MIS (4x leverage)
    const marginRequired =
      product === "MIS" ? totalAmount.mul(MIS_MARGIN_PERCENTAGE) : totalAmount; // CNC requires full amount

    // For now, no charges (can add later for realism)
    const brokerage = new Decimal(0);
    const taxes = new Decimal(0);
    const totalCharges = brokerage.add(taxes);
    const netAmount = marginRequired.add(totalCharges);

    // Check if user has sufficient balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const currentBalance = new Decimal(wallet.virtualCash.toString());

    if (currentBalance.lessThan(netAmount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient funds",
        required: netAmount.toString(),
        available: currentBalance.toString(),
        productType: product,
        marginInfo:
          product === "MIS"
            ? {
                totalValue: totalAmount.toString(),
                marginPercentage: "25%",
                marginRequired: marginRequired.toString(),
              }
            : undefined,
      });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct amount from wallet (margin for MIS, full amount for CNC)
      const { newBalance } = await updateWalletBalance(
        userId,
        netAmount.toNumber(),
        "DEDUCT"
      );

      // 2. Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          stockSymbol,
          stockName,
          exchange,
          isin,
          product, // CNC or MIS
          type: "BUY",
          quantity,
          price: price,
          totalAmount: totalAmount.toNumber(),
          brokerage: brokerage.toNumber(),
          taxes: taxes.toNumber(),
          totalCharges: totalCharges.toNumber(),
          netAmount: netAmount.toNumber(),
          balanceAfter: newBalance.toNumber(),
          status: "COMPLETED",
          executedAt: new Date(),
        },
      });

      // 3. Update or create portfolio holding (separate CNC and MIS positions)
      const existingHolding = await tx.portfolio.findUnique({
        where: {
          userId_stockSymbol_exchange_product: {
            userId,
            stockSymbol,
            exchange,
            product,
          },
        },
      });

      let portfolio;

      if (existingHolding) {
        // Update existing holding - calculate new average price
        const existingQuantity = existingHolding.quantity;
        const existingInvested = new Decimal(
          existingHolding.totalInvested.toString()
        );
        const newInvested = existingInvested.add(totalAmount);
        const newQuantity = existingQuantity + quantity;
        const newAveragePrice = newInvested.div(newQuantity);

        portfolio = await tx.portfolio.update({
          where: {
            userId_stockSymbol_exchange_product: {
              userId,
              stockSymbol,
              exchange,
              product,
            },
          },
          data: {
            quantity: newQuantity,
            averagePrice: newAveragePrice.toNumber(),
            totalInvested: newInvested.toNumber(),
            currentPrice: price, // Update to latest price
            currentValue: new Decimal(price).mul(newQuantity).toNumber(),
            unrealizedPnL: 0, // Will be calculated when we fetch live prices
            unrealizedPnLPerc: 0,
            tradeDate: new Date(), // Update trade date for MIS tracking
          },
        });
      } else {
        // Create new holding
        portfolio = await tx.portfolio.create({
          data: {
            userId,
            stockSymbol,
            stockName,
            exchange,
            isin,
            product, // CNC or MIS
            quantity,
            averagePrice: price,
            totalInvested: totalAmount.toNumber(),
            currentPrice: price,
            currentValue: totalAmount.toNumber(),
            unrealizedPnL: 0,
            unrealizedPnLPerc: 0,
            tradeDate: new Date(), // Important for MIS auto-square-off tracking
          },
        });
      }

      // 4. Update wallet MIS margin if product is MIS
      if (product === "MIS") {
        await tx.wallet.update({
          where: { userId },
          data: {
            misMarginUsed: {
              increment: marginRequired.toNumber(),
            },
            misPositionsValue: {
              increment: totalAmount.toNumber(),
            },
          },
        });
      }

      return { transaction, portfolio, newBalance };
    });

    // 5. Recalculate wallet metrics
    await recalculateWalletMetrics(userId);

    return res.status(200).json({
      success: true,
      message: `Stock purchased successfully (${product})`,
      data: {
        transaction: result.transaction,
        portfolio: result.portfolio,
        newBalance: result.newBalance.toString(),
        productType: product,
        marginInfo:
          product === "MIS"
            ? {
                totalValue: totalAmount.toString(),
                marginUsed: marginRequired.toString(),
                leverage: "4x",
                note: "MIS positions must be squared off by 3:30 PM IST",
              }
            : undefined,
      },
    });
  } catch (error: any) {
    console.error("Error buying stock:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to purchase stock",
    });
  }
};

/**
 * Sell stocks - Place a market sell order (supports CNC and MIS)
 */
export const sellStock = async (
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

    const {
      stockSymbol,
      stockName,
      exchange,
      quantity,
      price,
      isin,
      product = "CNC", // Default to CNC (delivery)
    } = req.body;

    // Validate inputs
    if (!stockSymbol || !stockName || !exchange || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0",
      });
    }

    // Validate product type
    if (product !== "CNC" && product !== "MIS") {
      return res.status(400).json({
        success: false,
        message: "Invalid product type. Must be CNC or MIS",
      });
    }

    // Check if user has sufficient holdings for the specific product type
    const holding = await prisma.portfolio.findUnique({
      where: {
        userId_stockSymbol_exchange_product: {
          userId,
          stockSymbol,
          exchange,
          product,
        },
      },
    });

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: `You don't have any ${product} holdings for this stock`,
        productType: product,
      });
    }

    if (holding.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient holdings",
        requested: quantity,
        available: holding.quantity,
        productType: product,
      });
    }

    // Calculate total amount
    const totalAmount = new Decimal(price).mul(quantity);

    // Calculate margin to release for MIS
    const avgPrice = new Decimal(holding.averagePrice.toString());
    const investedAmount = avgPrice.mul(quantity);
    const MIS_MARGIN_PERCENTAGE = 0.25;
    const marginToRelease =
      product === "MIS"
        ? investedAmount.mul(MIS_MARGIN_PERCENTAGE)
        : new Decimal(0);

    // For now, no charges (can add later for realism)
    const brokerage = new Decimal(0);
    const taxes = new Decimal(0);
    const totalCharges = brokerage.add(taxes);
    const netAmount = totalAmount.sub(totalCharges);

    // Calculate realized P&L
    const realizedPnL = new Decimal(price).sub(avgPrice).mul(quantity);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Add sell proceeds to wallet
      const { newBalance } = await updateWalletBalance(
        userId,
        netAmount.toNumber(),
        "ADD"
      );

      // 2. Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          stockSymbol,
          stockName,
          exchange,
          isin,
          product, // CNC or MIS
          type: "SELL",
          quantity,
          price: price,
          totalAmount: totalAmount.toNumber(),
          brokerage: brokerage.toNumber(),
          taxes: taxes.toNumber(),
          totalCharges: totalCharges.toNumber(),
          netAmount: netAmount.toNumber(),
          balanceAfter: newBalance.toNumber(),
          status: "COMPLETED",
          executedAt: new Date(),
        },
      });

      // 3. Update portfolio holding
      const newQuantity = holding.quantity - quantity;

      let portfolio;

      if (newQuantity === 0) {
        // Delete holding if quantity becomes 0
        portfolio = await tx.portfolio.delete({
          where: {
            userId_stockSymbol_exchange_product: {
              userId,
              stockSymbol,
              exchange,
              product,
            },
          },
        });
      } else {
        // Update holding - reduce quantity, keep average price same
        const newInvested = avgPrice.mul(newQuantity);

        portfolio = await tx.portfolio.update({
          where: {
            userId_stockSymbol_exchange_product: {
              userId,
              stockSymbol,
              exchange,
              product,
            },
          },
          data: {
            quantity: newQuantity,
            totalInvested: newInvested.toNumber(),
            currentPrice: price, // Update to latest price
            currentValue: new Decimal(price).mul(newQuantity).toNumber(),
            unrealizedPnL: new Decimal(price)
              .sub(avgPrice)
              .mul(newQuantity)
              .toNumber(),
            unrealizedPnLPerc: avgPrice.isZero()
              ? 0
              : new Decimal(price)
                  .sub(avgPrice)
                  .div(avgPrice)
                  .mul(100)
                  .toNumber(),
          },
        });
      }

      // 4. Release MIS margin if product is MIS
      if (product === "MIS") {
        await tx.wallet.update({
          where: { userId },
          data: {
            misMarginUsed: {
              decrement: marginToRelease.toNumber(),
            },
            misPositionsValue: {
              decrement: investedAmount.toNumber(),
            },
            misPnL: {
              increment: realizedPnL.toNumber(), // Add realized P&L
            },
          },
        });
      }

      return {
        transaction,
        portfolio,
        newBalance,
        realizedPnL: realizedPnL.toNumber(),
      };
    });

    // 5. Recalculate wallet metrics
    await recalculateWalletMetrics(userId);

    return res.status(200).json({
      success: true,
      message: `Stock sold successfully (${product})`,
      data: {
        transaction: result.transaction,
        portfolio: result.portfolio,
        newBalance: result.newBalance.toString(),
        realizedPnL: result.realizedPnL.toString(),
        productType: product,
      },
    });
  } catch (error: any) {
    console.error("Error selling stock:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to sell stock",
    });
  }
};

/**
 * Get user's transaction history
 */
export const getTransactionHistory = async (
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

    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string; // 'BUY' or 'SELL'
    const stockSymbol = req.query.stockSymbol as string;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };
    if (type && (type === "BUY" || type === "SELL")) {
      where.type = type;
    }
    if (stockSymbol) {
      where.stockSymbol = stockSymbol;
    }

    // Get transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { executedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction history",
    });
  }
};

/**
 * Get user's portfolio holdings
 */
export const getPortfolio = async (
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

    // Get all holdings
    const holdings = await prisma.portfolio.findMany({
      where: { userId, quantity: { gt: 0 } },
      orderBy: { currentValue: "desc" },
    });

    // Group holdings by product type
    const cncHoldings = holdings.filter((h) => h.product === "CNC");
    const misHoldings = holdings.filter((h) => h.product === "MIS");

    // Get wallet for summary
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    // Check if there are stale MIS positions (from previous days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const staleMISPositions = misHoldings.filter((holding) => {
      const tradeDate = new Date(holding.tradeDate);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate.getTime() < today.getTime();
    });

    return res.status(200).json({
      success: true,
      data: {
        holdings: {
          all: holdings,
          cnc: cncHoldings, // Delivery holdings
          mis: misHoldings, // Intraday positions
        },
        summary: wallet
          ? {
              virtualCash: wallet.virtualCash.toString(),
              // CNC (Delivery) metrics
              totalInvested: wallet.totalInvested.toString(),
              currentValue: wallet.currentValue.toString(),
              totalPnL: wallet.totalPnL.toString(),
              totalPnLPercent: wallet.totalPnLPercent,
              // MIS (Intraday) metrics
              misMarginUsed: wallet.misMarginUsed.toString(),
              misPositionsValue: wallet.misPositionsValue.toString(),
              misPnL: wallet.misPnL.toString(),
              // Available balances
              availableForCNC: wallet.virtualCash.toString(),
              availableForMIS: new Decimal(wallet.virtualCash.toString())
                .mul(4) // 4x leverage for MIS
                .toString(),
            }
          : null,
        warnings: {
          staleMISPositions:
            staleMISPositions.length > 0
              ? {
                  count: staleMISPositions.length,
                  message:
                    "You have MIS positions from previous trading day(s). These should have been squared off.",
                  positions: staleMISPositions.map((p) => ({
                    stockSymbol: p.stockSymbol,
                    quantity: p.quantity,
                    tradeDate: p.tradeDate,
                  })),
                }
              : null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio",
    });
  }
};
