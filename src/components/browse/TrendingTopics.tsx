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
    <div className="w-[260px] flex-shrink-0 border-l border-gray-100 overflow-y-auto px-4 py-4">
      <h3 className="text-sm font-extrabold mb-3">Popular Topics</h3>

      {/* Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4">
        <button
          onClick={() => setView("trending")}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition ${
            view === "trending"
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => setView("alltime")}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition ${
            view === "alltime"
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          All Time
        </button>
      </div>

      {/* Active filter indicator */}
      {activeTopic && (
        <div className="flex items-center gap-1.5 mb-3 px-2.5 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
          <span className="text-[10px] text-emerald-700 font-semibold flex-1 truncate">
            &quot;{activeTopic}&quot;
          </span>
          <button
            onClick={() => onTopicClick(null)}
            className="text-[10px] text-emerald-600 font-bold hover:text-emerald-800 transition"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Topic list */}
      {topics.length > 0 ? (
        <div className="flex flex-col gap-2">
          {topics.map((t, i) => {
            const isActive = activeTopic?.toLowerCase() === t.topic.toLowerCase();
            return (
              <button
                key={`${t.topic}-${i}`}
                onClick={() => onTopicClick(isActive ? null : t.topic)}
                className={`flex items-start gap-2.5 p-2 rounded-lg transition text-left ${
                  isActive
                    ? "bg-emerald-50 ring-1 ring-emerald-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <span className="text-sm font-extrabold text-gray-300 mt-0.5 w-4 text-right flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 leading-tight truncate">
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
        <p className="text-xs text-gray-400 text-center py-6">
          {view === "trending" ? "No debates this week yet" : "No debates yet"}
        </p>
      )}
    </div>
  );
}
