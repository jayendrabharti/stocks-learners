"use client";

import { useState, useEffect } from "react";
import { StockCard } from "./StockCard";
import { BuyStockDialog } from "./index";
import { InstrumentSearch, StockPrice } from "@/types/trading";
import { stockApiService } from "@/services/stockApi";

interface TradableStockCardProps {
  stock: InstrumentSearch;
  showDetails?: boolean;
  showActions?: boolean;
  onSuccess?: () => void;
}

export default function TradableStockCard({
  stock,
  showDetails = true,
  showActions = true,
  onSuccess,
}: TradableStockCardProps) {
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [livePrice, setLivePrice] = useState<StockPrice | null>(null);

  // Fetch live price when needed for buying
  useEffect(() => {
    if (showBuyDialog && stock.tradingSymbol && stock.exchange && !livePrice) {
      fetchLivePrice();
    }
  }, [showBuyDialog, stock.tradingSymbol, stock.exchange]);

  const fetchLivePrice = async () => {
    try {
      if (!stock.tradingSymbol || !stock.exchange) return;
      const price = await stockApiService.getLivePrice(
        stock.tradingSymbol,
        stock.exchange,
      );
      setLivePrice(price);
    } catch (err) {
      console.error("Failed to fetch live price:", err);
    }
  };

  const handleBuy = () => {
    setShowBuyDialog(true);
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  // For now, we'll just show the buy dialog
  // Sell will require checking portfolio holdings first
  const handleSell = () => {
    console.log("Sell functionality requires portfolio integration");
  };

  return (
    <>
      <StockCard
        stock={stock}
        showDetails={showDetails}
        showActions={showActions}
        onBuy={handleBuy}
        onSell={handleSell}
      />

      {/* Buy Dialog - only show if we have price data */}
      {livePrice && (
        <BuyStockDialog
          open={showBuyDialog}
          onClose={() => setShowBuyDialog(false)}
          stock={{
            symbol: stock.tradingSymbol || stock.symbol || "",
            name: stock.name || "",
            exchange: stock.exchange || "",
            currentPrice: livePrice.ltp,
            isin: stock.isin,
          }}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
