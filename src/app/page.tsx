import { createClient } from "@/lib/supabase/server";
import { signout } from "./(auth)/actions";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile data
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          Common<span className="text-emerald-500">Ground</span>
        </h1>
        <div className="flex items-center gap-4">
          {profile && (
            <Link
              href={`/profile/${profile.username}`}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              @{profile.username}
            </Link>
          )}
          <form>
            <button
              formAction={signout}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <h2 className="text-5xl font-bold mb-4">
            Welcome to Common<span className="text-emerald-500">Ground</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            {profile
              ? `Ready to debate, ${profile.display_name || profile.username}?`
              : "Find your opponent. Defend your stance."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/debate"
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-lg transition-colors"
            >
              Find a Debate
            </Link>
            {profile && (
              <Link
                href={`/profile/${profile.username}`}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl text-lg transition-colors border border-gray-700"
              >
                My Profile
              </Link>
            )}
          </div>

          {/* Stats */}
          {profile && (
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm mx-auto">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-2xl font-bold text-emerald-500">
                  {profile.elo}
                </p>
                <p className="text-xs text-gray-500 mt-1">ELO Rating</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-2xl font-bold">{profile.wins}</p>
                <p className="text-xs text-gray-500 mt-1">Wins</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-2xl font-bold">
                  {profile.total_debates}
                </p>
                <p className="text-xs text-gray-500 mt-1">Debates</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
