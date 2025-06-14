import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface PayPalButtonProps {
  amount: string; // in USD, e.g. "5.00" or "39.00"
  plan: "monthly" | "yearly";
  onSuccess: () => void;
}

// Replace with your real PayPal client ID in production
const PAYPAL_CLIENT_ID = "sb"; // "sb" is for sandbox/demo

// Singleton for PayPal SDK
let paypalSDKPromise: Promise<void> | null = null;
let paypalButtonInstance: any = null;

const loadPayPalSDK = () => {
  if (paypalSDKPromise) return paypalSDKPromise;

  paypalSDKPromise = new Promise((resolve) => {
    if ((window as any).paypal) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });

  return paypalSDKPromise;
};

export default function PayPalButton({ amount, plan, onSuccess }: PayPalButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const user = useCurrentUser();
  const buttonRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const initializePayPal = async () => {
      try {
        // Load PayPal SDK
        await loadPayPalSDK();
        if (!mounted || !ref.current) return;

        // Cleanup previous button instance if it exists
        if (buttonRef.current) {
          try {
            buttonRef.current.close();
          } catch (err) {
            console.error("Error closing previous button:", err);
          }
          buttonRef.current = null;
        }

        // Clear container
        if (ref.current) {
          ref.current.innerHTML = '';
        }

        // Create new button instance
        const button = (window as any).paypal.Buttons({
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
            try {
              const details = await actions.order.capture();
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
                throw new Error("Payment verification failed");
              }
            } catch (err) {
              console.error("Payment processing error:", err);
              alert("Payment verification failed. Please contact support.");
            }
          },
          onError: function (err: any) {
            console.error("PayPal Error:", err);
            alert("Payment failed. Please try again.");
          },
        });

        // Store button instance
        buttonRef.current = button;

        // Render button
        if (ref.current) {
          await button.render(ref.current);
        }
      } catch (err) {
        console.error("PayPal initialization error:", err);
      }
    };

    initializePayPal();

    // Cleanup function
    return () => {
      mounted = false;
      if (buttonRef.current) {
        try {
          buttonRef.current.close();
        } catch (err) {
          console.error("Error closing button during cleanup:", err);
        }
        buttonRef.current = null;
      }
      if (ref.current) {
        ref.current.innerHTML = '';
      }
    };
  }, []); // Re-initialize when these values change

  return <div ref={ref} className="w-full min-h-[40px]"></div>;
}
