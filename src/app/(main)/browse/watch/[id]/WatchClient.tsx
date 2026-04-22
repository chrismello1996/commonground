"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { STANCE_OPTIONS } from "@/utils/constants";
import { createClient } from "@/lib/supabase/client";
import DebateChat from "@/components/debate/DebateChat";

interface WatchClientProps {
  debate: {
    id: string;
    topic: string;
    category: string;
    status: string;
    createdAt: string;
  };
  userA: {
    id: string;
    username: string;
    elo: number;
    color: string;
    stance: string;
  };
  userB: {
    id: string;
    username: string;
    elo: number;
    color: string;
    stance: string;
  };
  initialVotesA: number;
  initialVotesB: number;
  initialUserVote: "A" | "B" | null;
  currentUserId: string | null;
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

const getEloRank = (elo: number) =>
  elo >= 1800 ? "text-amber-800" : elo >= 1500 ? "text-gray-500" : "text-orange-700";

export default function WatchClient({
  debate,
  userA,
  userB,
  initialVotesA,
  initialVotesB,
  initialUserVote,
  currentUserId,
}: WatchClientProps) {
  const [votedFor, setVotedFor] = useState<"A" | "B" | null>(initialUserVote);
  const [votesA, setVotesA] = useState(initialVotesA);
  const [votesB, setVotesB] = useState(initialVotesB);
  const [currentTopic, setCurrentTopic] = useState(debate.topic);
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - new Date(debate.createdAt).getTime()) / 1000)
  );
  const supabaseRef = useRef(createClient());

  const categoryConfig = STANCE_OPTIONS[debate.category];
  const stanceLabelA = categoryConfig?.stances.find((s) => s.id === userA.stance)?.label || userA.stance;
  const stanceLabelB = categoryConfig?.stances.find((s) => s.id === userB.stance)?.label || userB.stance;

  useEffect(() => {
    if (debate.status !== "active") return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [debate.status]);

  // Listen for topic changes in real time
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`watch-topic-${debate.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "debates", filter: `id=eq.${debate.id}` },
        (payload) => {
          if (payload.new.topic) {
            setCurrentTopic(payload.new.topic);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [debate.id]);

  const handleVote = async (side: "A" | "B") => {
    if (votedFor || !currentUserId) return;
    setVotedFor(side);
    if (side === "A") setVotesA((v) => v + 1);
    else setVotesB((v) => v + 1);

    try {
      await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debate_id: debate.id,
          voted_for: side === "A" ? userA.id : userB.id,
        }),
      });
    } catch {
      // Revert on error
      setVotedFor(null);
      if (side === "A") setVotesA((v) => v - 1);
      else setVotesB((v) => v - 1);
    }
  };

  const totalVotes = votesA + votesB;
  const pctA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;

  const isEnded = debate.status !== "active";

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Back button + stream info */}
        <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-3">
          <Link href="/browse" className="text-gray-400 hover:text-gray-600 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{currentTopic || "No topic set yet"}</p>
            <p className="text-[11px] text-gray-500">
              {categoryConfig?.label || debate.category}
              {stanceLabelA !== "unknown" && stanceLabelB !== "unknown" && (
                <span> — {stanceLabelA} vs {stanceLabelB}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEnded ? (
              <span className="bg-gray-400 text-white text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wide">
                ENDED
              </span>
            ) : (
              <span className="bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wide animate-pulse">
                LIVE
              </span>
            )}
            <span className="text-[11px] text-gray-500 font-mono">{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Video Feed */}
        <div className="flex-1 flex gap-0.5 bg-gray-100 p-1">
          {/* Debater A */}
          <div className="flex-1 relative rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold text-white"
                style={{ background: userA.color }}
              >
                {userA.username[0].toUpperCase()}
              </div>
              <Link href={`/profile/${userA.username}`} className="text-sm font-bold text-gray-700 hover:underline hover:text-emerald-600 transition">{userA.username}</Link>
            </div>
            <Link href={`/profile/${userA.username}`} className="absolute bottom-3 left-3 bg-black/70 text-white px-2.5 py-1 rounded-md hover:bg-black/80 transition">
              <p className="text-xs font-bold">{userA.username}</p>
              <p className={`text-[10px] font-semibold ${getEloRank(userA.elo)}`}>{userA.elo} ELO</p>
            </Link>
            {stanceLabelA !== "unknown" && (
              <div
                className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold text-white"
                style={{ background: userA.color }}
              >
                {stanceLabelA}
              </div>
            )}
          </div>
          {/* VS divider */}
          <div className="flex items-center justify-center w-10 text-emerald-500 font-black text-sm">
            VS
          </div>
          {/* Debater B */}
          <div className="flex-1 relative rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold text-white"
                style={{ background: userB.color }}
              >
                {userB.username[0].toUpperCase()}
              </div>
              <Link href={`/profile/${userB.username}`} className="text-sm font-bold text-gray-700 hover:underline hover:text-emerald-600 transition">{userB.username}</Link>
            </div>
            <Link href={`/profile/${userB.username}`} className="absolute bottom-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-md text-right hover:bg-black/80 transition">
              <p className="text-xs font-bold">{userB.username}</p>
              <p className={`text-[10px] font-semibold ${getEloRank(userB.elo)}`}>{userB.elo} ELO</p>
            </Link>
            {stanceLabelB !== "unknown" && (
              <div
                className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold text-white"
                style={{ background: userB.color }}
              >
                {stanceLabelB}
              </div>
            )}
          </div>
        </div>

        {/* Vote Bar + Buttons */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          {/* Vote bar */}
          <div className="flex h-6 rounded-full overflow-hidden mb-3 bg-gray-200">
            <div
              className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
              style={{ width: `${pctA}%` }}
            >
              {pctA}%
            </div>
            <div
              className="bg-amber-800 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
              style={{ width: `${pctB}%` }}
            >
              {pctB}%
            </div>
          </div>
          {/* Vote buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleVote("A")}
              disabled={votedFor !== null || !currentUserId}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${
                votedFor === "A"
                  ? "bg-emerald-500 text-white"
                  : votedFor === "B"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30"
              }`}
            >
              Vote {userA.username}
            </button>
            <button
              onClick={() => handleVote("B")}
              disabled={votedFor !== null || !currentUserId}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${
                votedFor === "B"
                  ? "bg-amber-800 text-white"
                  : votedFor === "A"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-amber-800/10 text-amber-800 hover:bg-amber-800/20 border border-amber-800/30"
              }`}
            >
              Vote {userB.username}
            </button>
          </div>
          {!currentUserId && (
            <p className="text-[10px] text-gray-400 text-center mt-2">
              <Link href="/login" className="text-emerald-500 hover:underline">Sign in</Link> to vote
            </p>
          )}
          {totalVotes > 0 && (
            <p className="text-[10px] text-gray-400 text-center mt-1">
              {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      {currentUserId ? (
        <DebateChat
          debateId={debate.id}
          currentUserId={currentUserId}
          currentUsername="Spectator"
          userAId={userA.id}
          userAUsername={userA.username}
          userBUsername={userB.username}
          isActive={!isEnded}
          userAColor={userA.color}
          userBColor={userB.color}
          userAElo={userA.elo}
          userBElo={userB.elo}
          onReaction={() => {}}
        />
      ) : (
        <div className="hidden lg:flex w-[320px] border-l border-gray-200 flex-col bg-gray-50 items-center justify-center">
          <p className="text-xs text-gray-400 mb-2">Sign in to chat</p>
          <Link href="/login" className="text-emerald-500 text-xs font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
