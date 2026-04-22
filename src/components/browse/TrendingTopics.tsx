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
}

export default function TrendingTopics({ trending, allTime }: TrendingTopicsProps) {
  const [view, setView] = useState<"trending" | "alltime">("trending");
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
          Trending
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

      {/* Topic list */}
      {topics.length > 0 ? (
        <div className="flex flex-col gap-2">
          {topics.map((t, i) => (
            <div
              key={`${t.topic}-${i}`}
              className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition"
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
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-6">
          {view === "trending" ? "No debates this week yet" : "No debates yet"}
        </p>
      )}
    </div>
  );
}
