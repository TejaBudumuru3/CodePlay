"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface CreditsContextValue {
  credits: number;
  maxCredits: number;
  isGuest: boolean;
  tier: 'FREE' | 'PRO';
  isLoading: boolean;
  refreshCredits: () => Promise<void>;
  decrementCredits: () => void;
}

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<number>(0);
  const [maxCredits, setMaxCredits] = useState<number>(0);
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [tier, setTier] = useState<'FREE' | 'PRO'>('FREE');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCredits = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/credits");
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
        setMaxCredits(data.maxCredits);
        setIsGuest(data.isGuest);
        setTier(data.tier || 'FREE');
      }
    } catch (err) {
      console.error("Failed to fetch credits", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if session is authenticated
    if (status === "authenticated") {
      fetchCredits();
    }
  }, [status]);

  const value = {
    credits,
    maxCredits,
    isGuest,
    tier,
    isLoading,
    refreshCredits: fetchCredits,
    decrementCredits: () => setCredits((prev) => Math.max(0, prev - 1)),
  };

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
}
