import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Fetch trial info from Supabase `user_trials` table
// Schema assumed: id (uuid, pk) | user_id uuid | trial_start timestamp
export function useTrialStatus() {
  const user = useCurrentUser();
  const [trialStart, setTrialStart] = useState<Date | null>(null);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return; // Wait for auth

    async function fetchOrCreateTrial() {
      setLoading(true);
      // 1. Try fetch existing record
      const { data, error } = await supabase
        .from("user_trials")
        .select("trial_start")
        .eq("user_id", user.id)
        .single();

      let start: Date;
      if (error || !data) {
        // No record – start trial now
        start = new Date();
        await supabase.from("user_trials").insert({ user_id: user.id, trial_start: start.toISOString() });
      } else {
        start = new Date(data.trial_start);
      }

      setTrialStart(start);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      // Length of free trial in days
      const TRIAL_DAYS = 3;
      const left = Math.max(0, TRIAL_DAYS - diff);
      setDaysLeft(left);
      setExpired(left <= 0);
      setLoading(false);
    }

    fetchOrCreateTrial();
  }, [user]);

  return { trialStart, daysLeft, expired, loading };
}
