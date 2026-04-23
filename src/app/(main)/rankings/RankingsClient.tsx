"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORY_TAGS, STANCE_OPTIONS } from "@/utils/constants";

interface RankedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  elo: number;
  wins: number;
  losses: number;
  stances: Record<string, string>;
}

export default function RankingsClient({ users }: { users: RankedUser[] }) {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const rankClass = (i: number) =>
    i === 0 ? "text-amber-800" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-700" : "text-gray-400";

  const eloClass = (elo: number) =>
    elo >= 1600 ? "text-amber-800" : elo >= 1400 ? "text-gray-500" : "text-orange-700";

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
        {CATEGORY_TAGS.filter((c) => c.id !== "anything").map((cat) => (
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
      {users.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No ranked debaters yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {users.map((user, i) => {
            const stanceForCat =
              categoryFilter !== "all" && user.stances[categoryFilter]
                ? STANCE_OPTIONS[categoryFilter]?.stances.find(
                    (s) => s.id === user.stances[categoryFilter]
                  )
                : null;

            return (
              <Link
                href={`/profile/${user.username}`}
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition cursor-pointer border border-transparent hover:border-gray-200"
              >
                {/* Rank */}
                <span className={`w-8 text-center text-sm font-extrabold ${rankClass(i)}`}>
                  {i < 3 ? ["\u{1F947}", "\u{1F948}", "\u{1F949}"][i] : `#${i + 1}`}
                </span>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-extrabold text-white flex-shrink-0 bg-emerald-500">
                  {user.username[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate">{user.username}</span>
                    {stanceForCat && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gray-200"
                        style={{ color: stanceForCat.color }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: stanceForCat.color }}
                        />
                        {stanceForCat.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {user.wins}W - {user.losses}L
                  </p>
                </div>

                {/* ELO Badge */}
                <div className="text-right">
                  <span className={`text-sm font-black ${eloClass(user.elo)}`}>{user.elo}</span>
                  <p className="text-[10px] text-gray-400">ELO</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
