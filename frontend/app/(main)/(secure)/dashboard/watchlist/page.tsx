"use client";

import { Watchlist } from "../../../../../components/trading/Watchlist";

export default function WatchlistPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Track your favorite stocks and monitor their performance.
        </p>
      </div>

      <Watchlist showHeader={false} />
    </div>
  );
}
