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
} from "react";
import { toast } from "sonner";
import useLocalState from "@/hooks/useLocalState";

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

  const fetchSession = async () => {
    try {
      const fetchedUser = await getUser();

      if (fetchedUser) {
        // User is valid, update both local state and localStorage
        setUser(fetchedUser);
        setStoredUser(fetchedUser);
        setStatus("authenticated");
        console.log("User validated and synced:", fetchedUser);
      } else {
        // User session is invalid, clear everything
        setUser(null);
        setStoredUser(null);
        setStatus("unauthenticated");
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
    }
  };

  const logOut = async (redirect: boolean = false) => {
    const { data } = await ApiClient.post("/auth/logout");
    if (data.success) {
      setUser(null);
      setStoredUser(null);
      setError(null);
      setStatus("unauthenticated");
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
