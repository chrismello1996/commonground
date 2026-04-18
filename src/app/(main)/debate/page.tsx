"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type QueueStatus = "joining" | "searching" | "matched" | "error";

const SEARCH_MESSAGES = [
  "Looking for an opponent…",
  "Matching you with opposing views…",
  "Scanning the queue…",
  "Finding someone who disagrees…",
  "Almost there…",
];

export default function DebateLobbyPage() {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<QueueStatus>("joining");
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const hasJoined = useRef(false);

  // Auto-join queue on mount
  useEffect(() => {
    async function autoJoin() {
      if (hasJoined.current) return;
      hasJoined.current = true;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      try {
        const res = await fetch("/api/matchmaking/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            category: "anything",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to join queue");
          setStatus("error");
          return;
        }

        if (data.matched && data.debateId) {
          setStatus("matched");
          setTimeout(() => router.push(`/debate/${data.debateId}`), 1500);
        } else {
          setStatus("searching");
        }
      } catch {
        setError("Network error. Please try again.");
        setStatus("error");
      }
    }
    autoJoin();
  }, []);

  // Search timer & message rotation
  useEffect(() => {
    if (status !== "searching") return;
    const timer = setInterval(() => {
      setSearchTime((t) => t + 1);
    }, 1000);
    const msgTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % SEARCH_MESSAGES.length);
    }, 3000);
    return () => {
      clearInterval(timer);
      clearInterval(msgTimer);
    };
  }, [status]);

  // Poll for match while searching
  useEffect(() => {
    if (status !== "searching" || !userId) return;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/matchmaking/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (data.matched && data.debateId) {
          setStatus("matched");
          clearInterval(pollInterval);
          setTimeout(() => {
            router.push(`/debate/${data.debateId}`);
          }, 1500);
        }
      } catch {
        // Silent retry on poll failure
      }
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [status, userId]);

  const retryQueue = useCallback(async () => {
    if (!userId) return;
    setStatus("joining");
    setError(null);
    setSearchTime(0);
    setMessageIndex(0);

    try {
      const res = await fetch("/api/matchmaking/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          category: "anything",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join queue");
        setStatus("error");
        return;
      }

      if (data.matched && data.debateId) {
        setStatus("matched");
        setTimeout(() => router.push(`/debate/${data.debateId}`), 1500);
      } else {
        setStatus("searching");
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }, [userId]);

  const leaveQueue = useCallback(async () => {
    if (!userId) return;
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
  }, [userId, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Minimal Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-gray-50/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="28" height="22" viewBox="0 0 36 28" fill="none">
              <rect x="0" y="2" width="20" height="16" rx="4" fill="#10b981" />
              <polygon points="6,18 10,18 8,22" fill="#10b981" />
              <rect x="14" y="6" width="20" height="16" rx="4" fill="#8B4513" />
              <polygon points="26,22 30,22 28,26" fill="#8B4513" />
            </svg>
            <span className="font-brand text-lg text-brand-gradient">CommonGround</span>
          </Link>
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* ERROR STATE */}
        {status === "error" && (
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-red-500 mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={retryQueue}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-all"
              >
                Go Home
              </Link>
            </div>
          </div>
        )}

        {/* SEARCHING STATE — Animated queue */}
        {(status === "searching" || status === "joining") && (
          <div className="flex flex-col items-center text-center">
            {/* Animated ring */}
            <div className="relative w-28 h-28 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
              <div
                className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"
                style={{ animationDuration: "1s" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
              Finding Your Opponent
            </h2>
            <p className="text-sm text-gray-500 mb-4 h-5 transition-all">
              {SEARCH_MESSAGES[messageIndex]}
            </p>

            {/* Timer */}
            <div className="bg-gray-50 border border-gray-200 rounded-full px-5 py-2 mb-8">
              <span className="text-sm font-mono font-bold text-gray-600">
                {formatTime(searchTime)}
              </span>
            </div>

            {/* Bouncing dots */}
            <div className="flex gap-1.5 mb-8">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  style={{
                    animation: "bounce 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>

            <button
              onClick={leaveQueue}
              className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-red-300 hover:text-red-500 transition-all"
            >
              Cancel
            </button>
          </div>
        )}

        {/* MATCHED STATE */}
        {status === "matched" && (
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              Opponent Found!
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Entering debate room…
            </p>
            <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  animation: "fillBar 1.5s ease-out forwards",
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Inline keyframe styles */}
      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes fillBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
