"use client";

import { useState, useTransition } from "react";
import { STANCE_OPTIONS } from "@/utils/constants";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface StancePickerProps {
  userId: string;
  existingStances: Record<string, string>;
}

export default function StancePicker({
  userId,
  existingStances,
}: StancePickerProps) {
  const [selected, setSelected] = useState<Record<string, string>>(
    existingStances
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSelect = async (category: string, stanceId: string) => {
    // Toggle off if already selected
    if (selected[category] === stanceId) {
      const newSelected = { ...selected };
      delete newSelected[category];
      setSelected(newSelected);

      // Delete from Supabase
      setSaving(category);
      const supabase = createClient();
      await supabase
        .from("user_stances")
        .delete()
        .eq("user_id", userId)
        .eq("category", category);
      setSaving(null);
      return;
    }

    setSelected((prev) => ({ ...prev, [category]: stanceId }));
    setSaving(category);

    const supabase = createClient();
    const { error } = await supabase.from("user_stances").upsert(
      {
        user_id: userId,
        category,
        stance: stanceId,
      },
      { onConflict: "user_id,category" }
    );

    setSaving(null);
    if (!error) {
      setSaved((prev) => ({ ...prev, [category]: true }));
      setTimeout(() => {
        setSaved((prev) => ({ ...prev, [category]: false }));
      }, 1500);
    }
  };

  const stanceCount = Object.keys(selected).length;

  return (
    <div>
      {/* Progress */}
      <div className="mb-8 bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-400">Stances selected: </span>
          <span className="text-emerald-500 font-bold">{stanceCount}</span>
          <span className="text-sm text-gray-500">
            {" "}
            / {Object.keys(STANCE_OPTIONS).length}
          </span>
        </div>
        {stanceCount > 0 && (
          <button
            onClick={() => {
              startTransition(() => {
                router.push("/");
              });
            }}
            disabled={isPending}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isPending ? "..." : "Done — Find a Debate"}
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {Object.entries(STANCE_OPTIONS).map(([categoryId, category]) => (
          <div
            key={categoryId}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{category.icon}</span>
              <h2 className="text-lg font-semibold">{category.label}</h2>
              {saved[categoryId] && (
                <span className="text-xs text-emerald-400 ml-auto">
                  Saved!
                </span>
              )}
              {saving === categoryId && (
                <span className="text-xs text-gray-500 ml-auto">
                  Saving...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {category.stances.map((stance) => {
                const isSelected = selected[categoryId] === stance.id;
                return (
                  <button
                    key={stance.id}
                    onClick={() => handleSelect(categoryId, stance.id)}
                    disabled={saving === categoryId}
                    className={`relative px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500/50"
                        : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-750"
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full mb-2"
                      style={{ backgroundColor: stance.color }}
                    />
                    {stance.label}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
