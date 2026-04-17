import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/(auth)/actions";

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

  return (
    <nav className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <svg width="36" height="32" viewBox="0 0 140 120" fill="none">
            <defs>
              <clipPath id="nGreen"><rect x="8" y="12" width="72" height="56" rx="16"/></clipPath>
            </defs>
            <rect x="8" y="12" width="72" height="56" rx="16" fill="#10b981"/>
            <polygon points="28,68 40,68 24,84" fill="#10b981"/>
            <rect x="52" y="24" width="72" height="56" rx="16" fill="#8B4513"/>
            <polygon points="104,80 92,80 108,96" fill="#8B4513"/>
            <rect x="52" y="24" width="72" height="56" rx="16" fill="#e5e7eb" clipPath="url(#nGreen)"/>
          </svg>
          <span className="text-lg font-bold font-brand text-brand-gradient hidden sm:inline">
            CommonGround
          </span>
        </Link>

        {/* Center Nav */}
        <div className="hidden sm:flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
          >
            Home
          </Link>
          <Link
            href="/stances"
            className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
          >
            Stances
          </Link>
          <Link
            href="/debate"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-md transition"
          >
            Find a Debate
          </Link>
        </div>

        {/* Mobile Nav */}
        <div className="flex sm:hidden items-center gap-3">
          <Link href="/stances" className="text-xs font-semibold text-gray-500">
            Stances
          </Link>
          <Link
            href="/debate"
            className="text-xs font-semibold text-white bg-emerald-500 px-3 py-1 rounded-md"
          >
            Debate
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {profile && (
            <>
              {/* ELO Badge */}
              <span className="hidden sm:inline text-xs font-bold text-amber-800 bg-amber-800/10 px-2 py-1 rounded">
                {profile.elo} ELO
              </span>
              <Link
                href={`/profile/${profile.username}`}
                className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 border border-gray-200 rounded-md px-2 py-1 transition"
              >
                <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-[10px] font-extrabold text-white">
                  {(profile.display_name || profile.username)?.[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:inline">@{profile.username}</span>
              </Link>
            </>
          )}
          <form>
            <button
              formAction={signout}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
