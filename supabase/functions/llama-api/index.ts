// Supabase Edge Function: llama-api
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(Deno.env.get("SB_URL")!, Deno.env.get("SB_SERVICE_ROLE_KEY")!);
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

serve((_req) => {
  return new Response(
    JSON.stringify({ status: "ok", message: "Llama Edge Function is running!" }),
    { headers: { "Content-Type": "application/json" } }
  );
});
