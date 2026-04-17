"use client";

import { useState } from "react";
import { FAKE_USERS, CATEGORY_TAGS, STANCE_OPTIONS, formatViewers } from "@/utils/constants";

export default function RankingsPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const sorted = [...FAKE_USERS].sort((a, b) => b.elo - a.elo);

  const rankClass = (i: number) =>
    i === 0 ? "text-amber-800" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-700" : "text-gray-400";

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-black mb-1">Rankings</h1>
      <p className="text-sm text-gray-500 mb-5">Top debaters ranked by ELO score</p>

      {/* Category Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition ${
            categoryFilter === "all"
              ? "bg-emerald-500 text-white border-emerald-500"
              : "bg-white border-gray-200 text-gray-500 hover:border-emerald-500 hover:text-gray-900"
          }`}
        >
          Overall
        </button>
        {CATEGORY_TAGS.filter(c => c.id !== "anything").map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition ${
              categoryFilter === cat.id
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white border-gray-200 text-gray-500 hover:border-emerald-500 hover:text-gray-900"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Rankings List */}
      <div className="space-y-1.5">
        {sorted.map((user, i) => {
          const userStances = user.stances as unknown as Record<string, string>;
          const stanceForCat = categoryFilter !== "all" && userStances[categoryFilter]
            ? STANCE_OPTIONS[categoryFilter]?.stances.find(s => s.id === userStances[categoryFilter])
            : null;

          return (
            <div
              key={user.name}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition cursor-pointer border border-transparent hover:border-gray-200"
            >
              {/* Rank */}
              <span className={`w-8 text-center text-sm font-extrabold ${rankClass(i)}`}>
                {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
              </span>

              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-base font-extrabold text-white flex-shrink-0"
                style={{ background: user.color }}
              >
                {user.name[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate">{user.name}</span>
                  {stanceForCat && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gray-200"
                      style={{ color: stanceForCat.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: stanceForCat.color }} />
                      {stanceForCat.label}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">
                  {user.wins}W - {user.losses}L · {formatViewers(user.followers)} followers
                </p>
              </div>

              {/* ELO Badge */}
              <div className="text-right">
                <span className={`text-sm font-black ${
                  user.elo >= 1600 ? "text-amber-800" : user.elo >= 1400 ? "text-gray-500" : "text-orange-700"
                }`}>
                  {user.elo}
                </span>
                <p className="text-[10px] text-gray-400">ELO</p>
              </div>

              {/* Follow Button */}
              <button className="text-[11px] font-bold px-3 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition">
                Follow
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
