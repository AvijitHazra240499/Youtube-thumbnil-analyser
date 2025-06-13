import { useTrial } from "@/contexts/TrialContext";

export default function TrialCountdown() {
  const { daysLeft, minutesLeft, expired, loading, testMode } = useTrial();

  if (loading || expired) return null;

  const timeMsg = testMode
    ? `${minutesLeft ?? 0} minute${minutesLeft === 1 ? "" : "s"} left in your trial`
    : `${daysLeft ?? 0} day${daysLeft === 1 ? "" : "s"} left in your free trial`;

  return (
    <div className="bg-yellow-400 text-black text-center py-1 text-sm font-semibold">
      {timeMsg}
    </div>
  );
}
