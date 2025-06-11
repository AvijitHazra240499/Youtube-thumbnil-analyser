// Supabase Edge Function: trial-status
import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(Deno.env.get("SB_URL")!, Deno.env.get("SB_SERVICE_ROLE_KEY")!);

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

serve(async (req) => {
  // Expects { userId }
  const { userId } = await req.json();
  if (!userId) return new Response(JSON.stringify({ error: "No userId" }), { status: 400 });

  // Fetch trial_start and subscription
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("trial_start")
    .eq("id", userId)
    .single();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  let trialStart = user.trial_start ? new Date(user.trial_start) : null;
  if (!trialStart) {
    trialStart = new Date();
    await supabase.from("users").update({ trial_start: trialStart.toISOString() }).eq("id", userId);
  }
  const now = new Date("2025-06-11T02:25:58Z");
  const daysLeft = Math.max(0, 5 - daysBetween(trialStart, now));
  const expired = daysLeft <= 0;

  // Check subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  const isPro = !!sub;

  return new Response(
    JSON.stringify({ daysLeft, expired, isPro, trialStart: trialStart.toISOString() }),
    { headers: { "Content-Type": "application/json" } }
  );
});
