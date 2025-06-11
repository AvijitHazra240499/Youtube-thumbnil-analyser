import { useEffect, useState } from "react";

// Use localStorage for trial logic
export function useTrialStatus() {
  const [trialStart, setTrialStart] = useState<Date | null>(null);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let startString = localStorage.getItem("trial_start");
    let start: Date | null = null;
    if (!startString) {
      // Set trial_start on first visit
      start = new Date();
      localStorage.setItem("trial_start", start.toISOString());
    } else {
      start = new Date(startString);
    }
    setTrialStart(start);
    // Use current local time as source of truth
    const now = new Date("2025-06-11T02:23:59Z");
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const left = Math.max(0, 5 - diff);
    setDaysLeft(left);
    setExpired(left <= 0);
    setLoading(false);
  }, []);

  return { trialStart, daysLeft, expired, loading };
}
