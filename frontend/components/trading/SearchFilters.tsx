"use client";

import React from "react";
import { SearchFilters as SearchFiltersType } from "../../types/trading";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: Partial<SearchFiltersType>) => void;
}

const EXCHANGES = [
  { value: "", label: "All Exchanges" },
  { value: "NSE", label: "NSE" },
  { value: "BSE", label: "BSE" },
];

const INSTRUMENT_TYPES = [
  { value: "", label: "All Instruments" },
  { value: "Stocks", label: "Stocks" },
  { value: "Option", label: "Options" },
  { value: "OPTION_CHAIN", label: "Option Chain" },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleExchangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ exchange: e.target.value, page: 1 });
  };

  const handleInstrumentTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    onFiltersChange({ instrumentType: e.target.value, page: 1 });
  };

  const clearFilters = () => {
    onFiltersChange({
      exchange: "",
      instrumentType: "",
      sector: "",
      page: 1,
    });
  };

  const hasActiveFilters =
    filters.exchange || filters.instrumentType || filters.sector;

  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Exchange Filter */}
        <div>
          <label
            htmlFor="exchange"
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            Exchange
          </label>
          <select
            id="exchange"
            value={filters.exchange || ""}
            onChange={handleExchangeChange}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
          >
            {EXCHANGES.map((exchange) => (
              <option key={exchange.value} value={exchange.value}>
                {exchange.label}
              </option>
            ))}
          </select>
        </div>

        {/* Instrument Type Filter */}
        <div>
          <label
            htmlFor="instrumentType"
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            Instrument Type
          </label>
          <select
            id="instrumentType"
            value={filters.instrumentType || ""}
            onChange={handleInstrumentTypeChange}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
          >
            {INSTRUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <div className="flex flex-wrap gap-2">
            {filters.exchange && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {EXCHANGES.find((e) => e.value === filters.exchange)?.label}
                <button
                  onClick={() => onFiltersChange({ exchange: "", page: 1 })}
                  className="ml-1.5 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.instrumentType && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                {
                  INSTRUMENT_TYPES.find(
                    (t) => t.value === filters.instrumentType,
                  )?.label
                }
                <button
                  onClick={() =>
                    onFiltersChange({ instrumentType: "", page: 1 })
                  }
                  className="ml-1.5 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
