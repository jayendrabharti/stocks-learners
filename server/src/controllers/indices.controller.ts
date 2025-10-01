import { Request, Response } from "express";
import axios from "axios";

// Types based on the API response
interface IndexHeader {
  searchId: string;
  growwCompanyId: string;
  isin: string;
  displayName: string;
  shortName: string;
  type: string;
  isFnoEnabled: boolean;
  nseScriptCode?: string;
  bseScriptCode?: string;
  isBseTradable: boolean;
  isNseTradable: boolean;
  logoUrl: string;
  floatingShares?: number;
  isBseFnoEnabled: boolean;
  isNseFnoEnabled: boolean;
}

interface IndexData {
  header: IndexHeader;
  yearLowPrice?: number;
  yearHighPrice?: number;
}

interface IndicesResponse {
  allAssets: IndexData[];
}

// Get all indices with search term
export const getIndices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const searchTerm = (req.query.search as string) || "nifty";
    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 25;

    console.log(
      "Fetching indices with searchTerm:",
      searchTerm,
      "page:",
      page,
      "size:",
      size
    );

    const response = await axios.get<IndicesResponse>(
      `https://groww.in/v1/api/stocks_data/v1/company/search_id/${searchTerm}`,
      {
        params: {
          fields: "ALL_ASSETS",
          page,
          size,
        },
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
      }
    );

    console.log(
      "Received indices count:",
      response.data.allAssets?.length || 0
    );

    res.json({
      success: true,
      data: response.data.allAssets || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching indices:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch indices data",
      message: error.message,
    });
  }
};

// Get major indices (predefined list)
export const getMajorIndices = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch a broader search that includes multiple indices
    const searchTerms = ["nifty", "sensex", "bank"];
    const allIndices: IndexData[] = [];
    const seenIds = new Set<string>();

    for (const term of searchTerms) {
      try {
        console.log(`Fetching indices with term: ${term}`);
        const response = await axios.get<IndicesResponse>(
          `https://groww.in/v1/api/stocks_data/v1/company/search_id/${term}`,
          {
            params: { fields: "ALL_ASSETS", page: 0, size: 20 },
            headers: {
              "User-Agent": "Mozilla/5.0",
              Accept: "application/json",
            },
          }
        );

        const indices = response.data.allAssets || [];
        console.log(`✓ ${term} returned ${indices.length} indices`);

        // Add unique indices
        indices.forEach((index) => {
          if (index?.header?.searchId && !seenIds.has(index.header.searchId)) {
            seenIds.add(index.header.searchId);
            allIndices.push(index);
            console.log(
              `  - Added: ${index.header.searchId} (${index.header.displayName})`
            );
          }
        });
      } catch (error: any) {
        console.error(`Error fetching ${term}:`, error.message);
      }
    }

    // Define the major indices we want to display
    const majorIndicesIds = [
      "nifty",
      "nifty-bank",
      "nifty-financial-services",
      "sp-bse-sensex",
      "nifty-midcap-select",
      "sp-bse-bankex",
    ];

    // Filter for major indices
    const majorIndices = allIndices.filter((index) =>
      majorIndicesIds.includes(index.header.searchId.toLowerCase())
    );

    console.log("Total unique indices fetched:", allIndices.length);
    console.log("Major indices filtered:", majorIndices.length);
    console.log(
      "Major indices:",
      majorIndices.map((i) => i.header.searchId).join(", ")
    );

    res.json({
      success: true,
      data: majorIndices.length > 0 ? majorIndices : allIndices.slice(0, 6),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching major indices:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch major indices",
      message: error.message,
    });
  }
};

// Get single index details
export const getIndexDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { searchId } = req.params;

    const response = await axios.get<IndicesResponse>(
      `https://groww.in/v1/api/stocks_data/v1/company/search_id/${searchId}`,
      {
        params: { fields: "ALL_ASSETS", page: 0, size: 1 },
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
      }
    );

    if (!response.data.allAssets || response.data.allAssets.length === 0) {
      res.status(404).json({
        success: false,
        error: "Index not found",
      });
      return;
    }

    res.json({
      success: true,
      data: response.data.allAssets[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching index details:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch index details",
      message: error.message,
    });
  }
};
