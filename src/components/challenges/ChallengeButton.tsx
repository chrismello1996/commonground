"use client";

import { useState } from "react";

interface ChallengeButtonProps {
  targetUserId: string;
  targetUsername: string;
  format?: string;
}

export default function ChallengeButton({ targetUserId, targetUsername, format }: ChallengeButtonProps) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const sendChallenge = async () => {
    setState("sending");
    setError("");

    try {
      const res = await fetch("/api/challenges/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengedId: targetUserId,
          format: format || "open_mic",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send");
        setState("error");
        setTimeout(() => setState("idle"), 3000);
        return;
      }

      setState("sent");
      setTimeout(() => setState("idle"), 10000);
    } catch {
      setError("Network error");
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  if (state === "sent") {
    return (
      <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">
        Challenge sent!
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="px-3 py-1.5 bg-red-50 text-red-500 rounded-md text-xs font-bold">
        {error}
      </div>
    );
  }

  return (
    <button
      onClick={sendChallenge}
      disabled={state === "sending"}
      className="px-3 py-1.5 bg-amber-800 text-white rounded-md text-xs font-bold hover:bg-amber-900 transition disabled:opacity-50 flex items-center gap-1"
      title={`Challenge ${targetUsername} to a debate`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      {state === "sending" ? "Sending..." : "Challenge"}
    </button>
  );
}
