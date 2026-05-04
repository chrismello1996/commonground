"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import TrendingTopics from "./TrendingTopics";
import { FACTION_MOTTOS } from "@/utils/constants";

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
  userA: { username: string; color: string; stance: string };
  userB: { username: string; color: string; stance: string };
  votesA: number;
  votesB: number;
}

interface FactionStance {
  id: string;
  label: string;
  color: string;
  members: number;
}

interface FactionCategory {
  categoryId: string;
  categoryLabel: string;
  categoryIcon: string;
  stances: FactionStance[];
}

interface BrowseClientProps {
  debates: DebateCard[];
  trendingTopics: TopicStat[];
  allTimeTopics: TopicStat[];
  factions: FactionCategory[];
}

export default function BrowseClient({ debates, trendingTopics, allTimeTopics, factions }: BrowseClientProps) {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFaction, setActiveFaction] = useState<string | null>(null); // "category:stanceId"
  const [hoveredFaction, setHoveredFaction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter debates by selected topic OR faction
  let filteredDebates = debates;
  if (activeTopic) {
    filteredDebates = debates.filter((d) => d.topic.toLowerCase().trim() === activeTopic.toLowerCase().trim());
  } else if (activeFaction) {
    const [cat, stance] = activeFaction.split(":");
    filteredDebates = debates.filter(
      (d) =>
        (d.category === cat && (d.userA.stance === stance || d.userB.stance === stance))
    );
  }

  // Get stances for the active category (or show top factions across all)
  const visibleStances: (FactionStance & { categoryId: string })[] = [];
  if (activeCategory) {
    const cat = factions.find((f) => f.categoryId === activeCategory);
    if (cat) {
      cat.stances.forEach((s) => visibleStances.push({ ...s, categoryId: cat.categoryId }));
    }
  } else {
    // Show top factions by member count across all categories
    factions.forEach((cat) => {
      cat.stances.forEach((s) => visibleStances.push({ ...s, categoryId: cat.categoryId }));
    });
    visibleStances.sort((a, b) => b.members - a.members);
  }

  // Count active debates per faction
  const factionDebateCounts: Record<string, number> = {};
  debates.forEach((d) => {
    const keyA = `${d.category}:${d.userA.stance}`;
    const keyB = `${d.category}:${d.userB.stance}`;
    factionDebateCounts[keyA] = (factionDebateCounts[keyA] || 0) + 1;
    factionDebateCounts[keyB] = (factionDebateCounts[keyB] || 0) + 1;
  });

  const handleFactionClick = (categoryId: string, stanceId: string) => {
    const key = `${categoryId}:${stanceId}`;
    if (activeFaction === key) {
      setActiveFaction(null);
    } else {
      setActiveFaction(key);
      setActiveTopic(null); // clear topic filter when faction filter is set
    }
  };

  const handleTopicClick = (topic: string | null) => {
    setActiveTopic(topic);
    if (topic) setActiveFaction(null); // clear faction filter when topic filter is set
  };

  const clearAllFilters = () => {
    setActiveTopic(null);
    setActiveFaction(null);
  };

  const formatTime = (createdAt: string) => {
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const s = (elapsed % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getFilterLabel = () => {
    if (activeFaction) {
      const [cat, stance] = activeFaction.split(":");
      const catData = factions.find((f) => f.categoryId === cat);
      const stanceData = catData?.stances.find((s) => s.id === stance);
      return stanceData?.label || stance;
    }
    if (activeTopic) return "Filtered Debates";
    return "Live Debates";
  };

  return (
    <>
    <div className="flex-1 overflow-y-auto px-5 py-4">
      {/* ===== FACTION EXPLORER ===== */}
      <div className="mb-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
              activeCategory === null
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            All Factions
          </button>
          {factions.map((cat) => (
            <button
              key={cat.categoryId}
              onClick={() => setActiveCategory(activeCategory === cat.categoryId ? null : cat.categoryId)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
                activeCategory === cat.categoryId
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {cat.categoryIcon} {cat.categoryLabel}
            </button>
          ))}
        </div>

        {/* Faction Chips */}
        <div
          ref={scrollRef}
          className="flex gap-1.5 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {visibleStances.map((stance) => {
            const key = `${stance.categoryId}:${stance.id}`;
            const isActive = activeFaction === key;
            const isHovered = hoveredFaction === key;
            const liveCount = factionDebateCounts[key] || 0;
            const motto = FACTION_MOTTOS[stance.id] || "";

            return (
              <div key={key} className="relative flex-shrink-0">
                <button
                  onClick={() => handleFactionClick(stance.categoryId, stance.id)}
                  onMouseEnter={() => setHoveredFaction(key)}
                  onMouseLeave={() => setHoveredFaction(null)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition border ${
                    isActive
                      ? "border-current shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                  style={{
                    background: isActive ? `${stance.color}15` : undefined,
                    color: isActive ? stance.color : undefined,
                    borderColor: isActive ? stance.color : undefined,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: stance.color }}
                  />
                  {stance.label}
                  {stance.members > 0 && (
                    <span className={`text-[9px] font-bold ${isActive ? "opacity-70" : "text-gray-400"}`}>
                      {stance.members}
                    </span>
                  )}
                  {liveCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title={`${liveCount} live`} />
                  )}
                </button>

                {/* Hover Stats Tooltip */}
                {isHovered && !isActive && (
                  <div className="absolute top-full left-0 mt-1.5 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: stance.color }}
                      />
                      <span className="text-xs font-bold" style={{ color: stance.color }}>
                        {stance.label}
                      </span>
                    </div>
                    {motto && (
                      <p className="text-[10px] text-gray-400 italic mb-2">&ldquo;{motto}&rdquo;</p>
                    )}
                    <div className="flex gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-gray-800">{stance.members}</p>
                        <p className="text-[9px] text-gray-400">members</p>
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-gray-800">{liveCount}</p>
                        <p className="text-[9px] text-gray-400">live now</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active faction filter banner */}
        {activeFaction && (() => {
          const [cat, stance] = activeFaction.split(":");
          const catData = factions.find((f) => f.categoryId === cat);
          const stanceData = catData?.stances.find((s) => s.id === stance);
          const motto = FACTION_MOTTOS[stance] || "";
          if (!stanceData) return null;
          return (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg mt-1 mb-1"
              style={{ background: `${stanceData.color}10`, border: `1px solid ${stanceData.color}30` }}
            >
              <span className="w-3 h-3 rounded-full" style={{ background: stanceData.color }} />
              <span className="text-xs font-bold" style={{ color: stanceData.color }}>
                {stanceData.label}
              </span>
              {motto && (
                <span className="text-[10px] text-gray-400 italic">&mdash; &ldquo;{motto}&rdquo;</span>
              )}
              <span className="text-[10px] text-gray-400 ml-auto">
                {stanceData.members} member{stanceData.members !== 1 ? "s" : ""} &middot; {factionDebateCounts[activeFaction] || 0} live
              </span>
              <button
                onClick={() => setActiveFaction(null)}
                className="text-gray-400 hover:text-gray-600 transition ml-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })()}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold">
          {getFilterLabel()}
        </h2>
        <span className="text-xs text-gray-400 font-medium">
          {filteredDebates.length} {activeTopic || activeFaction ? "match" : "live now"}{filteredDebates.length !== 1 ? (activeTopic || activeFaction ? "es" : "") : ""}
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
          {activeTopic || activeFaction ? (
            <>
              <p className="text-sm font-semibold text-gray-700 mb-1">No live debates for this filter</p>
              <p className="text-xs text-gray-400 mb-4">Try clearing the filter or start a debate!</p>
              <div className="flex gap-2">
                <button
                  onClick={clearAllFilters}
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
      onTopicClick={handleTopicClick}
    />
    </>
  );
}
