import { Request, Response } from "express";
import { InstrumentsService } from "../services/instrumentsService.js";
import { InstrumentSearchService } from "../services/instrumentSearchService.js";
import getGrowwAccessToken from "../groww/getGrowwAccessToken.js";

// Helper functions for responses
const successResponse = (res: Response, data: any, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

const errorResponse = (res: Response, message: string, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * Search and filter instruments with pagination
 */
export const searchInstruments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Parse query parameters with proper typing
    const requestPage = req.query.page
      ? parseInt(req.query.page as string)
      : undefined;
    const requestLimit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;

    const searchParams: InstrumentSearchParams = {
      search: req.query.search as string,
      sort_by: req.query.sort_by as any,
      sort_order: req.query.sort_order as "asc" | "desc",
      filters: {},
    };

    // Add page and limit only if they exist
    if (requestPage !== undefined) {
      searchParams.page = requestPage;
    }
    if (requestLimit !== undefined) {
      searchParams.limit = requestLimit;
    }

    // Build filters object conditionally
    const filters = searchParams.filters!;

    if (req.query.exchange) {
      filters.exchange = Array.isArray(req.query.exchange)
        ? (req.query.exchange as string[])
        : [req.query.exchange as string];
    }
    if (req.query.instrument_type) {
      filters.instrument_type = Array.isArray(req.query.instrument_type)
        ? (req.query.instrument_type as string[])
        : [req.query.instrument_type as string];
    }
    if (req.query.segment) {
      filters.segment = Array.isArray(req.query.segment)
        ? (req.query.segment as string[])
        : [req.query.segment as string];
    }
    if (req.query.series) {
      filters.series = Array.isArray(req.query.series)
        ? (req.query.series as string[])
        : [req.query.series as string];
    }
    if (req.query.underlying_symbol) {
      filters.underlying_symbol = Array.isArray(req.query.underlying_symbol)
        ? (req.query.underlying_symbol as string[])
        : [req.query.underlying_symbol as string];
    }
    if (req.query.buy_allowed) {
      filters.buy_allowed = req.query.buy_allowed === "true";
    }
    if (req.query.sell_allowed) {
      filters.sell_allowed = req.query.sell_allowed === "true";
    }
    if (req.query.is_reserved) {
      filters.is_reserved = req.query.is_reserved === "true";
    }
    if (req.query.min_strike_price) {
      filters.min_strike_price = parseFloat(
        req.query.min_strike_price as string
      );
    }
    if (req.query.max_strike_price) {
      filters.max_strike_price = parseFloat(
        req.query.max_strike_price as string
      );
    }
    if (req.query.min_lot_size) {
      filters.min_lot_size = parseInt(req.query.min_lot_size as string);
    }
    if (req.query.max_lot_size) {
      filters.max_lot_size = parseInt(req.query.max_lot_size as string);
    }
    if (req.query.expiry_date_from) {
      filters.expiry_date_from = req.query.expiry_date_from as string;
    }
    if (req.query.expiry_date_to) {
      filters.expiry_date_to = req.query.expiry_date_to as string;
    }

    // Get instruments data
    const instrumentsService = InstrumentsService.getInstance();
    const instruments = await instrumentsService.getInstruments();

    if (!instruments || instruments.length === 0) {
      errorResponse(res, "No instruments data available", 404);
      return;
    }

    // Search and filter
    const searchResult = InstrumentSearchService.searchInstruments(
      instruments,
      searchParams
    );

    // Get total count and results
    const totalCount = searchResult.totalCount;
    const results = searchResult.results;

    // Apply pagination
    const currentPage = searchParams.page || 1;
    const itemsPerPage = searchParams.limit || 50;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = results.slice(startIndex, startIndex + itemsPerPage);

    successResponse(res, {
      data: paginatedData,
      pagination: {
        page: currentPage,
        limit: itemsPerPage,
        total_count: totalCount,
        has_next: currentPage < totalPages,
        has_prev: currentPage > 1,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error("Error searching instruments:", error);
    errorResponse(res, "Failed to search instruments");
  }
};

export const getInstrumentBySymbol = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      errorResponse(res, "Symbol parameter is required", 400);
      return;
    }

    // Get instruments data
    const instrumentsService = InstrumentsService.getInstance();
    const instruments = await instrumentsService.getInstruments();

    if (!instruments || instruments.length === 0) {
      errorResponse(res, "No instruments data available", 404);
      return;
    }

    // Find the instrument by symbol (using trading_symbol from Instrument interface)
    const instrument = instruments.find(
      (inst) =>
        inst.trading_symbol.toLowerCase() === symbol.toLowerCase() ||
        inst.groww_symbol.toLowerCase() === symbol.toLowerCase()
    );

    if (!instrument) {
      errorResponse(res, `Instrument with symbol '${symbol}' not found`, 404);
      return;
    }

    successResponse(res, instrument);
  } catch (error) {
    console.error("Error getting instrument by symbol:", error);
    errorResponse(res, "Failed to get instrument");
  }
};

export const getInstrumentLiveData = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { exchange = "NSE", trading_symbol } = req.query;

    if (
      !trading_symbol ||
      !exchange ||
      typeof trading_symbol !== "string" ||
      typeof exchange !== "string" ||
      (exchange !== "NSE" && exchange !== "BSE")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
      });
    }

    const access_token = await getGrowwAccessToken();

    // Fetch quote data
    const quoteUrl = `https://api.groww.in/v1/live-data/quote?exchange=${encodeURIComponent(
      exchange
    )}&segment=CASH&trading_symbol=${encodeURIComponent(trading_symbol)}`;
    const quoteResponse = await fetch(quoteUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
        "X-API-VERSION": "1.0",
      },
    });

    if (!quoteResponse.ok) {
      return res.status(quoteResponse.status).json({
        success: false,
        message: `Failed to fetch live data: ${quoteResponse.statusText}`,
      });
    }

    const quoteData = await quoteResponse.json();

    return res.status(200).json({
      success: true,
      quoteData,
    });
  } catch (error) {
    console.error("Error getting instrument live data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get instrument live data",
    });
  }
};

export const getInstrumentHistoricalData = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      exchange = "NSE",
      trading_symbol,
      start_time,
      end_time,
      interval_in_minutes = 1440, // Default to daily data
    } = req.query;

    // Validation
    if (
      !trading_symbol ||
      !exchange ||
      !start_time ||
      !end_time ||
      typeof trading_symbol !== "string" ||
      typeof exchange !== "string" ||
      typeof start_time !== "string" ||
      typeof end_time !== "string" ||
      (exchange !== "NSE" && exchange !== "BSE")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid query parameters. Required: exchange, trading_symbol, start_time, end_time",
      });
    }

    const access_token = await getGrowwAccessToken();

    // Fetch historical data
    const historicalUrl = `https://api.groww.in/v1/historical/candle/range?exchange=${encodeURIComponent(
      exchange
    )}&segment=CASH&trading_symbol=${encodeURIComponent(
      trading_symbol
    )}&start_time=${encodeURIComponent(
      start_time
    )}&end_time=${encodeURIComponent(
      end_time
    )}&interval_in_minutes=${interval_in_minutes}`;

    const historicalResponse = await fetch(historicalUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
        "X-API-VERSION": "1.0",
      },
    });

    if (!historicalResponse.ok) {
      return res.status(historicalResponse.status).json({
        success: false,
        message: `Failed to fetch historical data: ${historicalResponse.statusText}`,
      });
    }

    const historicalData = await historicalResponse.json();

    return res.status(200).json({
      success: true,
      historicalData,
    });
  } catch (error) {
    console.error("Error getting instrument historical data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get instrument historical data",
    });
  }
};
