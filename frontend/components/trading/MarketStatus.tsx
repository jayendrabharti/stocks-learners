"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle } from "lucide-react";

interface MarketStatusProps {
  className?: string;
  showFullMessage?: boolean;
}

export function MarketStatus({
  className,
  showFullMessage = false,
}: MarketStatusProps) {
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [timeUntilChange, setTimeUntilChange] = useState("");
  const [isCloseToClosing, setIsCloseToClosing] = useState(false);

  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();

      // Convert to IST (UTC +5:30)
      const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
      const istTime = new Date(now.getTime() + istOffset);

      const hours = istTime.getUTCHours();
      const minutes = istTime.getUTCMinutes();
      const dayOfWeek = istTime.getUTCDay(); // 0 = Sunday, 6 = Saturday

      // Check if it's a weekend
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Market hours: 9:15 AM to 3:30 PM IST (09:15 to 15:30)
      const marketOpenTime = 9 * 60 + 15; // 9:15 AM in minutes
      const marketCloseTime = 15 * 60 + 30; // 3:30 PM in minutes
      const currentTimeInMinutes = hours * 60 + minutes;

      const isOpen =
        !isWeekend &&
        currentTimeInMinutes >= marketOpenTime &&
        currentTimeInMinutes < marketCloseTime;

      setIsMarketOpen(isOpen);

      // Check if close to closing (last 30 minutes)
      const minutesUntilClose = marketCloseTime - currentTimeInMinutes;
      setIsCloseToClosing(
        isOpen && minutesUntilClose > 0 && minutesUntilClose <= 30,
      );

      // Calculate time until next change
      if (isWeekend) {
        const daysUntilMonday = dayOfWeek === 0 ? 1 : 2; // Sunday -> 1 day, Saturday -> 2 days
        setTimeUntilChange(`Opens Monday at 9:15 AM IST`);
      } else if (isOpen) {
        const hours = Math.floor(minutesUntilClose / 60);
        const mins = minutesUntilClose % 60;
        if (hours > 0) {
          setTimeUntilChange(`Closes in ${hours}h ${mins}m`);
        } else {
          setTimeUntilChange(`Closes in ${mins}m`);
        }
      } else if (currentTimeInMinutes < marketOpenTime) {
        const minutesUntilOpen = marketOpenTime - currentTimeInMinutes;
        const hours = Math.floor(minutesUntilOpen / 60);
        const mins = minutesUntilOpen % 60;
        if (hours > 0) {
          setTimeUntilChange(`Opens in ${hours}h ${mins}m`);
        } else {
          setTimeUntilChange(`Opens in ${mins}m`);
        }
      } else {
        setTimeUntilChange(`Opens tomorrow at 9:15 AM IST`);
      }
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (showFullMessage) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-4 py-3",
          isMarketOpen
            ? isCloseToClosing
              ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
              : "border-green-500 bg-green-50 dark:bg-green-950/20"
            : "border-gray-300 bg-gray-50 dark:bg-gray-950/20",
          className,
        )}
      >
        {isCloseToClosing ? (
          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        ) : (
          <Clock
            className={cn(
              "h-5 w-5",
              isMarketOpen
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-400",
            )}
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {isMarketOpen ? "Market Open" : "Market Closed"}
            </span>
            <span
              className={cn(
                "inline-flex h-2 w-2 rounded-full",
                isMarketOpen
                  ? isCloseToClosing
                    ? "animate-pulse bg-orange-500"
                    : "animate-pulse bg-green-500"
                  : "bg-gray-400",
              )}
            />
          </div>
          <p className="text-muted-foreground text-sm">
            {timeUntilChange}
            {isMarketOpen && (
              <span className="ml-2">• MIS trading available</span>
            )}
            {!isMarketOpen && <span className="ml-2">• CNC orders only</span>}
          </p>
        </div>
      </div>
    );
  }

  // Compact badge version
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
        isMarketOpen
          ? isCloseToClosing
            ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
            : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex h-2 w-2 rounded-full",
          isMarketOpen
            ? isCloseToClosing
              ? "animate-pulse bg-orange-500"
              : "animate-pulse bg-green-500"
            : "bg-gray-400",
        )}
      />
      <span>{isMarketOpen ? "Market Open" : "Market Closed"}</span>
    </div>
  );
}
