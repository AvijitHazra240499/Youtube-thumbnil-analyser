import React, { createContext, useContext } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProStatus } from "@/hooks/useProStatus";
import { useTrialStatus } from "@/hooks/useTrialStatus";

const TrialContext = createContext<any>(null);

export function TrialProvider({ children }: { children: React.ReactNode }) {
  // If trials/payments are disabled, return default unlimited access
  const disableTrial = import.meta.env.VITE_DISABLE_TRIAL === "true";
  if (disableTrial) {
    const contextValue = {
      isPro: true,
      daysLeft: undefined,
      minutesLeft: undefined,
      expired: false,
      loading: false,
      testMode: false
    };
    return (
      <TrialContext.Provider value={contextValue}>
        {children}
      </TrialContext.Provider>
    );
  }

  const user = useCurrentUser();
  const { isPro } = useProStatus(user?.id);

  // Use standard 3-day trial for all users
  const testMode = false;
  const trial = useTrialStatus() as any;

  const { daysLeft } = trial;
  const minutesLeft = undefined;
  const { expired, loading } = trial;

  return (
    <TrialContext.Provider value={{ isPro, daysLeft, minutesLeft, expired, loading, testMode }}>
      {children}
    </TrialContext.Provider>
  );
}

export function useTrial() {
  return useContext(TrialContext);
}
