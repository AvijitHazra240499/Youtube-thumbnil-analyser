import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface PayPalButtonProps {
  amount: string; // in USD, e.g. "5.00" or "39.00"
  plan: "monthly" | "yearly";
  onSuccess: () => void;
}

// Replace with your real PayPal client ID in production
const PAYPAL_CLIENT_ID = "sb"; // "sb" is for sandbox/demo

export default function PayPalButton({ amount, plan, onSuccess }: PayPalButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const user = useCurrentUser();

  useEffect(() => {
    if (!(window as any).paypal) {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
      script.async = true;
      script.onload = renderButton;
      document.body.appendChild(script);
      return;
    }
    renderButton();
    // eslint-disable-next-line
  }, []);

  function renderButton() {
    (window as any).paypal.Buttons({
      style: {
        color: "blue",
        shape: "pill",
        label: "pay",
        height: 40,
      },
      createOrder: function (_: any, actions: any) {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: amount,
              },
              description: plan === "monthly" ? "Pro Monthly Subscription" : "Pro Yearly Subscription",
            },
          ],
        });
      },
      onApprove: async function (data: any, actions: any) {
        const details = await actions.order.capture();
        // Call backend to verify and activate Pro
        const res = await fetch("/api/verify-paypal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: data.orderID,
            userId: user?.id,
            plan,
          }),
        });
        const result = await res.json();
        if (result.success) {
          onSuccess();
        } else {
          alert("Payment verification failed. Please contact support.");
        }
      },
      onError: function (err: any) {
        alert("Payment failed: " + err);
      },
    }).render(ref.current);
  }

  return <div ref={ref}></div>;
}
