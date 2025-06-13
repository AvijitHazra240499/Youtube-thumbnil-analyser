import React, { createContext, useContext } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProStatus } from "@/hooks/useProStatus";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useTrialStatus15 } from "@/hooks/useTrialStatus15";

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

  // Use 15-minute test hook when VITE_TRIAL_TEST=true
  const testMode = import.meta.env.VITE_TRIAL_TEST === "true";
  const trial = testMode ? (useTrialStatus15() as any) : (useTrialStatus() as any);

  const daysLeft = trial.daysLeft as number | undefined;
  const minutesLeft = trial.minutesLeft as number | undefined;
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
