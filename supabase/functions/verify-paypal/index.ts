// Supabase Edge Function: verify-paypal
import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(Deno.env.get("SB_URL")!, Deno.env.get("SB_SERVICE_ROLE_KEY")!);

serve(async (req) => {
  const { orderId, userId, plan } = await req.json();

  // 1. Verify with PayPal API
  const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
  const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET");
  const basicAuth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);

  // Get access token
  const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: { "Authorization": `Basic ${basicAuth}", "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // Verify order
  const orderRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}`, {
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  const orderData = await orderRes.json();

  if (orderData.status === "COMPLETED") {
    await supabase.from("subscriptions").insert([
      {
        user_id: userId,
        plan,
        status: "active",
        paypal_order_id: orderId,
        paid_at: new Date().toISOString(),
        receipt_url: orderData.links?.find((l: any) => l.rel === "self")?.href || null,
      },
    ]);
    return new Response(
      JSON.stringify({ success: true, receipt_url: orderData.links?.find((l: any) => l.rel === "self")?.href }),
      { headers: { "Content-Type": "application/json" } }
    );
  } else {
    return new Response(JSON.stringify({ success: false }), { headers: { "Content-Type": "application/json" } });
  }
});
