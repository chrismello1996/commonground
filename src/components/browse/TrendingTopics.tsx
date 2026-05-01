"use client";

import { useState } from "react";

interface TopicStat {
  topic: string;
  category: string;
  categoryLabel: string;
  count: number;
}

interface TrendingTopicsProps {
  trending: TopicStat[];
  allTime: TopicStat[];
  activeTopic: string | null;
  onTopicClick: (topic: string | null) => void;
}

export default function TrendingTopics({ trending, allTime, activeTopic, onTopicClick }: TrendingTopicsProps) {
  const [view, setView] = useState<"trending" | "alltime">("alltime");
  const topics = view === "trending" ? trending : allTime;

  return (
    <div className="mb-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <h3 className="text-sm font-extrabold">Trending Topics</h3>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView("trending")}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition ${
              view === "trending"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setView("alltime")}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition ${
              view === "alltime"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Active filter indicator */}
      {activeTopic && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
          <span className="text-[11px] text-emerald-700 font-semibold flex-1 truncate">
            Filtered: &quot;{activeTopic}&quot;
          </span>
          <button
            onClick={() => onTopicClick(null)}
            className="text-[10px] text-emerald-600 font-bold hover:text-emerald-800 transition flex items-center gap-0.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear
          </button>
        </div>
      )}

      {/* Topics grid */}
      {topics.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {topics.map((t, i) => {
            const isActive = activeTopic?.toLowerCase() === t.topic.toLowerCase();
            return (
              <button
                key={`${t.topic}-${i}`}
                onClick={() => onTopicClick(isActive ? null : t.topic)}
                className={`flex items-start gap-2 p-2.5 rounded-lg text-left transition border ${
                  isActive
                    ? "bg-emerald-50 border-emerald-200 shadow-sm"
                    : "bg-white border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-sm"
                }`}
              >
                <span className={`text-base font-extrabold mt-0.5 w-5 text-right flex-shrink-0 ${
                  i === 0 ? "text-emerald-500" : i === 1 ? "text-emerald-400" : i === 2 ? "text-emerald-300" : "text-gray-300"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2">
                    {t.topic}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
                      {t.categoryLabel}
                    </span>
                    <span className="text-[9px] text-gray-400 font-medium">
                      {t.count} debate{t.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-4">
          {view === "trending" ? "No debates this week yet" : "No debates yet"}
        </p>
      )}
    </div>
  );
}
