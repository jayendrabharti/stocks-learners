export interface Instrument {
  id?: number;
  exchange: string;
  exchange_token: string;
  trading_symbol: string;
  groww_symbol: string;
  name: string;
  instrument_type: string;
  segment: string;
  series: string;
  isin: string;
  underlying_symbol: string;
  underlying_exchange_token: string;
  expiry_date: string;
  strike_price: number;
  lot_size: number;
  tick_size: number;
  freeze_quantity: number;
  is_reserved: boolean;
  buy_allowed: boolean;
  sell_allowed: boolean;
}

export interface InstrumentFilters {
  exchange?: string[];
  instrument_type?: string[];
  segment?: string[];
  series?: string[];
  underlying_symbol?: string[];
  buy_allowed?: boolean;
  sell_allowed?: boolean;
  is_reserved?: boolean;
  min_strike_price?: number;
  max_strike_price?: number;
  min_lot_size?: number;
  max_lot_size?: number;
  expiry_date_from?: string;
  expiry_date_to?: string;
}

export interface InstrumentSearchParams {
  search?: string;
  filters?: InstrumentFilters;
  sort_by?: keyof Instrument;
  sort_order?: "asc" | "desc";
  page?: number | undefined;
  limit?: number | undefined;
}
