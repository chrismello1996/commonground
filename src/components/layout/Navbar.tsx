import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/(auth)/actions";
import NavTabs from "./NavTabs";
import SearchBar from "./SearchBar";
import ChallengeNotifications from "../challenges/ChallengeNotifications";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("username, display_name, avatar_url, elo")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const eloRank = profile
    ? profile.elo >= 1600
      ? "gold"
      : profile.elo >= 1400
        ? "silver"
        : "bronze"
    : "bronze";

  return (
    <nav className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-full mx-auto px-3 py-1.5 flex items-center justify-between h-[50px]">
        {/* Left: Logo + Nav Tabs */}
        <div className="flex items-center gap-1">
          <Link href="/" className="flex items-center gap-1 mr-1">
            <svg width="40" height="35" viewBox="0 0 140 120" fill="none">
              <defs>
                <clipPath id="nGreen"><rect x="8" y="12" width="72" height="56" rx="16"/></clipPath>
              </defs>
              <rect x="8" y="12" width="72" height="56" rx="16" fill="#10b981"/>
              <polygon points="28,68 40,68 24,84" fill="#10b981"/>
              <rect x="52" y="24" width="72" height="56" rx="16" fill="#8B4513"/>
              <polygon points="104,80 92,80 108,96" fill="#8B4513"/>
              <rect x="52" y="24" width="72" height="56" rx="16" fill="#e5e7eb" clipPath="url(#nGreen)"/>
            </svg>
          </Link>

          {/* Nav Tabs - Client Component */}
          <NavTabs />
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <SearchBar />

          {/* Challenge Notifications */}
          {user && <ChallengeNotifications />}

          {/* User Badge with ELO */}
          {profile && (
            <Link
              href={`/profile/${profile.username}`}
              className="flex items-center gap-1.5 px-1.5 pr-3 py-1 rounded-lg bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 hover:text-gray-900 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-extrabold text-white bg-emerald-500">
                {(profile.display_name || profile.username)?.[0]?.toUpperCase()}
              </div>
              <span className="hidden sm:inline">{profile.username}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                eloRank === "gold"
                  ? "bg-amber-800/10 text-amber-800"
                  : eloRank === "silver"
                    ? "bg-gray-500/10 text-gray-500"
                    : "bg-orange-700/10 text-orange-700"
              }`}>
                {profile.elo}
              </span>
            </Link>
          )}

          {/* Sign Out */}
          <form>
            <button
              formAction={signout}
              className="text-[11px] text-gray-400 hover:text-gray-600 transition"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
