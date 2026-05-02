"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ChallengeButton from "@/components/challenges/ChallengeButton";
import { DEBATE_FORMATS } from "@/utils/constants";

interface UserResult {
  id: string;
  username: string;
  display_name: string | null;
  elo: number;
}

interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  status: string;
  message: string | null;
  format: string | null;
  expires_at: string;
  created_at: string;
  challenger: { username: string; elo: number };
  challenged: { username: string; elo: number };
}

export default function ChallengePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("unstructured");
  const [pending, setPending] = useState<{ incoming: Challenge[]; outgoing: Challenge[] }>({
    incoming: [],
    outgoing: [],
  });

  // Fetch pending challenges
  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/challenges");
      if (res.ok) {
        const data = await res.json();
        setPending({ incoming: data.incoming || [], outgoing: data.outgoing || [] });
      }
    } catch { /* polling — silently ignore network errors */ }
  }, []);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 5000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  // Search users
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.users || []);
        }
      } catch { /* search — silently ignore network errors */ }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const getEloRank = (elo: number) =>
    elo >= 1600 ? "gold" : elo >= 1400 ? "silver" : "bronze";

  const getEloClass = (rank: string) =>
    rank === "gold"
      ? "bg-amber-800/10 text-amber-800"
      : rank === "silver"
        ? "bg-gray-500/10 text-gray-500"
        : "bg-orange-700/10 text-orange-700";

  const timeLeft = (expiresAt: string) => {
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatList = Object.values(DEBATE_FORMATS);
  const getFormatInfo = (formatId: string | null) =>
    formatList.find((f) => f.id === (formatId || "unstructured")) || formatList[0];

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-1">Challenge a Debater</h1>
      <p className="text-sm text-gray-400 mb-6">Search for a user and challenge them to a live debate</p>

      {/* Search */}
      <div className="relative mb-6">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search by username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
            autoFocus
          />
          {searching && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Debate Format Selector */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Debate Format</h3>
        <div className="grid grid-cols-2 gap-2">
          {formatList.map((fmt) => {
            const isSelected = selectedFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className="text-left p-3 rounded-xl border transition-all"
                style={{
                  background: isSelected ? `${fmt.color}08` : "#fafafa",
                  borderColor: isSelected ? `${fmt.color}40` : "#e5e7eb",
                  boxShadow: isSelected ? `0 0 0 1px ${fmt.color}20` : "none",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{fmt.icon}</span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: isSelected ? fmt.color : "#374151" }}
                  >
                    {fmt.label}
                  </span>
                </div>
                <p className="text-[11px] leading-snug text-gray-400">{fmt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Results</h3>
          <div className="flex flex-col gap-2">
            {results.map((user) => {
              const rank = getEloRank(user.elo);
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {(user.display_name || user.username)[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/profile/${user.username}`}
                      className="text-sm font-semibold text-gray-800 hover:text-emerald-600 transition"
                    >
                      {user.display_name || user.username}
                    </Link>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      @{user.username}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getEloClass(rank)}`}>
                        {user.elo}
                      </span>
                    </p>
                  </div>
                  <ChallengeButton
                    targetUserId={user.id}
                    targetUsername={user.username}
                    format={selectedFormat}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !searching && (
        <p className="text-sm text-gray-400 text-center py-4 mb-8">No users found for &quot;{query}&quot;</p>
      )}

      {/* Pending Challenges */}
      {(pending.incoming.length > 0 || pending.outgoing.length > 0) && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pending Challenges</h3>

          {pending.incoming.map((c) => {
            const fmt = getFormatInfo(c.format);
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {c.challenger.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {c.challenger.username} <span className="text-gray-400 font-normal text-xs">challenged you</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: `${fmt.color}15`,
                        color: fmt.color,
                      }}
                    >
                      {fmt.icon} {fmt.label}
                    </span>
                    <span className="text-[10px] text-gray-400">expires in {timeLeft(c.expires_at)}</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={async () => {
                      const res = await fetch("/api/challenges/respond", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ challengeId: c.id, action: "accept" }),
                      });
                      const data = await res.json();
                      if (data.debateId) window.location.href = `/debate/${data.debateId}`;
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={async () => {
                      await fetch("/api/challenges/respond", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ challengeId: c.id, action: "decline" }),
                      });
                      fetchPending();
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-md bg-white text-gray-600 hover:bg-gray-100 transition border border-gray-200"
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}

          {pending.outgoing.map((c) => {
            const fmt = getFormatInfo(c.format);
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {c.challenged.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    Sent to <span className="text-emerald-600">{c.challenged.username}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: `${fmt.color}15`,
                        color: fmt.color,
                      }}
                    >
                      {fmt.icon} {fmt.label}
                    </span>
                    <span className="text-[10px] text-gray-400">waiting... · expires in {timeLeft(c.expires_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state when no search */}
      {query.length < 2 && pending.incoming.length === 0 && pending.outgoing.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-1">Search for a user above to challenge them</p>
          <p className="text-xs text-gray-400">Or visit their profile and hit the Challenge button</p>
        </div>
      )}
    </div>
  );
}
