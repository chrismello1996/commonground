"use client";

import { useState } from "react";
import Link from "next/link";
import { STANCE_OPTIONS } from "@/utils/constants";

type Props = {
  stancesByCategory: Record<string, string>;
  isOwnProfile: boolean;
};

export default function ProfileTabs({ stancesByCategory, isOwnProfile }: Props) {
  const [activeTab, setActiveTab] = useState<"stances" | "debates" | "clips">("stances");

  const tabs = [
    { id: "stances" as const, label: "Stances" },
    { id: "debates" as const, label: "Debates" },
    { id: "clips" as const, label: "Clips" },
  ];

  return (
    <div className="mt-4">
      {/* Tab Buttons */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === tab.id
                ? "text-emerald-600 border-emerald-500"
                : "text-gray-500 border-transparent hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "stances" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Active Stances
            </h4>
            {isOwnProfile && (
              <Link href="/stances" className="text-[11px] font-semibold text-emerald-600 hover:underline">
                Edit
              </Link>
            )}
          </div>
          {Object.keys(stancesByCategory).length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(stancesByCategory).map(([category, stanceId]) => {
                const catData = STANCE_OPTIONS[category];
                const stance = catData?.stances.find((s) => s.id === stanceId);
                return (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-gray-200"
                    style={{ color: stance?.color || "#6b7280" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: stance?.color || "#6b7280" }}
                    />
                    {stance?.label || stanceId}
                    <span className="text-[9px] text-gray-400 ml-0.5">{catData?.label}</span>
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-6 text-center text-gray-400 text-sm">
              No stances selected yet
            </div>
          )}
        </div>
      )}

      {activeTab === "debates" && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-8 text-center text-gray-400 text-sm">
          No debates yet — time to jump in!
        </div>
      )}

      {activeTab === "clips" && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-8 text-center text-gray-400 text-sm">
          No clips yet — make some highlights!
        </div>
      )}
    </div>
  );
}
