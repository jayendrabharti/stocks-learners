"use client";

import getUser from "@/auth/getUser";
import ApiClient from "@/utils/ApiClient";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  SetStateAction,
  Dispatch,
  useRef,
} from "react";
import { toast } from "sonner";
import useLocalState from "@/hooks/useLocalState";
import { checkStaleMIS, processAutoSquareOff } from "@/services/tradingApi";

export interface SessionContextType {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  refreshSession: () => Promise<void>;
  setUser: Dispatch<SetStateAction<User | null>>;
  logOut: (redirect?: boolean) => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  status: "loading",
  error: null,
  refreshSession: async () => {},
  setUser: () => {},
  logOut: async (redirect: boolean = false) => {},
});

export default function SessionProvider({ children }: { children: ReactNode }) {
  // Use localStorage to persist user data
  const [storedUser, setStoredUser] = useLocalState<User | null>("user", null);

  const [user, setUser] = useState<SessionContextType["user"]>(storedUser);
  const [error, setError] = useState<string | null>(null);

  // Initialize status based on localStorage
  const [status, setStatus] = useState<SessionContextType["status"]>(
    storedUser ? "authenticated" : "loading",
  );

  const router = useRouter();

  // Track if we've already checked for stale MIS in this session
  const hasCheckedStaleMIS = useRef(false);

  const fetchSession = async () => {
    try {
      const fetchedUser = await getUser();

      if (fetchedUser) {
        // User is valid, update both local state and localStorage
        setUser(fetchedUser);
        setStoredUser(fetchedUser);
        setStatus("authenticated");

        // Check for stale MIS positions on first authentication
        // This runs once per session when user is authenticated
        if (!hasCheckedStaleMIS.current) {
          hasCheckedStaleMIS.current = true;
          checkAndAutoSquareOff();
        }
      } else {
        // User session is invalid, clear everything
        setUser(null);
        setStoredUser(null);
        setStatus("unauthenticated");
        hasCheckedStaleMIS.current = false; // Reset for next login
        console.log("User session invalid, cleared");
      }
      setError(null);
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setError("Failed to fetch session");
      // On error, clear user data to be safe
      setUser(null);
      setStoredUser(null);
      setStatus("unauthenticated");
      hasCheckedStaleMIS.current = false;
    }
  };

  /**
   * Check for stale MIS positions and auto square-off
   * This mimics how Groww/Zerodha handle MIS positions:
   * - Checks if user has MIS positions from previous trading days
   * - Automatically squares them off at historical closing prices (3:30 PM)
   * - Shows notification with details
   *
   * Runs automatically on login/session init (once per session)
   */
  const checkAndAutoSquareOff = async () => {
    try {
      // Quick check if user has stale positions (lightweight API call)
      const { hasStaleMIS } = await checkStaleMIS();

      if (!hasStaleMIS) {
        // No stale positions, nothing to do
        return;
      }

      // User has stale MIS positions, process auto square-off
      console.log(
        "[AutoSquareOff] Stale MIS positions detected, processing...",
      );

      const result = await processAutoSquareOff();

      if (result.squaredOffCount > 0) {
        // Calculate total P&L
        const totalPnL = result.positions.reduce(
          (sum, pos) => sum + pos.pnl,
          0,
        );
        const avgPnLPercent =
          result.positions.reduce((sum, pos) => sum + pos.pnlPercent, 0) /
          result.positions.length;

        // Show notification with summary
        const pnlColor = totalPnL >= 0 ? "text-green-600" : "text-red-600";
        const pnlSign = totalPnL >= 0 ? "+" : "";

        toast.success(
          <div className="space-y-2">
            <div className="font-semibold">Auto Square-Off Completed</div>
            <div className="text-sm">
              {result.squaredOffCount} MIS position(s) from previous trading
              day(s) were automatically squared off at market close prices (3:30
              PM).
            </div>
            <div className={`text-sm font-semibold ${pnlColor}`}>
              Total P&L: {pnlSign}₹{Math.abs(totalPnL).toFixed(2)} ({pnlSign}
              {avgPnLPercent.toFixed(2)}%)
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              View details in your transaction history
            </div>
          </div>,
          {
            duration: 8000, // Show for 8 seconds
            position: "top-center",
          },
        );

        console.log(
          `[AutoSquareOff] Successfully squared off ${result.squaredOffCount} position(s)`,
        );
      }

      // Log any errors
      if (result.errors && result.errors.length > 0) {
        console.warn(
          "[AutoSquareOff] Some positions failed to square off:",
          result.errors,
        );

        toast.warning(
          `${result.errors.length} position(s) could not be squared off automatically. Please check manually.`,
          { duration: 6000 },
        );
      }
    } catch (error) {
      console.error(
        "[AutoSquareOff] Error checking/processing stale MIS:",
        error,
      );
      // Don't show error toast to user - this is a background operation
      // User can manually check their portfolio if needed
    }
  };

  const logOut = async (redirect: boolean = false) => {
    const { data } = await ApiClient.post("/auth/logout");
    if (data.success) {
      setUser(null);
      setStoredUser(null);
      setError(null);
      setStatus("unauthenticated");
      hasCheckedStaleMIS.current = false; // Reset for next login
      toast.success("Signed out !!");
      if (redirect) {
        router.push("/login");
      }
    } else {
      toast.error("Error signing out");
    }
  };

  // Custom setUser that also updates localStorage
  const updateUser = (value: SetStateAction<User | null>) => {
    const newUser = typeof value === "function" ? value(user) : value;
    setUser(newUser);
    setStoredUser(newUser);
  };

  useEffect(() => {
    // If we don't have a user from localStorage, set loading state
    if (!storedUser) {
      setStatus("loading");
    }

    // Always fetch session in background to validate
    fetchSession();
  }, []);

  const contextValue: SessionContextType = {
    user,
    status,
    error,
    refreshSession: fetchSession,
    setUser: updateUser,
    logOut,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
