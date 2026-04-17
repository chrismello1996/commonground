"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FAKE_USERS,
  STREAM_TITLES,
  CATEGORY_TAGS,
  formatViewers,
  formatTime,
} from "@/utils/constants";

// Generate live streams from fake data
const LIVE_STREAMS = [
  { id: 1, debaterA: FAKE_USERS[1], debaterB: FAKE_USERS[2], title: STREAM_TITLES[0], viewers: 2847, votesA: 62, votesB: 38, timeElapsed: 487, category: "economics", tags: ["heated", "economics"], topic: "Is profit inherently exploitative?" },
  { id: 2, debaterA: FAKE_USERS[4], debaterB: FAKE_USERS[3], title: STREAM_TITLES[1], viewers: 5203, votesA: 45, votesB: 55, timeElapsed: 1294, category: "technology", tags: ["AI", "tech"], topic: "Will AI replace most jobs in 10 years?" },
  { id: 3, debaterA: FAKE_USERS[5], debaterB: FAKE_USERS[6], title: STREAM_TITLES[4], viewers: 8623, votesA: 51, votesB: 49, timeElapsed: 743, category: "anything", tags: ["free speech", "open"], topic: "Is social media a net negative?" },
  { id: 4, debaterA: FAKE_USERS[8], debaterB: FAKE_USERS[9], title: STREAM_TITLES[9], viewers: 12580, votesA: 58, votesB: 42, timeElapsed: 2156, category: "anything", tags: ["open mic", "no rules"], topic: "Should billionaires exist?" },
  { id: 5, debaterA: FAKE_USERS[10], debaterB: FAKE_USERS[11], title: STREAM_TITLES[5], viewers: 4104, votesA: 44, votesB: 56, timeElapsed: 967, category: "anything", tags: ["challenge"], topic: "Are popular opinions popular because they're right?" },
  { id: 6, debaterA: FAKE_USERS[7], debaterB: FAKE_USERS[13], title: STREAM_TITLES[10], viewers: 15932, votesA: 70, votesB: 30, timeElapsed: 380, category: "conspiracy", tags: ["conspiracy", "receipts"], topic: "Is the moon landing real?" },
];

export default function BrowsePage() {
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"viewers" | "newest">("viewers");

  const filtered = LIVE_STREAMS
    .filter((s) => filter === "all" || s.category === filter)
    .sort((a, b) => sortBy === "viewers" ? b.viewers - a.viewers : b.id - a.id);

  const topDebaters = [...FAKE_USERS].sort((a, b) => b.elo - a.elo).slice(0, 5);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold">Live Debates</h2>
          <div className="flex gap-1">
            {(["viewers", "newest"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                  sortBy === s
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-emerald-500"
                }`}
              >
                {s === "viewers" ? "Most Viewers" : "Newest"}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-full border text-[11px] font-semibold transition ${
              filter === "all"
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-600"
                : "bg-gray-50 border-gray-200 text-gray-500 hover:border-emerald-500"
            }`}
          >
            All
          </button>
          {CATEGORY_TAGS.filter(c => c.id !== "anything").map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-3 py-1 rounded-full border text-[11px] font-semibold transition whitespace-nowrap ${
                filter === cat.id
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-600"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:border-emerald-500"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Stream Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((stream) => (
            <Link
              href={`/browse/watch/${stream.id}`}
              key={stream.id}
              className="rounded-lg overflow-hidden cursor-pointer transition hover:-translate-y-0.5 block"
            >
              {/* Thumbnail */}
              <div className="h-40 bg-gray-100 relative flex items-center justify-center">
                {/* VS Display */}
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-lg font-extrabold text-white"
                    style={{ background: stream.debaterA.color }}
                  >
                    {stream.debaterA.name[0]}
                  </div>
                  <span className="text-sm font-black text-emerald-600">VS</span>
                  <div
                    className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-lg font-extrabold text-white"
                    style={{ background: stream.debaterB.color }}
                  >
                    {stream.debaterB.name[0]}
                  </div>
                </div>
                {/* LIVE badge */}
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                  LIVE
                </div>
                {/* Viewers */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {formatViewers(stream.viewers)}
                </div>
                {/* Time */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  {formatTime(stream.timeElapsed)}
                </div>
                {/* Vote bar mini */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] flex">
                  <div className="bg-emerald-500 transition-all" style={{ width: `${stream.votesA}%` }} />
                  <div className="bg-amber-800 flex-1" />
                </div>
              </div>
              {/* Info */}
              <div className="py-2 px-1">
                <div className="flex gap-2 items-start">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold text-white flex-shrink-0"
                    style={{ background: stream.debaterA.color }}
                  >
                    {stream.debaterA.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate leading-tight">{stream.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {stream.debaterA.name} vs {stream.debaterB.name}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {stream.tags.map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block w-[280px] bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto flex-shrink-0">
        {/* Trending Topics */}
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Trending Topics
          </h3>
          {[
            { topic: "Should billionaires exist?", uses: 247, hot: true },
            { topic: "Is AI going to replace jobs?", uses: 198, hot: true },
            { topic: "Is the stock market rigged?", uses: 156, hot: false },
            { topic: "Is free will an illusion?", uses: 134, hot: false },
            { topic: "Is cancel culture real?", uses: 112, hot: false },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-1.5 py-1.5 px-2 rounded text-[11px] cursor-pointer hover:bg-gray-100 transition">
              <span className="text-[10px] font-extrabold text-gray-400 w-4 text-center">{i + 1}</span>
              <span className="flex-1 font-semibold truncate">{t.topic}</span>
              {t.hot && <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">HOT</span>}
            </div>
          ))}
        </div>

        {/* Leaderboard Preview */}
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            Top Debaters
          </h3>
          {topDebaters.map((u, i) => (
            <div key={u.name} className="flex items-center gap-2 py-1.5 px-1.5 rounded cursor-pointer hover:bg-gray-100 transition mb-0.5">
              <span className={`w-5 text-xs font-extrabold text-center ${i === 0 ? "text-amber-800" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-700" : "text-gray-400"}`}>
                {i + 1}
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white flex-shrink-0"
                style={{ background: u.color }}
              >
                {u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold truncate">{u.name}</p>
                <p className="text-[10px] text-gray-500">{u.elo} ELO</p>
              </div>
            </div>
          ))}
          <Link href="/rankings" className="text-[11px] text-emerald-600 font-semibold mt-1 block hover:underline">
            View Full Rankings →
          </Link>
        </div>

      </div>
    </div>
  );
}
