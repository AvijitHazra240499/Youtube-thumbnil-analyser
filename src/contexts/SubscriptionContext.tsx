import React, { createContext, useContext, useEffect, useState } from "react";

interface SubscriptionContextType {
  isTrialExpired: boolean;
  trialDaysLeft: number;
  isPaid: boolean;
  setPaid: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    // Check paid status (for demo, use localStorage)
    const paid = localStorage.getItem("isPaid") === "true";
    setIsPaid(paid);

    // Trial logic
    let trialStart = localStorage.getItem("trialStart");
    if (!trialStart) {
      trialStart = new Date().toISOString();
      localStorage.setItem("trialStart", trialStart);
    }
    const start = new Date(trialStart);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, 5 - diff);
    setTrialDaysLeft(daysLeft);
    setIsTrialExpired(daysLeft <= 0);
  }, []);

  const setPaid = () => {
    localStorage.setItem("isPaid", "true");
    setIsPaid(true);
  };

  return (
    <SubscriptionContext.Provider value={{ isTrialExpired, trialDaysLeft, isPaid, setPaid }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
