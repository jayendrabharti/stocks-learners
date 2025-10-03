import prisma from "../prisma/client.js";
import getGrowwAccessToken from "../groww/getGrowwAccessToken.js";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Get the closing price for a stock on a specific date at 3:30 PM IST
 *
 * @param stockSymbol - Stock symbol (e.g., "TATAMOTORS")
 * @param exchange - Exchange (NSE or BSE)
 * @param tradeDate - The date when the MIS position was opened
 * @returns Closing price at 3:30 PM or null if unavailable
 */
async function getClosingPriceAtMarketClose(
  stockSymbol: string,
  exchange: string,
  tradeDate: Date
): Promise<number | null> {
  try {
    const accessToken = await getGrowwAccessToken();
    if (!accessToken) {
      console.error(`[AutoSquareOff] Failed to get Groww access token`);
      return null;
    }

    // Set times for the specific trade date
    const tradeDateStart = new Date(tradeDate);
    tradeDateStart.setHours(9, 15, 0, 0); // Market open: 9:15 AM

    const tradeDateEnd = new Date(tradeDate);
    tradeDateEnd.setHours(15, 30, 0, 0); // Market close: 3:30 PM

    // Convert to Unix timestamps (milliseconds)
    const startTime = tradeDateStart.getTime();
    const endTime = tradeDateEnd.getTime();

    // Fetch 5-minute candles for that day
    const historicalUrl = `https://api.groww.in/v1/historical/candle/range?exchange=${encodeURIComponent(
      exchange
    )}&segment=CASH&trading_symbol=${encodeURIComponent(
      stockSymbol
    )}&start_time=${startTime}&end_time=${endTime}&interval_in_minutes=5`;

    const response = await fetch(historicalUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-API-VERSION": "1.0",
      },
    });

    if (!response.ok) {
      console.error(
        `[AutoSquareOff] Failed to fetch historical data for ${stockSymbol}: ${response.statusText}`
      );
      return null;
    }

    const data: any = await response.json();

    // The API returns candles array with [timestamp, open, high, low, close, volume]
    if (!data || !data.candles || data.candles.length === 0) {
      console.error(
        `[AutoSquareOff] No historical data available for ${stockSymbol} on ${tradeDate.toDateString()}`
      );
      return null;
    }

    // Get the last candle (closest to 3:30 PM)
    const lastCandle = data.candles[data.candles.length - 1];
    const closingPrice = parseFloat(lastCandle[4]); // Index 4 is close price

    console.log(
      `[AutoSquareOff] ${stockSymbol} closing price on ${tradeDate.toDateString()}: ₹${closingPrice}`
    );

    return closingPrice;
  } catch (error) {
    console.error(
      `[AutoSquareOff] Error fetching closing price for ${stockSymbol}:`,
      error
    );
    return null;
  }
}

/**
 * Check if a date is a market holiday (Saturday, Sunday, or known holidays)
 *
 * @param date - Date to check
 * @returns true if market is closed
 */
function isMarketHoliday(date: Date): boolean {
  const day = date.getDay();
  // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) {
    return true;
  }

  // You can add specific holiday dates here
  // For now, we'll just check weekends
  // In production, you'd want to maintain a holiday calendar

  return false;
}

/**
 * Auto square-off stale MIS positions for a specific user
 *
 * This function:
 * 1. Finds all MIS positions older than today
 * 2. Fetches the closing price at 3:30 PM on the trade date
 * 3. Creates sell transactions at those prices
 * 4. Updates wallet and removes holdings
 *
 * @param userId - User ID to process
 * @returns Array of squared-off positions with details
 */
export async function autoSquareOffStaleMIS(userId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  console.log(
    `[AutoSquareOff] Processing stale MIS positions for user ${userId}`
  );

  // Find all stale MIS positions
  const staleMISPositions = await prisma.portfolio.findMany({
    where: {
      userId,
      product: "MIS",
      tradeDate: {
        lt: startOfToday, // Before today
      },
    },
    orderBy: {
      tradeDate: "asc", // Process oldest first
    },
  });

  if (staleMISPositions.length === 0) {
    console.log(
      `[AutoSquareOff] No stale MIS positions found for user ${userId}`
    );
    return {
      success: true,
      squaredOffCount: 0,
      positions: [],
      errors: [],
    };
  }

  console.log(
    `[AutoSquareOff] Found ${staleMISPositions.length} stale MIS position(s) to square off`
  );

  const squaredOff = [];
  const errors = [];

  for (const position of staleMISPositions) {
    try {
      // Skip if it's a market holiday (shouldn't happen, but safety check)
      if (isMarketHoliday(position.tradeDate)) {
        console.log(
          `[AutoSquareOff] Skipping ${position.stockSymbol} - trade date was a holiday`
        );
        continue;
      }

      // Get closing price at 3:30 PM on the trade date
      const closingPrice = await getClosingPriceAtMarketClose(
        position.stockSymbol,
        position.exchange,
        position.tradeDate
      );

      if (!closingPrice || closingPrice <= 0) {
        console.error(
          `[AutoSquareOff] Failed to get valid closing price for ${position.stockSymbol}, skipping`
        );
        errors.push({
          stockSymbol: position.stockSymbol,
          reason: "Failed to fetch closing price",
        });
        continue;
      }

      // Calculate P&L
      const avgPrice = parseFloat(position.averagePrice.toString());
      const invested = parseFloat(position.totalInvested.toString());
      const sellValue = closingPrice * position.quantity;
      const pnl = sellValue - invested;
      const pnlPercent = (pnl / invested) * 100;

      // Calculate the exact square-off time (3:30 PM on trade date)
      const squareOffTime = new Date(position.tradeDate);
      squareOffTime.setHours(15, 30, 0, 0);

      // Get user's wallet before transaction
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Calculate new balance (release margin + P&L)
      const marginUsed = invested * 0.25; // 25% margin for MIS
      const newBalance = new Decimal(wallet.virtualCash.toString())
        .plus(invested) // Return full invested amount
        .plus(pnl); // Add/subtract P&L

      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // 1. Create sell transaction
        await tx.transaction.create({
          data: {
            userId,
            stockSymbol: position.stockSymbol,
            stockName: position.stockName,
            exchange: position.exchange,
            isin: position.isin,
            product: "MIS",
            type: "SELL",
            quantity: position.quantity,
            price: new Decimal(closingPrice),
            totalAmount: new Decimal(sellValue),
            netAmount: new Decimal(sellValue),
            balanceAfter: newBalance,
            status: "COMPLETED",

            // Auto square-off tracking
            isAutoSquareOff: true,
            autoSquareOffTime: squareOffTime, // When it should have been squared (3:30 PM)
            actualExecutionTime: new Date(), // When it actually executed (now)
            executedAt: squareOffTime, // Use square-off time for records
          },
        });

        // 2. Update wallet
        await tx.wallet.update({
          where: { userId },
          data: {
            virtualCash: newBalance,
            // Update MIS metrics
            misMarginUsed: {
              decrement: new Decimal(marginUsed),
            },
            misPositionsValue: {
              decrement: new Decimal(invested),
            },
            misPnL: {
              increment: new Decimal(pnl),
            },
          },
        });

        // 3. Delete portfolio holding
        await tx.portfolio.delete({
          where: { id: position.id },
        });
      });

      console.log(
        `[AutoSquareOff] ✅ Squared off ${position.stockSymbol}: ${
          position.quantity
        } @ ₹${closingPrice} (P&L: ₹${pnl.toFixed(2)})`
      );

      squaredOff.push({
        stockSymbol: position.stockSymbol,
        stockName: position.stockName,
        exchange: position.exchange,
        quantity: position.quantity,
        buyPrice: avgPrice,
        sellPrice: closingPrice,
        invested,
        sellValue,
        pnl,
        pnlPercent,
        tradeDate: position.tradeDate,
        squareOffTime,
        actualExecutionTime: new Date(),
      });

      // Small delay between API calls to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(
        `[AutoSquareOff] Error processing ${position.stockSymbol}:`,
        error
      );
      errors.push({
        stockSymbol: position.stockSymbol,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  console.log(
    `[AutoSquareOff] Completed: ${squaredOff.length} squared off, ${errors.length} errors`
  );

  return {
    success: true,
    squaredOffCount: squaredOff.length,
    positions: squaredOff,
    errors,
  };
}

/**
 * Check if user has stale MIS positions without processing them
 * Lightweight check for frontend to know if square-off is needed
 *
 * @param userId - User ID to check
 * @returns true if user has stale MIS positions
 */
export async function hasStaleMISPositions(userId: string): Promise<boolean> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const count = await prisma.portfolio.count({
    where: {
      userId,
      product: "MIS",
      tradeDate: {
        lt: startOfToday,
      },
    },
  });

  return count > 0;
}
