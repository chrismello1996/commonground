import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Fetch profile by username
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch stances
  const { data: stances } = await supabase
    .from("user_stances")
    .select("*")
    .eq("user_id", profile.id);

  const isOwnProfile = currentUser?.id === profile.id;

  // Group stances by category
  const stancesByCategory: Record<string, string> = {};
  stances?.forEach((s) => {
    stancesByCategory[s.category] = s.stance;
  });

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Common<span className="text-emerald-500">Ground</span>
        </Link>
        {isOwnProfile && (
          <span className="text-sm text-gray-500">Your Profile</span>
        )}
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Profile Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center text-3xl font-bold shrink-0">
              {(profile.display_name || profile.username)?.[0]?.toUpperCase()}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-gray-400">@{profile.username}</p>
            </div>

            {isOwnProfile && (
              <button className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition">
                Edit Profile
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-500">
                {profile.elo}
              </p>
              <p className="text-xs text-gray-500">ELO</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {profile.wins}
              </p>
              <p className="text-xs text-gray-500">Wins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">
                {profile.losses}
              </p>
              <p className="text-xs text-gray-500">Losses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">
                {profile.draws}
              </p>
              <p className="text-xs text-gray-500">Draws</p>
            </div>
          </div>
        </div>

        {/* Stances */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Stances</h2>
          {Object.keys(stancesByCategory).length > 0 ? (
            <div className="grid gap-3">
              {Object.entries(stancesByCategory).map(([category, stance]) => (
                <div
                  key={category}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between"
                >
                  <span className="text-gray-400 capitalize">{category}</span>
                  <span className="text-emerald-400 font-medium">{stance}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-8 text-center text-gray-500">
              No stances selected yet
            </div>
          )}
        </div>

        {/* Debate History Placeholder */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Recent Debates</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-8 text-center text-gray-500">
            No debates yet — time to jump in!
          </div>
        </div>
      </main>
    </div>
  );
}
