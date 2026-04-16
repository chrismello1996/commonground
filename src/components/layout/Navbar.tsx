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
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          Common<span className="text-emerald-500">Ground</span>
        </Link>

        {/* Center Nav */}
        <div className="hidden sm:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Home
          </Link>
          <Link
            href="/stances"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Stances
          </Link>
          <Link
            href="/find"
            className="text-sm px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium"
          >
            Find a Debate
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {profile && (
            <>
              {/* ELO Badge */}
              <span className="hidden sm:inline text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded">
                {profile.elo} ELO
              </span>
              <Link
                href={`/profile/${profile.username}`}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold">
                  {(profile.display_name || profile.username)?.[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:inline">@{profile.username}</span>
              </Link>
            </>
          )}
          <form>
            <button
              formAction={signout}
              className="text-xs text-gray-500 hover:text-gray-300 transition"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
