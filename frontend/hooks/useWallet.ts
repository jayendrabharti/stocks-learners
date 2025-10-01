"use client";

import { useState, useEffect } from "react";
import {
  getWalletSummary,
  getWalletDetails,
  WalletSummary,
  WalletDetails,
} from "@/services/walletApi";

export const useWallet = () => {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await getWalletSummary();
      setSummary(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching wallet summary:", err);
      setError("Failed to fetch wallet summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
};

export const useWalletDetails = () => {
  const [details, setDetails] = useState<WalletDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await getWalletDetails();
      setDetails(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching wallet details:", err);
      setError("Failed to fetch wallet details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  return {
    details,
    loading,
    error,
    refetch: fetchDetails,
  };
};
