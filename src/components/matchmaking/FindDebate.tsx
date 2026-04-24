"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FindDebateProps {
  userId: string;
  username: string;
  elo: number;
  userStances: Record<string, string>;
}

type MatchState = "joining" | "queued" | "matched" | "error";

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

export default function FindDebate({ userId, username, elo }: FindDebateProps) {
  const router = useRouter();
  const [state, setState] = useState<MatchState>("joining");
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoined = useRef(false);

  // Clean up polling AND leave queue on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      // Remove from queue when navigating away
      fetch("/api/matchmaking/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    };
  }, [userId]);

  // Auto-join queue on mount
  useEffect(() => {
    if (hasJoined.current) return;
    hasJoined.current = true;
    startSearching();
  }, []);

  const startSearching = useCallback(async () => {
    setError(null);
    setSearchTime(0);
    setState("joining");

    try {
      const res = await fetch("/api/matchmaking/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, category: "anything" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join queue");
        setState("error");
        return;
      }

      if (data.status === "matched") {
        setState("matched");
        setMatchData(data);
        setTimeout(() => router.push(`/debate/${data.debateId}`), 3000);
        return;
      }

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
            setState("error");
            setError("Queue timed out. Try again!");
          }
        } catch {
          // Silently retry
        }
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
      setState("error");
    }
  }, [router]);

  const cancelSearch = useCallback(async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      await fetch("/api/matchmaking/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch {
      // Best effort
    }

    router.push("/");
  }, [router, userId]);

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

  // Error screen
  if (state === "error") {
    return (
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-red-400 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={startSearching}
            className="px-6 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Searching / queued screen (default view on mount)
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
          <p className="text-gray-400">Matching you with someone who disagrees</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-4xl font-mono text-white mb-2">{formatTime(searchTime)}</p>
          <p className="text-gray-500 text-sm">Hang tight — scanning for opponents…</p>
        </div>

        <button
          onClick={cancelSearch}
          className="px-6 py-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
