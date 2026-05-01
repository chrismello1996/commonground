"use client";

import { useState } from "react";
import Link from "next/link";
import TrendingTopics from "./TrendingTopics";

interface TopicStat {
  topic: string;
  category: string;
  categoryLabel: string;
  count: number;
}

interface DebateCard {
  id: string;
  topic: string;
  category: string;
  categoryLabel: string;
  createdAt: string;
  userA: { username: string; color: string };
  userB: { username: string; color: string };
  votesA: number;
  votesB: number;
}

interface BrowseClientProps {
  debates: DebateCard[];
  trendingTopics: TopicStat[];
  allTimeTopics: TopicStat[];
}

export default function BrowseClient({ debates, trendingTopics, allTimeTopics }: BrowseClientProps) {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  // Filter debates by selected topic
  const filteredDebates = activeTopic
    ? debates.filter((d) => d.topic.toLowerCase().trim() === activeTopic.toLowerCase().trim())
    : debates;

  const formatTime = (createdAt: string) => {
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const s = (elapsed % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <>
    <div className="flex-1 overflow-y-auto px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold">
          {activeTopic ? "Filtered Debates" : "Live Debates"}
        </h2>
        <span className="text-xs text-gray-400 font-medium">
          {filteredDebates.length} {activeTopic ? "match" : "live now"}{filteredDebates.length !== 1 ? (activeTopic ? "es" : "") : ""}
        </span>
      </div>

      {/* Stream Grid */}
      {filteredDebates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredDebates.map((debate) => {
            const totalVotes = debate.votesA + debate.votesB;
            const pctA = totalVotes > 0 ? Math.round((debate.votesA / totalVotes) * 100) : 50;

            return (
              <Link
                href={`/browse/watch/${debate.id}`}
                key={debate.id}
                className="rounded-lg overflow-hidden cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md block border border-gray-100"
              >
                {/* Thumbnail */}
                <div className="h-40 bg-gray-100 relative flex items-center justify-center">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-lg font-extrabold text-white"
                      style={{ background: debate.userA.color }}
                    >
                      {debate.userA.username[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-sm font-black text-emerald-600">VS</span>
                    <div
                      className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-lg font-extrabold text-white"
                      style={{ background: debate.userB.color }}
                    >
                      {debate.userB.username[0]?.toUpperCase() || "?"}
                    </div>
                  </div>
                  {/* LIVE badge */}
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                    LIVE
                  </div>
                  {/* Time */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                    {formatTime(debate.createdAt)}
                  </div>
                  {/* Vote bar mini */}
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] flex">
                    <div className="bg-emerald-500 transition-all" style={{ width: `${pctA}%` }} />
                    <div className="bg-amber-800 flex-1" />
                  </div>
                </div>
                {/* Info */}
                <div className="py-2 px-2.5">
                  <p className="text-xs font-semibold truncate leading-tight">{debate.topic}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {debate.userA.username} vs {debate.userB.username}
                  </p>
                  <div className="flex gap-1 mt-1 items-center">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
                      {debate.categoryLabel}
                    </span>
                    {totalVotes > 0 && (
                      <span className="text-[9px] text-gray-400 ml-auto">
                        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          {activeTopic ? (
            <>
              <p className="text-sm font-semibold text-gray-700 mb-1">No live debates on this topic</p>
              <p className="text-xs text-gray-400 mb-4">Try clearing the filter or start a debate!</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTopic(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition"
                >
                  Clear Filter
                </button>
                <Link
                  href="/debate"
                  className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition"
                >
                  Find a Debate
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-700 mb-1">No live debates right now</p>
              <p className="text-xs text-gray-400 mb-4">Start one and be the first!</p>
              <Link
                href="/debate"
                className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition"
              >
                Find a Debate
              </Link>
            </>
          )}
        </div>
      )}
    </div>

    {/* Trending Topics Sidebar */}
    <TrendingTopics
      trending={trendingTopics}
      allTime={allTimeTopics}
      activeTopic={activeTopic}
      onTopicClick={setActiveTopic}
    />
    </>
  );
}
