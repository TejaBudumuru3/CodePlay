"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface CreditsContextValue {
  credits: number;
  maxCredits: number;
  isGuest: boolean;
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
      }
    } catch (err) {
      console.error("Failed to fetch credits", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if session is authenticated, or if we know they are a guest (handled by NextAuth).
    // In our app, users must be logged in (even guests via `guestuser@gmail.com`) to reach /builder.
    if (status === "authenticated") {
      fetchCredits();
    }
  }, [status]);

  const value = {
    credits,
    maxCredits,
    isGuest,
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
