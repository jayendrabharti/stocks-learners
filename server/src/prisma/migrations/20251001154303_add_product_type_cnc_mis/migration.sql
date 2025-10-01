/*
  Warnings:

  - A unique constraint covering the columns `[userId,stockSymbol,exchange,product]` on the table `portfolios` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `product` to the `portfolios` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('CNC', 'MIS');

-- DropIndex
DROP INDEX "public"."portfolios_userId_stockSymbol_exchange_key";

-- AlterTable
-- First add column with default value for existing rows
ALTER TABLE "public"."portfolios" ADD COLUMN "product" "public"."ProductType" NOT NULL DEFAULT 'CNC';

-- Add tradeDate column with default value
ALTER TABLE "public"."portfolios" ADD COLUMN "tradeDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."transactions" ADD COLUMN     "product" "public"."ProductType" NOT NULL DEFAULT 'CNC';

-- AlterTable
ALTER TABLE "public"."wallets" ADD COLUMN     "misMarginUsed" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "misPnL" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "misPositionsValue" DECIMAL(15,2) NOT NULL DEFAULT 0.00;

-- CreateIndex
CREATE INDEX "portfolios_userId_product_idx" ON "public"."portfolios"("userId", "product");

-- CreateIndex
CREATE INDEX "portfolios_tradeDate_product_idx" ON "public"."portfolios"("tradeDate", "product");

-- CreateIndex
CREATE UNIQUE INDEX "portfolios_userId_stockSymbol_exchange_product_key" ON "public"."portfolios"("userId", "stockSymbol", "exchange", "product");

-- CreateIndex
CREATE INDEX "transactions_product_idx" ON "public"."transactions"("product");
