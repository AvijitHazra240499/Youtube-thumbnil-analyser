import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// TESTING-ONLY hook: 15-minute trial window
export function useTrialStatus15() {
  const user = useCurrentUser();
  const [start, setStart] = useState<Date | null>(null);
  const [minutesLeft, setMinutesLeft] = useState<number>(0);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchOrCreate() {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_trials15")
        .select("trial_start")
        .eq("user_id", user.id)
        .single();

      let trialStart: Date;
      if (error || !data) {
        trialStart = new Date();
        await supabase.from("user_trials15").insert({ user_id: user.id, trial_start: trialStart.toISOString() });
      } else {
        trialStart = new Date(data.trial_start);
      }

      setStart(trialStart);
      updateRemaining(trialStart);
      setLoading(false);
    }

    fetchOrCreate();
    const interval = setInterval(() => {
      if (start) updateRemaining(start);
    }, 1000 * 30); // update every 30s
    return () => clearInterval(interval);
  }, [user, start]);

  function updateRemaining(trialStart: Date) {
    const now = new Date();
    const diffMs = now.getTime() - trialStart.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const TRIAL_MIN = 15;
    const left = Math.max(0, TRIAL_MIN - diffMin);
    setMinutesLeft(left);
    setExpired(left <= 0);
  }

  return { start, minutesLeft, expired, loading };
}
