import { Instrument } from "../types/instruments.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class InstrumentsService {
  private static instance: InstrumentsService;
  private instruments: Instrument[] = [];
  private lastFetchTime: Date | null = null;
  private readonly CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
  private readonly CSV_URL =
    "https://growwapi-assets.groww.in/instruments/instrument.csv";
  private readonly CACHE_FILE_PATH = path.join(
    __dirname,
    "..",
    "cache",
    "instruments.json"
  );
  private isLoading = false;

  private constructor() {}

  public static getInstance(): InstrumentsService {
    if (!InstrumentsService.instance) {
      InstrumentsService.instance = new InstrumentsService();
    }
    return InstrumentsService.instance;
  }

  /**
   * Get instruments with caching logic
   */
  public async getInstruments(): Promise<Instrument[]> {
    const now = new Date();

    // Check if we need to refresh the cache
    const needsRefresh =
      !this.lastFetchTime ||
      now.getTime() - this.lastFetchTime.getTime() > this.CACHE_DURATION_MS;

    if (needsRefresh && !this.isLoading) {
      await this.refreshInstruments();
    } else if (this.instruments.length === 0 && !this.isLoading) {
      // Load from cache file if instruments not in memory
      await this.loadFromCache();
    }

    return this.instruments;
  }

  /**
   * Refresh instruments from CSV URL
   */
  private async refreshInstruments(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    console.log("🔄 Fetching instruments from CSV...");

    try {
      const response = await fetch(this.CSV_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvText = await response.text();
      this.instruments = this.parseCSV(csvText);
      this.lastFetchTime = new Date();

      // Cache to file
      await this.saveToCache();

      console.log(`✅ Loaded ${this.instruments.length} instruments from CSV`);
    } catch (error) {
      console.error("❌ Failed to fetch instruments:", error);

      // Try to load from cache as fallback
      if (this.instruments.length === 0) {
        await this.loadFromCache();
      }

      throw new Error(
        `Failed to fetch instruments: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Parse CSV text into Instrument objects
   */
  private parseCSV(csvText: string): Instrument[] {
    const lines = csvText.trim().split("\n");

    if (lines.length === 0) {
      throw new Error("CSV file is empty");
    }

    const headers = lines[0]?.split(",").map((h) => h.trim());

    if (!headers) {
      throw new Error("CSV headers not found");
    }

    const instruments: Instrument[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const values = this.parseCSVLine(line);

      if (values.length !== headers.length) {
        console.warn(`Skipping line ${i + 1}: Column count mismatch`);
        continue;
      }

      try {
        const instrument: Instrument = {
          id: i,
          exchange: values[0] || "",
          exchange_token: values[1] || "",
          trading_symbol: values[2] || "",
          groww_symbol: values[3] || "",
          name: values[4] || "",
          instrument_type: values[5] || "",
          segment: values[6] || "",
          series: values[7] || "",
          isin: values[8] || "",
          underlying_symbol: values[9] || "",
          underlying_exchange_token: values[10] || "",
          expiry_date: values[11] || "",
          strike_price: this.parseNumber(values[12] || "0"),
          lot_size: this.parseNumber(values[13] || "0"),
          tick_size: this.parseNumber(values[14] || "0"),
          freeze_quantity: this.parseNumber(values[15] || "0"),
          is_reserved: this.parseBoolean(values[16] || "0"),
          buy_allowed: this.parseBoolean(values[17] || "0"),
          sell_allowed: this.parseBoolean(values[18] || "0"),
        };

        instruments.push(instrument);
      } catch (error) {
        console.warn(`Error parsing line ${i + 1}:`, error);
      }
    }

    return instruments;
  }

  /**
   * Parse a CSV line handling quoted values and commas within quotes
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Parse number values handling empty strings and NaN
   */
  private parseNumber(value: string): number {
    if (!value || value === "NaN" || value.toLowerCase() === "null") {
      return 0;
    }
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Parse boolean values
   */
  private parseBoolean(value: string): boolean {
    return value === "1" || value.toLowerCase() === "true";
  }

  /**
   * Save instruments to cache file
   */
  private async saveToCache(): Promise<void> {
    try {
      const cacheDir = path.dirname(this.CACHE_FILE_PATH);
      await fs.mkdir(cacheDir, { recursive: true });

      const cacheData = {
        instruments: this.instruments,
        lastFetchTime: this.lastFetchTime,
      };

      await fs.writeFile(
        this.CACHE_FILE_PATH,
        JSON.stringify(cacheData, null, 2)
      );
      console.log("💾 Instruments cached to file");
    } catch (error) {
      console.warn("⚠️ Failed to save cache:", error);
    }
  }

  /**
   * Load instruments from cache file
   */
  private async loadFromCache(): Promise<void> {
    try {
      const cacheData = await fs.readFile(this.CACHE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(cacheData);

      this.instruments = parsed.instruments || [];
      this.lastFetchTime = parsed.lastFetchTime
        ? new Date(parsed.lastFetchTime)
        : null;

      console.log(
        `📁 Loaded ${this.instruments.length} instruments from cache`
      );
    } catch (error) {
      console.log("💿 No cache file found, will fetch fresh data");
    }
  }

  /**
   * Force refresh of instruments data
   */
  public async forceRefresh(): Promise<void> {
    this.lastFetchTime = null;
    await this.refreshInstruments();
  }

  /**
   * Get cache statistics
   */
  public getCacheInfo(): {
    count: number;
    lastFetch: Date | null;
    cacheAge: number | null;
  } {
    const cacheAge = this.lastFetchTime
      ? (Date.now() - this.lastFetchTime.getTime()) / 1000 / 60
      : null; // minutes

    return {
      count: this.instruments.length,
      lastFetch: this.lastFetchTime,
      cacheAge,
    };
  }
}
