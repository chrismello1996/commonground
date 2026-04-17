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

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: stances } = await supabase
    .from("user_stances")
    .select("*")
    .eq("user_id", profile.id);

  const isOwnProfile = currentUser?.id === profile.id;

  const stancesByCategory: Record<string, string> = {};
  stances?.forEach((s) => {
    stancesByCategory[s.category] = s.stance;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-brand text-brand-gradient">
          CommonGround
        </Link>
        {isOwnProfile && (
          <span className="text-sm text-gray-400">Your Profile</span>
        )}
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Profile Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-3xl font-bold text-white shrink-0">
              {(profile.display_name || profile.username)?.[0]?.toUpperCase()}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-gray-400">@{profile.username}</p>
            </div>

            {isOwnProfile && (
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">
                Edit Profile
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-500">{profile.elo}</p>
              <p className="text-xs text-gray-400 font-medium">ELO</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{profile.wins}</p>
              <p className="text-xs text-gray-400 font-medium">Wins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{profile.losses}</p>
              <p className="text-xs text-gray-400 font-medium">Losses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{profile.draws}</p>
              <p className="text-xs text-gray-400 font-medium">Draws</p>
            </div>
          </div>
        </div>

        {/* Stances */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4 text-gray-900">Stances</h2>
          {Object.keys(stancesByCategory).length > 0 ? (
            <div className="grid gap-3">
              {Object.entries(stancesByCategory).map(([category, stance]) => (
                <div
                  key={category}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between"
                >
                  <span className="text-gray-500 capitalize">{category}</span>
                  <span className="text-emerald-500 font-semibold">{stance}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-8 text-center text-gray-400">
              No stances selected yet
            </div>
          )}
        </div>

        {/* Debate History */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4 text-gray-900">Recent Debates</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-8 text-center text-gray-400">
            No debates yet — time to jump in!
          </div>
        </div>
      </main>
    </div>
  );
}
