import React, { createContext, useContext } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProStatus } from "@/hooks/useProStatus";
import { useTrialStatus } from "@/hooks/useTrialStatus";

const TrialContext = createContext<any>(null);

export function TrialProvider({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const { isPro } = useProStatus(user?.id);
  const { daysLeft, expired, loading } = useTrialStatus();

  return (
    <TrialContext.Provider value={{ isPro, daysLeft, expired, loading }}>
      {children}
    </TrialContext.Provider>
  );
}

export function useTrial() {
  return useContext(TrialContext);
}
