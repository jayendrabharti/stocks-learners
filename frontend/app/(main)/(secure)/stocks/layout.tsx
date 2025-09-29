import { StockSearch } from "@/components/trading";
import { ReactNode } from "react";

export default function StocksLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="border-border bg-background sticky top-0 left-0 z-50 mb-2 flex w-full border-b p-2 shadow-md">
        <StockSearch placeholder="Search for stocks, ETFs, indices... (e.g., RELIANCE, TCS, NIFTY)" />
      </div>
      {children}
    </>
  );
}
