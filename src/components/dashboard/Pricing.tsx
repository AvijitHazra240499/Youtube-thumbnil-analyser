import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PayPalButton from "./PayPalButton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProStatus } from "@/hooks/useProStatus";
import { useTrial } from "@/contexts/TrialContext";
import TrialCountdown from "@/components/TrialCountdown";

const FEATURES = [
  "Unlimited Thumbnail Analysis",
  "AI Script Generation",
  "Keyword Research Tools",
  "Unlimited Tweet/Instagram Post Generation",
  "Priority Support",
];

export default function Pricing() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { isPro, receiptUrl } = useProStatus(user?.id);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('monthly');
  const { daysLeft, expired, loading: trialLoading } = useTrial();

  if (trialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div>Loading...</div>
      </div>
    );
  }

  const nextBorder = 'ring-2 ring-[#00F0FF] ring-offset-2 ring-offset-gray-900 scale-[1.02]';

  return (
    <>
      <TrialCountdown />
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#181c2b] text-white p-6">
        <Card className="w-full max-w-3xl shadow-2xl bg-[#232943] border border-[#334155] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-4xl font-extrabold text-center mb-1 text-[#00F0FF] drop-shadow">
              Upgrade to Pro
            </CardTitle>
            <p className="text-center text-lg text-[#b0b3c6] mb-2 font-medium">
              One subscription, all features unlocked.
            </p>
            {/* {!isPro && daysLeft <= 3 && daysLeft > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="text-yellow-500" size={20} />
              <p className="text-yellow-500 font-medium">
                Your trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Upgrade now to keep your access!
              </p>
            </div>
          )} */}
            <p className="text-center text-[#7ee8fa] mb-4 text-base mt-4">
              Choose the plan that fits you best:
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8 justify-center mb-10">
              {/* Monthly Plan */}
              <div
                className={`flex-1 rounded-2xl p-8 flex flex-col items-center shadow-lg relative cursor-pointer transition-all duration-300 ${selected === 'monthly'
                    ? nextBorder + ' bg-[#1e2235]'
                    : 'bg-[#232943] hover:bg-[#1e2235]'
                  }`}
                onClick={() => setSelected('monthly')}
              >
                <h3 className="text-xl font-bold mb-2 text-[#b0b3c6]">Monthly</h3>
                <div className="text-5xl font-extrabold mb-2 text-[#00F0FF]">$5</div>
                <div className="text-[#7ee8fa] mb-4">per month</div>
                {!isPro && !expired && (
                  <div className="w-full">
                    <PayPalButton key="monthly" amount="5.00" plan="monthly" onSuccess={() => setShowSuccess(true)} />
                  </div>
                )}
              </div>

              {/* Yearly Plan */}
              <div
                className={`flex-1 rounded-2xl p-8 flex flex-col items-center shadow-xl relative cursor-pointer transition-all duration-300 ${selected === 'yearly'
                    ? nextBorder + ' bg-[#1e2235]'
                    : 'bg-[#232943] hover:bg-[#1e2235]'
                  }`}
                onClick={() => setSelected('yearly')}
              >
                {selected === 'yearly' && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#00F0FF] text-black text-xs font-bold px-4 py-1 rounded-full shadow-lg uppercase tracking-widest">
                    Best Value
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2 text-[#b0b3c6]">Yearly</h3>
                <div className="text-5xl font-extrabold mb-2 text-[#00F0FF]">$39</div>
                <div className="text-[#7ee8fa] mb-4">per year</div>
                {!isPro && !expired && (
                  <div className="w-full">
                    <PayPalButton key="yearly" amount="39.00" plan="yearly" onSuccess={() => setShowSuccess(true)} />
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2 text-center text-[#00F0FF]">All Pro Features</h4>
              <ul className="flex flex-col gap-2 items-center">
                {FEATURES.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-[#b0b3c6]">
                    <CheckCircle className="text-[#00F0FF]" size={18} /> {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center mt-4">
              {expired && !isPro ? (
                <p className="text-yellow-500 font-semibold">
                  Your 5-day free trial has ended. Please upgrade to continue using all features.
                </p>
              ) : (
                <p className="text-[#7ee8fa]">
                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your free trial.
                </p>
              )}
            </div>

            {isPro && (
              <div className="text-center mt-4">
                <span className="px-4 py-2 bg-[#00F0FF] text-black rounded text-lg font-bold">
                  Pro Active
                </span>
                <p className="text-[#00F0FF] font-semibold mb-2 mt-2">
                  Thank you for upgrading! All features are unlocked.
                </p>
                {receiptUrl && (
                  <a href={receiptUrl} target="_blank" rel="noopener" className="text-[#00F0FF] underline">
                    View Receipt
                  </a>
                )}
              </div>
            )}

            {showSuccess && !isPro && (
              <div className="text-[#00F0FF] font-semibold mb-4 text-center">
                Payment successful! You are now Pro.
              </div>
            )}

            <div className="flex justify-center mt-6">
              <Button
                variant="ghost"
                className="text-[#00F0FF] hover:text-[#7ee8fa] hover:bg-[#1e2235]"
                onClick={() => navigate(-1)}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
