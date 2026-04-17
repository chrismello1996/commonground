"use client";

import { useState } from "react";
import { CLIPS, formatViewers } from "@/utils/constants";

// Extend clips with more data for a full page
const ALL_CLIPS = [
  ...CLIPS,
  { id: 7, user: "MarketBull", title: "Called the market crash live on stream", views: 34500, likes: 2800, duration: 32, timeAgo: "1d ago" },
  { id: 8, user: "PolicyWonk", title: "Best policy breakdown I've ever seen", views: 18200, likes: 1200, duration: 45, timeAgo: "2d ago" },
  { id: 9, user: "SkepticalMind", title: "Caught them in a logical fallacy", views: 42100, likes: 3600, duration: 18, timeAgo: "2d ago" },
  { id: 10, user: "ThinkTankTina", title: "This take changed the whole debate", views: 26700, likes: 2100, duration: 24, timeAgo: "3d ago" },
  { id: 11, user: "AlphaDebater", title: "Sports take so hot it went viral", views: 71200, likes: 6100, duration: 20, timeAgo: "3d ago" },
  { id: 12, user: "TouchGrass420", title: "Debunked a conspiracy in real time", views: 38900, likes: 3200, duration: 35, timeAgo: "4d ago" },
];

export default function ClipsPage() {
  const [sortBy, setSortBy] = useState<"trending" | "newest" | "most-liked">("trending");

  const sorted = [...ALL_CLIPS].sort((a, b) => {
    if (sortBy === "trending") return b.views - a.views;
    if (sortBy === "newest") return b.id - a.id;
    return b.likes - a.likes;
  });

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black">Clips</h1>
          <p className="text-sm text-gray-500">The best moments from live debates</p>
        </div>
        <div className="flex gap-1">
          {(["trending", "newest", "most-liked"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                sortBy === s
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:border-emerald-500"
              }`}
            >
              {s === "trending" ? "Trending" : s === "newest" ? "Newest" : "Most Liked"}
            </button>
          ))}
        </div>
      </div>

      {/* Clips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sorted.map((clip) => (
          <div
            key={clip.id}
            className="rounded-lg overflow-hidden cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg border border-gray-100"
          >
            {/* Thumbnail */}
            <div className="h-36 bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center group">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm transition group-hover:bg-white/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              {/* Duration */}
              <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/80 text-white px-1.5 py-0.5 rounded">
                0:{clip.duration.toString().padStart(2, "0")}
              </span>
              {/* Views overlay */}
              <span className="absolute top-2 right-2 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                {formatViewers(clip.views)}
              </span>
            </div>
            {/* Info */}
            <div className="p-3">
              <p className="text-sm font-semibold leading-tight mb-1 line-clamp-2">{clip.title}</p>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-500">{clip.user} · {clip.timeAgo}</p>
                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {formatViewers(clip.likes)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
