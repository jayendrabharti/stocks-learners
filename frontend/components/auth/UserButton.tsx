"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import SignOutButton from "./SignOutButton";
import {
  Loader2Icon,
  LockIcon,
  LogInIcon,
  UserRoundCogIcon,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { useSession } from "@/providers/SessionProvider";
import { useWallet } from "@/hooks/useWallet";
import { motion, AnimatePresence } from "motion/react";
import { Skeleton } from "../ui/skeleton";

export default function UserButton({
  className = "",
  variant = "simple",
  expanded = false,
}: {
  className?: string;
  variant?: "simple" | "expandable";
  expanded?: boolean;
}) {
  const { user, status } = useSession();
  const { summary, loading: walletLoading } = useWallet();

  // Format currency in Indian style (₹1,00,000.00)
  const formatIndianCurrency = (value: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (status == "loading")
    return <Loader2Icon className={cn("animate-spin", className)} />;

  if (status == "unauthenticated")
    return (
      <Link href="/login">
        <Button variant="outline" className="rounded-full">
          Log In <LogInIcon />
        </Button>
      </Link>
    );

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase();

  if (user) {
    if (variant === "simple") {
      return (
        <div className={cn("flex items-center", className)}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src={user.avatar ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {/* Wallet Section */}
              {walletLoading ? (
                <div className="space-y-2 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : summary ? (
                <div className="space-y-2 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-medium">
                      Virtual Cash
                    </span>
                    <Link
                      href="/portfolio"
                      className="text-primary text-xs hover:underline"
                    >
                      View Portfolio
                    </Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="text-primary h-4 w-4" />
                      <span className="text-foreground text-lg font-bold">
                        {formatIndianCurrency(
                          parseFloat(summary.virtualCash),
                          summary.currency,
                        )}
                      </span>
                    </div>
                    {parseFloat(summary.totalPnL) !== 0 && (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          parseFloat(summary.totalPnL) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400",
                        )}
                      >
                        {parseFloat(summary.totalPnL) >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {parseFloat(summary.totalPnL) >= 0 ? "+" : ""}
                          {summary.totalPnLPercent.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Investment Summary */}
                  {summary.totalInvested &&
                    parseFloat(summary.totalInvested) > 0 && (
                      <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>
                          Invested:{" "}
                          {formatIndianCurrency(
                            parseFloat(summary.totalInvested),
                            summary.currency,
                          )}
                        </span>
                        <span>
                          Current:{" "}
                          {formatIndianCurrency(
                            parseFloat(summary.currentValue),
                            summary.currency,
                          )}
                        </span>
                      </div>
                    )}

                  {/* MIS Margin Info - Show if user has MIS positions */}
                  {summary.misMarginUsed &&
                    parseFloat(summary.misMarginUsed) > 0 && (
                      <div className="mt-2 border-t pt-2">
                        <div className="text-muted-foreground mb-1 text-xs font-medium">
                          Intraday (MIS)
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Margin Used:
                          </span>
                          <span className="font-medium text-orange-600 dark:text-orange-400">
                            {formatIndianCurrency(
                              parseFloat(summary.misMarginUsed),
                              summary.currency,
                            )}
                          </span>
                        </div>
                        {summary.availableForMIS && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Available (4x):
                            </span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {formatIndianCurrency(
                                parseFloat(summary.availableForMIS),
                                summary.currency,
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ) : null}

              <DropdownMenuSeparator />

              {/* User Info */}
              <div className="space-y-2 px-3 py-2 text-center">
                {user?.name && (
                  <span className="text-foreground block font-medium">
                    {user.name}
                  </span>
                )}
                <Separator />
                {user?.email && (
                  <span className="text-muted-foreground block text-xs">
                    {user.email}
                  </span>
                )}
                {user?.phone && (
                  <span className="text-muted-foreground block text-xs">
                    {user.phone}
                  </span>
                )}
              </div>

              <DropdownMenuSeparator />

              <div className="flex flex-col gap-2 p-1">
                <Link href="/profile" prefetch={true}>
                  <Button
                    variant={"outline"}
                    className="mx-auto flex w-full items-center justify-start"
                  >
                    <UserRoundCogIcon />
                    Profile Settings
                  </Button>
                </Link>

                {user.isAdmin && (
                  <Link href={`/admin`} prefetch={true}>
                    <Button
                      variant={"outline"}
                      className="mx-auto flex w-full items-center justify-start"
                    >
                      <LockIcon />
                      Admin Dashboard
                    </Button>
                  </Link>
                )}

                <SignOutButton className="mx-auto flex w-full items-center justify-start" />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    } else {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                "flex flex-row items-center gap-2 rounded-2xl border",
                "mx-auto transition-all duration-300",
                expanded
                  ? "border-border bg-secondary px-4 py-2 shadow-md"
                  : "mx-auto border-transparent bg-transparent",
                className,
              )}
            >
              <Avatar className="cursor-pointer">
                <AvatarImage src={user.avatar ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0, height: 0 }}
                    animate={{ opacity: 1, width: "auto", height: "auto" }}
                    exit={{ opacity: 0, width: 0, height: 0 }}
                    className="flex flex-col truncate"
                  >
                    <span>{user.email}</span>
                    {user.name && (
                      <span className="text-sm font-light">{user.name}</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex flex-col gap-2 p-1">
              <Link href="/profile" prefetch={true}>
                <Button
                  variant={"outline"}
                  className="mx-auto flex w-full items-center justify-start"
                >
                  <UserRoundCogIcon />
                  Profile Settings
                </Button>
              </Link>

              {user.isAdmin && (
                <Link href={`/admin`} prefetch={true}>
                  <Button
                    variant={"outline"}
                    className="mx-auto flex w-full items-center justify-start"
                  >
                    <LockIcon />
                    Admin Dashboard
                  </Button>
                </Link>
              )}

              <SignOutButton className="mx-auto flex w-full items-center justify-start" />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
}
