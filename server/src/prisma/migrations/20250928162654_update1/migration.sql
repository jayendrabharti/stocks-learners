-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."OrderType" AS ENUM ('MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LIMIT');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('INR', 'USD');

-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."TradingStyle" AS ENUM ('INTRADAY', 'SWING', 'POSITIONAL');

-- CreateEnum
CREATE TYPE "public"."MarketCapSize" AS ENUM ('LARGE_CAP', 'MID_CAP', 'SMALL_CAP', 'MICRO_CAP');

-- CreateTable
CREATE TABLE "public"."wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "virtualCash" DECIMAL(15,2) NOT NULL DEFAULT 1000000.00,
    "currency" "public"."Currency" NOT NULL DEFAULT 'INR',
    "totalInvested" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "currentValue" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "totalPnL" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "totalPnLPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dayPnL" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "dayPnLPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolios" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockSymbol" TEXT NOT NULL,
    "stockName" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "isin" TEXT,
    "quantity" INTEGER NOT NULL,
    "averagePrice" DECIMAL(10,2) NOT NULL,
    "totalInvested" DECIMAL(15,2) NOT NULL,
    "currentPrice" DECIMAL(10,2) NOT NULL,
    "currentValue" DECIMAL(15,2) NOT NULL,
    "unrealizedPnL" DECIMAL(15,2) NOT NULL,
    "unrealizedPnLPerc" DOUBLE PRECISION NOT NULL,
    "dayChange" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "dayChangePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastPriceUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockSymbol" TEXT NOT NULL,
    "stockName" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "isin" TEXT,
    "type" "public"."TransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "brokerage" DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    "taxes" DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    "totalCharges" DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    "netAmount" DECIMAL(15,2) NOT NULL,
    "balanceAfter" DECIMAL(15,2) NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tradingOrderId" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."watchlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockSymbol" TEXT NOT NULL,
    "stockName" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "isin" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trading_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockSymbol" TEXT NOT NULL,
    "stockName" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "orderType" "public"."OrderType" NOT NULL DEFAULT 'MARKET',
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2),
    "triggerPrice" DECIMAL(10,2),
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "filledQuantity" INTEGER NOT NULL DEFAULT 0,
    "averageFillPrice" DECIMAL(10,2),
    "validTill" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "trading_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_prices" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "isin" TEXT,
    "ltp" DECIMAL(10,2) NOT NULL,
    "open" DECIMAL(10,2) NOT NULL,
    "high" DECIMAL(10,2) NOT NULL,
    "low" DECIMAL(10,2) NOT NULL,
    "previousClose" DECIMAL(10,2) NOT NULL,
    "change" DECIMAL(10,2) NOT NULL,
    "changePercent" DOUBLE PRECISION NOT NULL,
    "volume" BIGINT,
    "marketCap" BIGINT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastFetched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultExchange" TEXT NOT NULL DEFAULT 'NSE',
    "riskTolerance" "public"."RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "tradingStyle" "public"."TradingStyle" NOT NULL DEFAULT 'SWING',
    "priceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "orderAlerts" BOOLEAN NOT NULL DEFAULT true,
    "portfolioAlerts" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "defaultView" TEXT NOT NULL DEFAULT 'PORTFOLIO',
    "chartPreferences" JSONB NOT NULL DEFAULT '{"period":"1D","type":"CANDLE"}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalValue" DECIMAL(15,2) NOT NULL,
    "totalInvested" DECIMAL(15,2) NOT NULL,
    "totalPnL" DECIMAL(15,2) NOT NULL,
    "totalPnLPercent" DOUBLE PRECISION NOT NULL,
    "cashBalance" DECIMAL(15,2) NOT NULL,
    "dayPnL" DECIMAL(15,2) NOT NULL,
    "dayPnLPercent" DOUBLE PRECISION NOT NULL,
    "benchmarkValue" DOUBLE PRECISION,
    "benchmarkChange" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."market_sessions" (
    "id" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "holidayReason" TEXT,
    "preMarketStart" TEXT DEFAULT '09:00',
    "preMarketEnd" TEXT DEFAULT '09:15',
    "regularStart" TEXT DEFAULT '09:15',
    "regularEnd" TEXT DEFAULT '15:30',
    "postMarketStart" TEXT DEFAULT '15:40',
    "postMarketEnd" TEXT DEFAULT '16:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_metadata" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "isin" TEXT,
    "companyName" TEXT NOT NULL,
    "sector" TEXT,
    "industry" TEXT,
    "marketCap" "public"."MarketCapSize",
    "indexMembership" JSONB NOT NULL DEFAULT '[]',
    "isDerivativeAllowed" BOOLEAN NOT NULL DEFAULT false,
    "lotSize" INTEGER,
    "faceValue" DECIMAL(8,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_usage_logs" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "userId" TEXT,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "statusCode" INTEGER,
    "responseTime" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "public"."wallets"("userId");

-- CreateIndex
CREATE INDEX "portfolios_userId_idx" ON "public"."portfolios"("userId");

-- CreateIndex
CREATE INDEX "portfolios_stockSymbol_idx" ON "public"."portfolios"("stockSymbol");

-- CreateIndex
CREATE UNIQUE INDEX "portfolios_userId_stockSymbol_exchange_key" ON "public"."portfolios"("userId", "stockSymbol", "exchange");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "public"."transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_stockSymbol_idx" ON "public"."transactions"("stockSymbol");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "public"."transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_executedAt_idx" ON "public"."transactions"("executedAt");

-- CreateIndex
CREATE INDEX "watchlists_userId_idx" ON "public"."watchlists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "watchlists_userId_stockSymbol_exchange_key" ON "public"."watchlists"("userId", "stockSymbol", "exchange");

-- CreateIndex
CREATE INDEX "trading_orders_userId_idx" ON "public"."trading_orders"("userId");

-- CreateIndex
CREATE INDEX "trading_orders_status_idx" ON "public"."trading_orders"("status");

-- CreateIndex
CREATE INDEX "trading_orders_stockSymbol_idx" ON "public"."trading_orders"("stockSymbol");

-- CreateIndex
CREATE INDEX "stock_prices_symbol_idx" ON "public"."stock_prices"("symbol");

-- CreateIndex
CREATE INDEX "stock_prices_lastFetched_idx" ON "public"."stock_prices"("lastFetched");

-- CreateIndex
CREATE UNIQUE INDEX "stock_prices_symbol_exchange_key" ON "public"."stock_prices"("symbol", "exchange");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "public"."user_preferences"("userId");

-- CreateIndex
CREATE INDEX "portfolio_snapshots_userId_date_idx" ON "public"."portfolio_snapshots"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_snapshots_userId_date_key" ON "public"."portfolio_snapshots"("userId", "date");

-- CreateIndex
CREATE INDEX "market_sessions_date_idx" ON "public"."market_sessions"("date");

-- CreateIndex
CREATE INDEX "market_sessions_exchange_date_idx" ON "public"."market_sessions"("exchange", "date");

-- CreateIndex
CREATE UNIQUE INDEX "market_sessions_exchange_date_key" ON "public"."market_sessions"("exchange", "date");

-- CreateIndex
CREATE INDEX "stock_metadata_symbol_idx" ON "public"."stock_metadata"("symbol");

-- CreateIndex
CREATE INDEX "stock_metadata_sector_idx" ON "public"."stock_metadata"("sector");

-- CreateIndex
CREATE UNIQUE INDEX "stock_metadata_symbol_exchange_key" ON "public"."stock_metadata"("symbol", "exchange");

-- CreateIndex
CREATE INDEX "api_usage_logs_endpoint_idx" ON "public"."api_usage_logs"("endpoint");

-- CreateIndex
CREATE INDEX "api_usage_logs_windowStart_idx" ON "public"."api_usage_logs"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "api_usage_logs_endpoint_windowStart_key" ON "public"."api_usage_logs"("endpoint", "windowStart");

-- AddForeignKey
ALTER TABLE "public"."wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."portfolios" ADD CONSTRAINT "portfolios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_tradingOrderId_fkey" FOREIGN KEY ("tradingOrderId") REFERENCES "public"."trading_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watchlists" ADD CONSTRAINT "watchlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trading_orders" ADD CONSTRAINT "trading_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
