"use client";

import { useState } from "react";
import { COUNTRIES, countryFlag } from "@/utils/countries";
import { createClient } from "@/lib/supabase/client";

interface CountryPickerProps {
  userId: string;
  currentCountry: string | null;
}

export default function CountryPicker({ userId, currentCountry }: CountryPickerProps) {
  const [country, setCountry] = useState(currentCountry || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = async (code: string) => {
    setCountry(code);
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ country: code || null })
      .eq("id", userId);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  return (
    <div className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🌍</span>
        <h2 className="text-lg font-bold text-gray-900">Your Country</h2>
        {saved && (
          <span className="text-xs text-emerald-500 font-semibold ml-auto">Saved!</span>
        )}
        {saving && (
          <span className="text-xs text-gray-400 ml-auto">Saving...</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {country && (
          <span className="text-3xl">{countryFlag(country)}</span>
        )}
        <select
          value={country}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white focus:border-emerald-500 focus:outline-none transition appearance-none cursor-pointer"
        >
          <option value="">Select your country...</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {countryFlag(c.code)} {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
