import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useProStatus(userId: string | null) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("subscriptions")
      .select("status,receipt_url")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("paid_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setIsPro(!!data && data.length > 0);
        setReceiptUrl(data && data[0]?.receipt_url || null);
        setLoading(false);
      });
  }, [userId]);

  return { isPro, loading, receiptUrl };
}
