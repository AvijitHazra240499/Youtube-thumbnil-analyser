import { createClient } from "@supabase/supabase-js";

// Use provided credentials as fallback if env vars are not available
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://kmqgodsilmsffnbjdgqo.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcWdvZHNpbG1zZmZuYmpkZ3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NjA1MjYsImV4cCI6MjA2NTEzNjUyNn0.--hicy9RpFKuTjxAyp7-THgoBPHzkkwFoqdezJJFvWU";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
