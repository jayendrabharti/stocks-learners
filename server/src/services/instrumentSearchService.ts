import {
  Instrument,
  InstrumentFilters,
  InstrumentSearchParams,
} from "../types/instruments.js";

export class InstrumentSearchService {
  /**
   * Search and filter instruments based on criteria
   */
  public static searchInstruments(
    instruments: Instrument[],
    params: InstrumentSearchParams
  ): { results: Instrument[]; totalCount: number } {
    let results = [...instruments];

    // Apply text search
    if (params.search) {
      results = this.applyTextSearch(results, params.search);
    }

    // Apply filters
    if (params.filters) {
      results = this.applyFilters(results, params.filters);
    }

    const totalCount = results.length;

    // Apply sorting
    if (params.sort_by) {
      results = this.applySorting(
        results,
        params.sort_by,
        params.sort_order || "asc"
      );
    }

    return { results, totalCount };
  }

  /**
   * Apply text search across multiple fields
   */
  private static applyTextSearch(
    instruments: Instrument[],
    searchTerm: string
  ): Instrument[] {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return instruments;

    return instruments.filter((instrument) => {
      const searchableFields = [
        instrument.trading_symbol,
        instrument.groww_symbol,
        instrument.name,
        instrument.exchange,
        instrument.underlying_symbol,
        instrument.instrument_type,
        instrument.isin,
      ];

      return searchableFields.some(
        (field) => field && field.toLowerCase().includes(search)
      );
    });
  }

  /**
   * Apply multiple filters to instruments
   */
  private static applyFilters(
    instruments: Instrument[],
    filters: InstrumentFilters
  ): Instrument[] {
    let results = instruments;

    // String array filters
    if (filters.exchange?.length) {
      results = results.filter((i) => filters.exchange!.includes(i.exchange));
    }

    if (filters.instrument_type?.length) {
      results = results.filter((i) =>
        filters.instrument_type!.includes(i.instrument_type)
      );
    }

    if (filters.segment?.length) {
      results = results.filter((i) => filters.segment!.includes(i.segment));
    }

    if (filters.series?.length) {
      results = results.filter((i) => filters.series!.includes(i.series));
    }

    if (filters.underlying_symbol?.length) {
      results = results.filter(
        (i) =>
          i.underlying_symbol &&
          filters.underlying_symbol!.includes(i.underlying_symbol)
      );
    }

    // Boolean filters
    if (filters.buy_allowed !== undefined) {
      results = results.filter((i) => i.buy_allowed === filters.buy_allowed);
    }

    if (filters.sell_allowed !== undefined) {
      results = results.filter((i) => i.sell_allowed === filters.sell_allowed);
    }

    if (filters.is_reserved !== undefined) {
      results = results.filter((i) => i.is_reserved === filters.is_reserved);
    }

    // Numeric range filters
    if (filters.min_strike_price !== undefined) {
      results = results.filter(
        (i) => i.strike_price >= filters.min_strike_price!
      );
    }

    if (filters.max_strike_price !== undefined) {
      results = results.filter(
        (i) => i.strike_price <= filters.max_strike_price!
      );
    }

    if (filters.min_lot_size !== undefined) {
      results = results.filter((i) => i.lot_size >= filters.min_lot_size!);
    }

    if (filters.max_lot_size !== undefined) {
      results = results.filter((i) => i.lot_size <= filters.max_lot_size!);
    }

    // Date range filters
    if (filters.expiry_date_from) {
      const fromDate = new Date(filters.expiry_date_from);
      results = results.filter((i) => {
        if (!i.expiry_date) return false;
        const expiryDate = new Date(i.expiry_date);
        return expiryDate >= fromDate;
      });
    }

    if (filters.expiry_date_to) {
      const toDate = new Date(filters.expiry_date_to);
      results = results.filter((i) => {
        if (!i.expiry_date) return false;
        const expiryDate = new Date(i.expiry_date);
        return expiryDate <= toDate;
      });
    }

    return results;
  }

  /**
   * Apply sorting to instruments
   */
  private static applySorting(
    instruments: Instrument[],
    sortBy: keyof Instrument,
    sortOrder: "asc" | "desc"
  ): Instrument[] {
    return instruments.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;

      // Different comparison logic based on data type
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        comparison = Number(aValue) - Number(bValue);
      } else {
        // Fallback to string comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });
  }

  /**
   * Get unique values for filter options
   */
  public static getFilterOptions(instruments: Instrument[]): {
    exchanges: string[];
    instrument_types: string[];
    segments: string[];
    series: string[];
    underlying_symbols: string[];
  } {
    const exchanges = [...new Set(instruments.map((i) => i.exchange))]
      .filter(Boolean)
      .sort();
    const instrument_types = [
      ...new Set(instruments.map((i) => i.instrument_type)),
    ]
      .filter(Boolean)
      .sort();
    const segments = [...new Set(instruments.map((i) => i.segment))]
      .filter(Boolean)
      .sort();
    const series = [...new Set(instruments.map((i) => i.series))]
      .filter(Boolean)
      .sort();
    const underlying_symbols = [
      ...new Set(instruments.map((i) => i.underlying_symbol)),
    ]
      .filter(Boolean)
      .sort();

    return {
      exchanges,
      instrument_types,
      segments,
      series,
      underlying_symbols,
    };
  }

  /**
   * Get statistics about the instruments data
   */
  public static getStatistics(instruments: Instrument[]): {
    total_instruments: number;
    by_exchange: Record<string, number>;
    by_instrument_type: Record<string, number>;
    by_segment: Record<string, number>;
    tradeable_instruments: number;
    options_count: number;
    futures_count: number;
    stocks_count: number;
  } {
    const stats = {
      total_instruments: instruments.length,
      by_exchange: {} as Record<string, number>,
      by_instrument_type: {} as Record<string, number>,
      by_segment: {} as Record<string, number>,
      tradeable_instruments: 0,
      options_count: 0,
      futures_count: 0,
      stocks_count: 0,
    };

    instruments.forEach((instrument) => {
      // Count by exchange
      stats.by_exchange[instrument.exchange] =
        (stats.by_exchange[instrument.exchange] || 0) + 1;

      // Count by instrument type
      stats.by_instrument_type[instrument.instrument_type] =
        (stats.by_instrument_type[instrument.instrument_type] || 0) + 1;

      // Count by segment
      stats.by_segment[instrument.segment] =
        (stats.by_segment[instrument.segment] || 0) + 1;

      // Count tradeable instruments
      if (instrument.buy_allowed && instrument.sell_allowed) {
        stats.tradeable_instruments++;
      }

      // Count by major categories
      if (
        instrument.instrument_type === "CE" ||
        instrument.instrument_type === "PE"
      ) {
        stats.options_count++;
      } else if (instrument.instrument_type === "FUT") {
        stats.futures_count++;
      } else if (instrument.segment === "CASH") {
        stats.stocks_count++;
      }
    });

    return stats;
  }
}
