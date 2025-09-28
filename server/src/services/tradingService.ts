import prisma from "../prisma/client.js";
import { TransactionType, TransactionStatus, OrderType } from "@prisma/client";
import { WalletService } from "./walletService.js";
import { MarketDataService } from "./marketDataService.js";
import { getErrorMessage } from "../utils/utils.js";
import {
  BuyStockRequest,
  SellStockRequest,
  TransactionData,
  TradingServiceResponse,
  PortfolioHolding,
  PaginatedResponse,
  TransactionFilters,
  PortfolioFilters,
  TradingValidation,
} from "../types/trading.js";

export class TradingService {
  private static instance: TradingService;
  private walletService: WalletService;
  private marketDataService: MarketDataService;

  private constructor() {
    this.walletService = WalletService.getInstance();
    this.marketDataService = MarketDataService.getInstance();
  }

  public static getInstance(): TradingService {
    if (!TradingService.instance) {
      TradingService.instance = new TradingService();
    }
    return TradingService.instance;
  }

  /**
   * Execute buy order for a stock
   */
  public async buyStock(
    userId: string,
    request: BuyStockRequest
  ): Promise<TradingServiceResponse<TransactionData>> {
    try {
      console.log(`🛒 Processing buy order for user ${userId}:`, request);

      // Validate the trade
      const validation = await this.validateTrade(
        userId,
        request.stockSymbol,
        request.exchange,
        "BUY",
        request.quantity,
        request.price
      );
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: validation.errors.join(", "),
          },
        };
      }

      // Get current market price for market orders
      let executionPrice = request.price;
      if (request.orderType === OrderType.MARKET || !executionPrice) {
        const livePrice = await this.marketDataService.getLivePrice(
          request.stockSymbol,
          request.exchange
        );
        if (!livePrice) {
          return {
            success: false,
            error: {
              code: "PRICE_NOT_AVAILABLE",
              message: "Unable to get current market price",
            },
          };
        }
        executionPrice = livePrice.ltp;
      }

      const totalAmount = executionPrice * request.quantity;
      const brokerage = this.calculateBrokerage(totalAmount, "BUY");
      const taxes = this.calculateTaxes(totalAmount, "BUY");
      const totalCharges = brokerage + taxes;
      const netAmount = totalAmount + totalCharges;

      // Check funds availability
      const hasFunds = await this.walletService.hasSufficientFunds(
        userId,
        netAmount
      );
      if (!hasFunds) {
        return {
          success: false,
          error: {
            code: "INSUFFICIENT_FUNDS",
            message: "Insufficient virtual cash balance",
          },
        };
      }

      // Execute transaction in database transaction
      const result = await prisma.$transaction(async (tx) => {
        // Deduct cash from wallet
        await this.walletService.updateCashBalance(
          userId,
          netAmount,
          "SUBTRACT"
        );

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            userId,
            stockSymbol: request.stockSymbol,
            stockName: request.stockName,
            exchange: request.exchange,
            isin: request.isin ?? null,
            type: TransactionType.BUY,
            quantity: request.quantity,
            price: executionPrice,
            totalAmount,
            brokerage,
            taxes,
            totalCharges,
            netAmount,
            balanceAfter: 0, // Will be updated
            status: TransactionStatus.COMPLETED,
            executedAt: new Date(),
          },
        });

        // Update or create portfolio holding
        await this.updatePortfolioHolding(tx, userId, {
          stockSymbol: request.stockSymbol,
          stockName: request.stockName,
          exchange: request.exchange,
          isin: request.isin ?? undefined,
          quantity: request.quantity,
          price: executionPrice,
          type: "BUY",
        });

        return transaction;
      });

      // Update portfolio prices
      await this.marketDataService.updatePortfolioPrices(userId);

      console.log(
        `✅ Buy order executed successfully: ${request.quantity} shares of ${request.stockSymbol} at ₹${executionPrice}`
      );

      return {
        success: true,
        data: this.formatTransactionData(result),
        message: `Successfully bought ${request.quantity} shares of ${request.stockSymbol}`,
      };
    } catch (error) {
      console.error("❌ Error executing buy order:", getErrorMessage(error));
      return {
        success: false,
        error: {
          code: "BUY_ORDER_ERROR",
          message: "Failed to execute buy order",
          details: getErrorMessage(error),
        },
      };
    }
  }

  /**
   * Execute sell order for a stock
   */
  public async sellStock(
    userId: string,
    request: SellStockRequest
  ): Promise<TradingServiceResponse<TransactionData>> {
    try {
      console.log(`🔥 Processing sell order for user ${userId}:`, request);

      // Check if user owns the stock
      const holding = await prisma.portfolio.findUnique({
        where: {
          userId_stockSymbol_exchange: {
            userId,
            stockSymbol: request.stockSymbol,
            exchange: request.exchange,
          },
        },
      });

      if (!holding || holding.quantity < request.quantity) {
        return {
          success: false,
          error: {
            code: "INSUFFICIENT_HOLDINGS",
            message: "Insufficient stock holdings to sell",
          },
        };
      }

      // Validate the trade
      const validation = await this.validateTrade(
        userId,
        request.stockSymbol,
        request.exchange,
        "SELL",
        request.quantity,
        request.price
      );
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: validation.errors.join(", "),
          },
        };
      }

      // Get current market price for market orders
      let executionPrice = request.price;
      if (request.orderType === OrderType.MARKET || !executionPrice) {
        const livePrice = await this.marketDataService.getLivePrice(
          request.stockSymbol,
          request.exchange
        );
        if (!livePrice) {
          return {
            success: false,
            error: {
              code: "PRICE_NOT_AVAILABLE",
              message: "Unable to get current market price",
            },
          };
        }
        executionPrice = livePrice.ltp;
      }

      const totalAmount = executionPrice * request.quantity;
      const brokerage = this.calculateBrokerage(totalAmount, "SELL");
      const taxes = this.calculateTaxes(totalAmount, "SELL");
      const totalCharges = brokerage + taxes;
      const netAmount = totalAmount - totalCharges;

      // Execute transaction in database transaction
      const result = await prisma.$transaction(async (tx) => {
        // Add cash to wallet
        await this.walletService.updateCashBalance(userId, netAmount, "ADD");

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            userId,
            stockSymbol: request.stockSymbol,
            stockName: holding.stockName,
            exchange: request.exchange,
            isin: holding.isin ?? null,
            type: TransactionType.SELL,
            quantity: request.quantity,
            price: executionPrice,
            totalAmount,
            brokerage,
            taxes,
            totalCharges,
            netAmount,
            balanceAfter: 0, // Will be updated
            status: TransactionStatus.COMPLETED,
            executedAt: new Date(),
          },
        });

        // Update portfolio holding
        await this.updatePortfolioHolding(tx, userId, {
          stockSymbol: request.stockSymbol,
          stockName: holding.stockName,
          exchange: request.exchange,
          isin: holding.isin ?? undefined,
          quantity: request.quantity,
          price: executionPrice,
          type: "SELL",
        });

        return transaction;
      });

      // Update portfolio prices
      await this.marketDataService.updatePortfolioPrices(userId);

      console.log(
        `✅ Sell order executed successfully: ${request.quantity} shares of ${request.stockSymbol} at ₹${executionPrice}`
      );

      return {
        success: true,
        data: this.formatTransactionData(result),
        message: `Successfully sold ${request.quantity} shares of ${request.stockSymbol}`,
      };
    } catch (error) {
      console.error("❌ Error executing sell order:", getErrorMessage(error));
      return {
        success: false,
        error: {
          code: "SELL_ORDER_ERROR",
          message: "Failed to execute sell order",
          details: getErrorMessage(error),
        },
      };
    }
  }

  /**
   * Get user's portfolio holdings
   */
  public async getPortfolio(
    userId: string,
    filters?: PortfolioFilters
  ): Promise<TradingServiceResponse<PaginatedResponse<PortfolioHolding>>> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { userId };

      if (filters?.exchange) {
        where.exchange = filters.exchange;
      }

      if (filters?.profitableOnly) {
        where.unrealizedPnL = { gt: 0 };
      }

      if (filters?.lossOnly) {
        where.unrealizedPnL = { lt: 0 };
      }

      const [holdings, total] = await Promise.all([
        prisma.portfolio.findMany({
          where,
          skip,
          take: limit,
          orderBy: filters?.sortBy
            ? {
                [filters.sortBy]: filters.sortOrder || "desc",
              }
            : { updatedAt: "desc" },
        }),
        prisma.portfolio.count({ where }),
      ]);

      const formattedHoldings = holdings.map(this.formatPortfolioHolding);

      return {
        success: true,
        data: {
          data: formattedHoldings,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
      };
    } catch (error) {
      console.error("❌ Error getting portfolio:", getErrorMessage(error));
      return {
        success: false,
        error: {
          code: "PORTFOLIO_GET_ERROR",
          message: "Failed to get portfolio",
          details: getErrorMessage(error),
        },
      };
    }
  }

  /**
   * Get user's transaction history
   */
  public async getTransactions(
    userId: string,
    filters?: TransactionFilters
  ): Promise<TradingServiceResponse<PaginatedResponse<TransactionData>>> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { userId };

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.stockSymbol) {
        where.stockSymbol = {
          contains: filters.stockSymbol,
          mode: "insensitive",
        };
      }

      if (filters?.exchange) {
        where.exchange = filters.exchange;
      }

      if (filters?.dateFrom || filters?.dateTo) {
        where.executedAt = {};
        if (filters.dateFrom) {
          where.executedAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.executedAt.lte = filters.dateTo;
        }
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { executedAt: "desc" },
        }),
        prisma.transaction.count({ where }),
      ]);

      const formattedTransactions = transactions.map(
        this.formatTransactionData
      );

      return {
        success: true,
        data: {
          data: formattedTransactions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
      };
    } catch (error) {
      console.error("❌ Error getting transactions:", getErrorMessage(error));
      return {
        success: false,
        error: {
          code: "TRANSACTIONS_GET_ERROR",
          message: "Failed to get transactions",
          details: getErrorMessage(error),
        },
      };
    }
  }

  // ========================
  // Private Helper Methods
  // ========================

  private async validateTrade(
    _userId: string,
    _stockSymbol: string,
    exchange: string,
    _type: "BUY" | "SELL",
    quantity: number,
    price?: number
  ): Promise<TradingValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validations
    if (quantity <= 0) {
      errors.push("Quantity must be greater than 0");
    }

    if (price !== undefined && price <= 0) {
      errors.push("Price must be greater than 0");
    }

    // Check market hours
    const marketStatus = await this.marketDataService.isMarketOpen(exchange);
    if (!marketStatus.isOpen) {
      warnings.push(
        `Market is currently ${marketStatus.currentSession}. Order will be queued.`
      );
    }

    // Additional validations can be added here
    // - Check if stock is tradeable
    // - Check circuit limits
    // - Check lot size requirements

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async updatePortfolioHolding(
    tx: any,
    userId: string,
    trade: {
      stockSymbol: string;
      stockName: string;
      exchange: string;
      isin?: string | undefined;
      quantity: number;
      price: number;
      type: "BUY" | "SELL";
    }
  ): Promise<void> {
    const existing = await tx.portfolio.findUnique({
      where: {
        userId_stockSymbol_exchange: {
          userId,
          stockSymbol: trade.stockSymbol,
          exchange: trade.exchange,
        },
      },
    });

    if (trade.type === "BUY") {
      if (existing) {
        // Update existing holding
        const newQuantity = existing.quantity + trade.quantity;
        const newTotalInvested =
          Number(existing.totalInvested) + trade.price * trade.quantity;
        const newAveragePrice = newTotalInvested / newQuantity;

        await tx.portfolio.update({
          where: { id: existing.id },
          data: {
            quantity: newQuantity,
            averagePrice: newAveragePrice,
            totalInvested: newTotalInvested,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new holding
        await tx.portfolio.create({
          data: {
            userId,
            stockSymbol: trade.stockSymbol,
            stockName: trade.stockName,
            exchange: trade.exchange,
            isin: trade.isin ?? null,
            quantity: trade.quantity,
            averagePrice: trade.price,
            totalInvested: trade.price * trade.quantity,
            currentPrice: trade.price,
            currentValue: trade.price * trade.quantity,
            unrealizedPnL: 0,
            unrealizedPnLPerc: 0,
            dayChange: 0,
            dayChangePercent: 0,
          },
        });
      }
    } else if (trade.type === "SELL") {
      if (existing && existing.quantity >= trade.quantity) {
        const newQuantity = existing.quantity - trade.quantity;

        if (newQuantity === 0) {
          // Delete holding if all sold
          await tx.portfolio.delete({
            where: { id: existing.id },
          });
        } else {
          // Update quantity and recalculate metrics
          const newTotalInvested = Number(existing.averagePrice) * newQuantity;

          await tx.portfolio.update({
            where: { id: existing.id },
            data: {
              quantity: newQuantity,
              totalInvested: newTotalInvested,
              updatedAt: new Date(),
            },
          });
        }
      }
    }
  }

  private calculateBrokerage(amount: number, _type: "BUY" | "SELL"): number {
    // Simple flat brokerage - can be made more sophisticated
    const brokerageRate = 0.0005; // 0.05%
    const maxBrokerage = 20; // ₹20 max

    const brokerage = amount * brokerageRate;
    return Math.min(brokerage, maxBrokerage);
  }

  private calculateTaxes(amount: number, type: "BUY" | "SELL"): number {
    // STT + GST calculation - simplified
    const stt = type === "SELL" ? amount * 0.001 : amount * 0.0001; // 0.1% for sell, 0.01% for buy
    const gst = stt * 0.18; // 18% GST on STT

    return stt + gst;
  }

  private formatTransactionData(transaction: any): TransactionData {
    return {
      id: transaction.id,
      userId: transaction.userId,
      stockSymbol: transaction.stockSymbol,
      stockName: transaction.stockName,
      exchange: transaction.exchange,
      isin: transaction.isin,
      type: transaction.type,
      quantity: transaction.quantity,
      price: Number(transaction.price),
      totalAmount: Number(transaction.totalAmount),
      brokerage: Number(transaction.brokerage),
      taxes: Number(transaction.taxes),
      totalCharges: Number(transaction.totalCharges),
      netAmount: Number(transaction.netAmount),
      balanceAfter: Number(transaction.balanceAfter),
      status: transaction.status,
      orderType: transaction.orderType,
      executedAt: transaction.executedAt,
      tradingOrderId: transaction.tradingOrderId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  private formatPortfolioHolding(holding: any): PortfolioHolding {
    return {
      id: holding.id,
      userId: holding.userId,
      stockSymbol: holding.stockSymbol,
      stockName: holding.stockName,
      exchange: holding.exchange,
      isin: holding.isin,
      quantity: holding.quantity,
      averagePrice: Number(holding.averagePrice),
      totalInvested: Number(holding.totalInvested),
      currentPrice: Number(holding.currentPrice),
      currentValue: Number(holding.currentValue),
      unrealizedPnL: Number(holding.unrealizedPnL),
      unrealizedPnLPerc: holding.unrealizedPnLPerc,
      dayChange: Number(holding.dayChange),
      dayChangePercent: holding.dayChangePercent,
      createdAt: holding.createdAt,
      updatedAt: holding.updatedAt,
      lastPriceUpdate: holding.lastPriceUpdate,
    };
  }
}
