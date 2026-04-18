"use client";

import { useState } from "react";

interface ReportButtonProps {
  reportedUserId: string;
  reportedUsername: string;
  debateId?: string;
}

export default function ReportButton({
  reportedUserId,
  reportedUsername,
  debateId,
}: ReportButtonProps) {
  const [status, setStatus] = useState<"idle" | "confirming" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleReport = async () => {
    if (status === "idle") {
      setStatus("confirming");
      return;
    }

    if (status === "confirming") {
      setStatus("sending");
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reported_user_id: reportedUserId,
            debate_id: debateId || null,
            reason: "nudity",
          }),
        });

        if (res.status === 409) {
          setErrorMsg("Already reported");
          setStatus("error");
          setTimeout(() => setStatus("idle"), 2000);
          return;
        }

        if (!res.ok) {
          const data = await res.json();
          setErrorMsg(data.error || "Failed to report");
          setStatus("error");
          setTimeout(() => setStatus("idle"), 2000);
          return;
        }

        setStatus("sent");
        setTimeout(() => setStatus("idle"), 3000);
      } catch {
        setErrorMsg("Network error");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }
    }
  };

  const handleCancel = () => {
    setStatus("idle");
  };

  if (status === "sent") {
    return (
      <span className="px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-medium">
        Reported ✓
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="px-3 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-xs sm:text-sm font-medium">
        {errorMsg}
      </span>
    );
  }

  if (status === "confirming") {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleReport}
          className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Report {reportedUsername}?
        </button>
        <button
          onClick={handleCancel}
          className="px-2 py-2 rounded-lg bg-gray-800 text-gray-400 text-xs font-medium hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleReport}
      disabled={status === "sending"}
      className="px-3 sm:px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50"
      title={`Report ${reportedUsername}`}
    >
      {status === "sending" ? (
        "Sending..."
      ) : (
        <>
          <span className="hidden sm:inline">Report </span>🚩
        </>
      )}
    </button>
  );
}
