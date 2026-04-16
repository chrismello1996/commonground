"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_TAGS, STANCE_OPTIONS } from "@/utils/constants";

interface FindDebateProps {
  userId: string;
  username: string;
  elo: number;
  userStances: Record<string, string>;
}

type MatchState = "idle" | "selecting" | "queued" | "matched";

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
  const [state, setState] = useState<MatchState>("selecting");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startSearching = useCallback(async (category: string) => {
    setError(null);
    setSelectedCategory(category);
    setSearchTime(0);

    try {
      const res = await fetch("/api/matchmaking/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join queue");
        return;
      }

      if (data.status === "matched") {
        // Instant match!
        setState("matched");
        setMatchData(data);
        setTimeout(() => router.push(`/debate/${data.debateId}`), 3000);
        return;
      }

      // Queued — start polling
      setState("queued");

      // Start search timer
      timerRef.current = setInterval(() => {
        setSearchTime((t) => t + 1);
      }, 1000);

      // Poll for match every 2 seconds
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
            // Queue expired
            if (pollRef.current) clearInterval(pollRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
            setState("selecting");
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

    setState("selecting");
    setSelectedCategory(null);
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
          {/* Match found animation */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center animate-pulse">
              <span className="text-4xl">⚔️</span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Opponent Found!</h1>
            <p className="text-gray-400">Get ready to debate</p>
          </div>

          {/* Match details */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              {/* You */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg font-bold text-emerald-400">
                    {username[0]?.toUpperCase()}
                  </span>
                </div>
                <p className="text-white font-medium">{username}</p>
                <p className="text-xs text-gray-500">{elo} ELO</p>
                {selectedCategory && selectedCategory !== "anything" && userStances[selectedCategory] && (
                  <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {userStances[selectedCategory]}
                  </span>
                )}
              </div>

              {/* VS */}
              <div className="text-2xl font-black text-gray-600">VS</div>

              {/* Opponent */}
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

            {/* Topic */}
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
          {/* Searching animation */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-gray-800 border-t-emerald-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Finding Opponent...</h1>
            <p className="text-gray-400">
              Searching in{" "}
              <span className="text-emerald-400 font-medium">
                {CATEGORY_TAGS.find((c) => c.id === selectedCategory)?.label || selectedCategory}
              </span>
            </p>
            {selectedCategory && selectedCategory !== "anything" && userStances[selectedCategory] && (
              <p className="text-gray-500 text-sm mt-1">
                Your stance: <span className="text-white">{userStances[selectedCategory]}</span>
              </p>
            )}
          </div>

          {/* Timer */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-4xl font-mono text-white mb-2">{formatTime(searchTime)}</p>
            <p className="text-gray-500 text-sm">Matching you with someone who disagrees...</p>
          </div>

          {/* Tips while waiting */}
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">
              💡 <span className="text-gray-300">Tip:</span> The best debates happen when you listen first, then respond.
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

  // Category selection screen (idle / selecting)
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">Find a Debate</h1>
        <p className="text-gray-400 text-lg">
          Pick a category and get matched with someone who thinks differently
        </p>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {CATEGORY_TAGS.map((cat) => {
          const hasStance = cat.id === "anything" || !!userStances[cat.id];
          const stanceLabel = cat.id !== "anything" && userStances[cat.id]
            ? STANCE_OPTIONS[cat.id]?.stances.find((s) => s.id === userStances[cat.id])?.label
            : null;

          return (
            <button
              key={cat.id}
              onClick={() => hasStance ? startSearching(cat.id) : setError(`Pick a stance for ${cat.label} first → /stances`)}
              className={`relative group p-6 rounded-xl border transition-all text-left ${
                hasStance
                  ? "bg-gray-900 border-gray-800 hover:border-emerald-500/50 hover:bg-gray-900/80 cursor-pointer"
                  : "bg-gray-900/50 border-gray-800/50 opacity-60 cursor-not-allowed"
              }`}
            >
              <span className="text-3xl block mb-3">{cat.icon}</span>
              <h3 className="text-white font-semibold mb-1">{cat.label}</h3>
              {stanceLabel ? (
                <p className="text-xs text-emerald-400">{stanceLabel}</p>
              ) : cat.id === "anything" ? (
                <p className="text-xs text-gray-500">Match anyone</p>
              ) : (
                <p className="text-xs text-gray-600">No stance set</p>
              )}

              {/* Hover arrow */}
              {hasStance && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">
                  →
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info section */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-3">How Matchmaking Works</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p>
              <span className="text-emerald-400 font-medium">1.</span> Pick a category you want to debate
            </p>
            <p>
              <span className="text-emerald-400 font-medium">2.</span> We match you with someone who has an opposing stance
            </p>
            <p>
              <span className="text-emerald-400 font-medium">3.</span> Both debaters get a topic and enter the room
            </p>
            <p>
              <span className="text-emerald-400 font-medium">4.</span> Debate live — viewers vote on who&apos;s winning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
