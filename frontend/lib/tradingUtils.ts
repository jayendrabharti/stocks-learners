export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

export function formatCurrency(
  amount: number,
  currency: string = "INR",
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(2) + " Cr";
  }
  if (num >= 100000) {
    return (num / 100000).toFixed(2) + " L";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + " K";
  }
  return num.toFixed(2);
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function getChangeColor(value: number): string {
  if (value > 0) return "text-chart-1";
  if (value < 0) return "text-destructive";
  return "text-muted-foreground";
}

export function getChangeBgColor(value: number): string {
  if (value > 0) return "bg-chart-1/10";
  if (value < 0) return "bg-destructive/10";
  return "bg-muted/30";
}
