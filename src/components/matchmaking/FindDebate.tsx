"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { STANCE_OPTIONS } from "@/utils/constants";
import Link from "next/link";

interface FindDebateProps {
  userId: string;
  username: string;
  elo: number;
  userStances: Record<string, string>;
}

type MatchState = "idle" | "queued" | "matched";

interface MatchData {
  debateId: string;
  topic: string;
  opponent: {
    userId: string;
    username: string;
    stance: string;
    elo: number;
  };
}

export default function FindDebate({ username, elo, userStances }: FindDebateProps) {
  const router = useRouter();
  const [state, setState] = useState<MatchState>("idle");
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stanceCount = Object.keys(userStances).length;

  // Get stance labels for display
  const stanceLabels = Object.entries(userStances).map(([cat, stanceId]) => {
    const stanceInfo = STANCE_OPTIONS[cat]?.stances.find(s => s.id === stanceId);
    return {
      category: STANCE_OPTIONS[cat]?.label || cat,
      stance: stanceInfo?.label || stanceId,
      icon: STANCE_OPTIONS[cat]?.icon || "🗣️",
    };
  });

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startSearching = useCallback(async () => {
    setError(null);
    setSearchTime(0);

    try {
      const res = await fetch("/api/matchmaking/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "anything" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join queue");
        return;
      }

      if (data.status === "matched") {
        setState("matched");
        setMatchData(data);
        setTimeout(() => router.push(`/debate/${data.debateId}`), 3000);
        return;
      }

      // Queued — start polling
      setState("queued");

      timerRef.current = setInterval(() => {
        setSearchTime((t) => t + 1);
      }, 1000);

      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch("/api/matchmaking/status");
          const statusData = await statusRes.json();

          if (statusData.status === "matched") {
            if (pollRef.current) clearInterval(pollRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
            setState("matched");
            setMatchData(statusData);
            setTimeout(() => router.push(`/debate/${statusData.debateId}`), 3000);
          } else if (statusData.status === "idle") {
            if (pollRef.current) clearInterval(pollRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
            setState("idle");
            setError("Queue timed out. Try again!");
          }
        } catch {
          // Silently retry on network errors
        }
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
    }
  }, [router]);

  const cancelSearch = useCallback(async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      await fetch("/api/matchmaking/leave", { method: "POST" });
    } catch {
      // Best effort
    }

    setState("idle");
    setSearchTime(0);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Matched screen
  if (state === "matched" && matchData) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center space-y-8">
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Opponent Found!</h1>
            <p className="text-gray-400">Get ready to debate</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg font-bold text-emerald-400">
                    {username[0]?.toUpperCase()}
                  </span>
                </div>
                <p className="text-white font-medium">{username}</p>
                <p className="text-xs text-gray-500">{elo} ELO</p>
              </div>
              <div className="text-2xl font-black text-gray-600">VS</div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg font-bold text-red-400">
                    {matchData.opponent.username[0]?.toUpperCase()}
                  </span>
                </div>
                <p className="text-white font-medium">{matchData.opponent.username}</p>
                <p className="text-xs text-gray-500">{matchData.opponent.elo} ELO</p>
                <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  {matchData.opponent.stance}
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Debate Topic</p>
              <p className="text-white font-medium">{matchData.topic}</p>
            </div>
          </div>

          <p className="text-gray-500 text-sm animate-pulse">Entering debate room...</p>
        </div>
      </div>
    );
  }

  // Searching / queued screen
  if (state === "queued") {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center space-y-8">
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-gray-800 border-t-emerald-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Finding Opponent...</h1>
            <p className="text-gray-400">
              Matching based on your {stanceCount} stance{stanceCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-4xl font-mono text-white mb-2">{formatTime(searchTime)}</p>
            <p className="text-gray-500 text-sm">Matching you with someone who disagrees...</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">
              The best debates happen when you listen first, then respond.
              Try to understand your opponent&apos;s position before countering.
            </p>
          </div>

          <button
            onClick={cancelSearch}
            className="px-6 py-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all font-medium"
          >
            Cancel Search
          </button>
        </div>
      </div>
    );
  }

  // Idle — ready to search (no category selection)
  return (
    <div className="max-w-md mx-auto px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">Find a Debate</h1>
        <p className="text-gray-400 text-lg">
          Get matched with someone who thinks differently
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Stances summary */}
      {stanceCount > 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Stances</h3>
            <Link href="/stances" className="text-[11px] text-emerald-400 font-medium hover:underline">
              Edit
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {stanceLabels.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5"
              >
                <span className="text-sm">{s.icon}</span>
                <span className="text-xs font-semibold text-white">{s.stance}</span>
                <span className="text-[10px] text-gray-500">{s.category}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 mb-6 text-center">
          <p className="text-sm text-amber-400 font-medium mb-2">No stances set yet</p>
          <p className="text-xs text-amber-400/70 mb-3">
            Pick your positions so we can match you with someone who disagrees.
          </p>
          <Link
            href="/stances"
            className="inline-block px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition"
          >
            Set Your Stances
          </Link>
        </div>
      )}

      <button
        onClick={startSearching}
        disabled={stanceCount === 0}
        className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
      >
        {stanceCount === 0 ? "Set stances to start debating" : "Start Searching"}
      </button>
    </div>
  );
}
