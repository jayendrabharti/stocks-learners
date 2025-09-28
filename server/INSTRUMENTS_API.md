# Instruments API Documentation

## Overview

The Instruments API provides access to Groww's instrument data, including stocks, derivatives, and other financial instruments. The API fetches data from Groww's CSV source and provides search, filtering, and sorting capabilities.

## Base URL

```
http://localhost:6900/api/instruments
```

## Endpoints

### 1. Search Instruments

**GET** `/`

Search and filter instruments with pagination support.

#### Query Parameters

- `search` (string, optional): Search term for symbol, name, or description
- `sort_by` (string, optional): Field to sort by (any instrument field)
- `sort_order` (string, optional): Sort order (`asc` | `desc`)
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Items per page (default: 50, max: 100)

##### Filter Parameters

- `exchange` (string|array, optional): Filter by exchange(s) (e.g., NSE, BSE)
- `instrument_type` (string|array, optional): Filter by instrument type(s) (e.g., EQ, FUT, OPT)
- `segment` (string|array, optional): Filter by segment(s)
- `series` (string|array, optional): Filter by series
- `underlying_symbol` (string|array, optional): Filter by underlying symbol(s)
- `buy_allowed` (boolean, optional): Filter by buy allowed status
- `sell_allowed` (boolean, optional): Filter by sell allowed status
- `is_reserved` (boolean, optional): Filter by reserved status
- `min_strike_price` (number, optional): Minimum strike price
- `max_strike_price` (number, optional): Maximum strike price
- `min_lot_size` (number, optional): Minimum lot size
- `max_lot_size` (number, optional): Maximum lot size
- `expiry_date_from` (string, optional): Filter expiry from date (YYYY-MM-DD)
- `expiry_date_to` (string, optional): Filter expiry to date (YYYY-MM-DD)

#### Example Request

```bash
curl "http://localhost:6900/api/instruments?search=RELIANCE&exchange=NSE&limit=10"
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "trading_symbol": "RELIANCE",
        "groww_symbol": "RELIANCE_EQ_NSE",
        "name": "Reliance Industries Limited",
        "exchange": "NSE",
        "instrument_type": "EQ",
        "segment": "EQ",
        "series": "EQ",
        "isin": "INE002A01018",
        "underlying_symbol": "",
        "expiry_date": "",
        "strike_price": 0,
        "lot_size": 1,
        "tick_size": 0.05,
        "freeze_quantity": 5000,
        "buy_allowed": true,
        "sell_allowed": true,
        "is_reserved": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_count": 1,
      "has_next": false,
      "has_prev": false,
      "total_pages": 1
    }
  }
}
```

### 2. Get Instrument by Symbol

**GET** `/:symbol`

Get a specific instrument by its symbol.

#### Example Request

```bash
curl "http://localhost:6900/api/instruments/RELIANCE"
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "trading_symbol": "RELIANCE",
    "groww_symbol": "RELIANCE_EQ_NSE",
    "name": "Reliance Industries Limited",
    "exchange": "NSE",
    "instrument_type": "EQ",
    "segment": "EQ",
    "series": "EQ",
    "isin": "INE002A01018",
    "underlying_symbol": "",
    "expiry_date": "",
    "strike_price": 0,
    "lot_size": 1,
    "tick_size": 0.05,
    "freeze_quantity": 5000,
    "buy_allowed": true,
    "sell_allowed": true,
    "is_reserved": false
  }
}
```

## Data Source

The API fetches data from Groww's instruments CSV:

```
https://growwapi-assets.groww.in/instruments/instrument.csv
```

## Caching

- Data is cached locally for performance
- Cache is automatically refreshed periodically

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Examples

### Search for all NSE equity stocks

```bash
curl "http://localhost:6900/api/instruments?exchange=NSE&instrument_type=EQ&limit=50"
```

### Search for options expiring in January 2024

```bash
curl "http://localhost:6900/api/instruments?instrument_type=OPT&expiry_date_from=2024-01-01&expiry_date_to=2024-01-31"
```

### Search for NIFTY derivatives

```bash
curl "http://localhost:6900/api/instruments?search=NIFTY&instrument_type=FUT,OPT"
```

### Get top 10 stocks by name

```bash
curl "http://localhost:6900/api/instruments?sort_by=name&sort_order=asc&limit=10"
```
