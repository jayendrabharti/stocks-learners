"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductTypeInfoProps {
  productType: "CNC" | "MIS";
  className?: string;
}

export function ProductTypeInfo({
  productType,
  className,
}: ProductTypeInfoProps) {
  const info = {
    CNC: {
      title: "CNC - Cash and Carry (Delivery)",
      description:
        "Full payment required. Hold stocks for long-term. Shares delivered to your demat account. No time restrictions.",
      features: [
        "✓ 100% payment required",
        "✓ Hold indefinitely",
        "✓ Delivery to demat",
        "✓ Long-term investing",
      ],
      color: "text-blue-600 dark:text-blue-400",
    },
    MIS: {
      title: "MIS - Margin Intraday Square-off",
      description:
        "Only 25% margin required (4x leverage). Must close positions by 3:30 PM IST same day. Higher risk due to leverage.",
      features: [
        "⚡ 25% margin (4x leverage)",
        "⏰ Close by 3:30 PM IST",
        "📈 Day trading only",
        "⚠️ Higher risk",
      ],
      color: "text-orange-600 dark:text-orange-400",
    },
  };

  const currentInfo = info[productType];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle
            className={cn(
              "inline-block h-4 w-4 cursor-help",
              currentInfo.color,
              className,
            )}
          />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs" side="top">
          <div className="space-y-2">
            <h4 className="font-semibold">{currentInfo.title}</h4>
            <p className="text-muted-foreground text-sm">
              {currentInfo.description}
            </p>
            <ul className="space-y-1 text-xs">
              {currentInfo.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
