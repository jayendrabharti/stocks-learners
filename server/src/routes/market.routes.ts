import express from "express";
import axios from "axios";

const router = express.Router();

// Create axios instance for Groww API with proper headers
const GrowwClient = axios.create({
  timeout: 15000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    Referer: "https://groww.in/",
    Origin: "https://groww.in",
  },
});

// Types for API responses
interface Stock {
  isin: string;
  gsin?: string;
  companyName: string;
  companyShortName: string;
  searchId: string;
  ltp: number;
  logoUrl: string;
  nseScriptCode: string;
  bseScriptCode: string;
  type: string;
  marketCap?: number;
  volumeWeekAvg?: number;
  close: number;
  yearHigh: number;
  yearLow: number;
  volume?: number;
  tag?: string;
  tagColor?: string;
}

interface MostBoughtStock {
  company: {
    isin: string;
    growwContractId: string;
    companyName: string;
    searchId: string;
    nseScriptCode: string;
    companyShortName: string;
    bseScriptCode: string;
    imageUrl: string;
  };
  stats: {
    type: string;
    high: number;
    low: number;
    close: number;
    ltp: number;
    dayChange: number;
    dayChangePerc: number;
    lowPriceRange: number;
    highPriceRange: number;
  };
}

interface TopMoversResponse {
  data: {
    title: string;
    stocks: Stock[];
  };
}

interface MostBoughtResponse {
  exploreCompanies: {
    POPULAR_STOCKS_MOST_BOUGHT: MostBoughtStock[];
  };
}

interface MarketTimingResponse {
  dateMarketTimeMap: {
    [date: string]: {
      marketOpenTime: string;
      marketCloseTime: string;
      preOpenStartTime: string;
      preOpenEndTime: string;
    };
  };
}

// GET /market/top-gainers
router.get("/top-gainers", async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize as string) || 4;

    const response = await GrowwClient.get<TopMoversResponse>(
      `https://groww.in/bff/web/stocks/web-pages/top_movers?indice=GIDXNIFTY100&moverType=TOP_GAINERS&pageSize=${pageSize}`
    );

    res.json({
      success: true,
      data: response.data.data.stocks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching top gainers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch top gainers",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /market/top-losers
router.get("/top-losers", async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize as string) || 4;

    const response = await GrowwClient.get<TopMoversResponse>(
      `https://groww.in/bff/web/stocks/web-pages/top_movers?indice=GIDXNIFTY100&moverType=TOP_LOSERS&pageSize=${pageSize}`
    );

    res.json({
      success: true,
      data: response.data.data.stocks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching top losers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch top losers",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /market/volume-shockers
router.get("/volume-shockers", async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize as string) || 6;

    const response = await GrowwClient.get<TopMoversResponse>(
      `https://groww.in/bff/web/stocks/web-pages/top_movers?moverType=VOLUME_SHOCKERS&pageSize=${pageSize}`
    );

    res.json({
      success: true,
      data: response.data.data.stocks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching volume shockers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch volume shockers",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /market/most-bought
router.get("/most-bought", async (req, res) => {
  try {
    const size = parseInt(req.query.size as string) || 4;

    const response = await GrowwClient.get<MostBoughtResponse>(
      `https://groww.in/v1/api/stocks_data/v2/explore/list/top?discoveryFilterTypes=POPULAR_STOCKS_MOST_BOUGHT&page=0&size=${size}`
    );

    res.json({
      success: true,
      data: response.data.exploreCompanies.POPULAR_STOCKS_MOST_BOUGHT,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching most bought stocks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch most bought stocks",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /market/timing
router.get("/timing", async (_req, res) => {
  try {
    const response = await GrowwClient.get<MarketTimingResponse>(
      `https://groww.in/v1/api/stocks_data/v1/market/market_timing`
    );

    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching market timing:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch market timing",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /market/indices (bonus - for market indices data)
router.get("/indices", async (_req, res) => {
  try {
    // This endpoint might need to be adjusted based on available Groww APIs
    const indices = [
      { symbol: "NIFTY 50", searchId: "nifty-50" },
      { symbol: "SENSEX", searchId: "sensex" },
      { symbol: "BANKNIFTY", searchId: "bank-nifty" },
    ];

    // For now, return mock data - you can implement real API calls for indices
    const mockIndicesData = indices.map((index) => ({
      symbol: index.symbol,
      price: Math.random() * 50000 + 15000,
      change: (Math.random() - 0.5) * 500,
      changePercent: (Math.random() - 0.5) * 2,
    }));

    res.json({
      success: true,
      data: mockIndicesData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching indices:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch indices",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /market/all - Get all market data in one call
router.get("/all", async (req, res) => {
  try {
    const gainersPageSize = parseInt(req.query.gainersPageSize as string) || 4;
    const losersPageSize = parseInt(req.query.losersPageSize as string) || 4;
    const volumePageSize = parseInt(req.query.volumePageSize as string) || 6;
    const mostBoughtSize = parseInt(req.query.mostBoughtSize as string) || 4;

    const [gainersRes, losersRes, volumeRes, mostBoughtRes, timingRes] =
      await Promise.allSettled([
        GrowwClient.get<TopMoversResponse>(
          `https://groww.in/bff/web/stocks/web-pages/top_movers?indice=GIDXNIFTY100&moverType=TOP_GAINERS&pageSize=${gainersPageSize}`
        ),
        GrowwClient.get<TopMoversResponse>(
          `https://groww.in/bff/web/stocks/web-pages/top_movers?indice=GIDXNIFTY100&moverType=TOP_LOSERS&pageSize=${losersPageSize}`
        ),
        GrowwClient.get<TopMoversResponse>(
          `https://groww.in/bff/web/stocks/web-pages/top_movers?moverType=VOLUME_SHOCKERS&pageSize=${volumePageSize}`
        ),
        GrowwClient.get<MostBoughtResponse>(
          `https://groww.in/v1/api/stocks_data/v2/explore/list/top?discoveryFilterTypes=POPULAR_STOCKS_MOST_BOUGHT&page=0&size=${mostBoughtSize}`
        ),
        GrowwClient.get<MarketTimingResponse>(
          `https://groww.in/v1/api/stocks_data/v1/market/market_timing`
        ),
      ]);

    res.json({
      success: true,
      data: {
        topGainers:
          gainersRes.status === "fulfilled"
            ? gainersRes.value.data.data.stocks
            : [],
        topLosers:
          losersRes.status === "fulfilled"
            ? losersRes.value.data.data.stocks
            : [],
        volumeShockers:
          volumeRes.status === "fulfilled"
            ? volumeRes.value.data.data.stocks
            : [],
        mostBought:
          mostBoughtRes.status === "fulfilled"
            ? mostBoughtRes.value.data.exploreCompanies
                .POPULAR_STOCKS_MOST_BOUGHT
            : [],
        marketTiming:
          timingRes.status === "fulfilled" ? timingRes.value.data : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching all market data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch market data",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
