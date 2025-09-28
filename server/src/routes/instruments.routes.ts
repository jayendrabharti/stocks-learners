import { Router } from "express";
import {
  searchInstruments,
  getInstrumentBySymbol,
} from "../controllers/instruments.controller.js";

const router = Router();

/**
 * @route GET /api/instruments
 * @desc Search and filter instruments
 * @access Public
 * @query {string} [search] - Search term for symbol, name, or description
 * @query {string} [sort_by] - Field to sort by
 * @query {string} [sort_order] - Sort order (asc|desc)
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Items per page
 * @query {string|string[]} [exchange] - Filter by exchange(s)
 * @query {string|string[]} [instrument_type] - Filter by instrument type(s)
 * @query {string|string[]} [segment] - Filter by segment(s)
 * @query {string|string[]} [series] - Filter by series
 * @query {string|string[]} [underlying_symbol] - Filter by underlying symbol(s)
 * @query {boolean} [buy_allowed] - Filter by buy allowed
 * @query {boolean} [sell_allowed] - Filter by sell allowed
 * @query {boolean} [is_reserved] - Filter by reserved status
 * @query {number} [min_strike_price] - Minimum strike price
 * @query {number} [max_strike_price] - Maximum strike price
 * @query {number} [min_lot_size] - Minimum lot size
 * @query {number} [max_lot_size] - Maximum lot size
 * @query {string} [expiry_date_from] - Filter expiry from date (YYYY-MM-DD)
 * @query {string} [expiry_date_to] - Filter expiry to date (YYYY-MM-DD)
 */
router.get("/", searchInstruments);

/**
 * @route GET /api/instruments/:symbol
 * @desc Get instrument by symbol
 * @access Public
 * @param {string} symbol - Instrument symbol
 */
router.get("/:symbol", getInstrumentBySymbol);

export default router;
