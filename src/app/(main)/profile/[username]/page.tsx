import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProfileTabs from "./ProfileTabs";

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

  const eloRank = profile.elo >= 1600 ? "gold" : profile.elo >= 1400 ? "silver" : "bronze";

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-7">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
            {(profile.display_name || profile.username)?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-extrabold text-gray-900">
              {profile.display_name || profile.username}
            </h2>
            <p className="text-gray-500 text-sm flex items-center gap-1.5">
              @{profile.username}
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                eloRank === "gold"
                  ? "bg-amber-800/20 text-amber-800"
                  : eloRank === "silver"
                    ? "bg-gray-500/10 text-gray-500"
                    : "bg-orange-700/20 text-orange-700"
              }`}>
                {profile.elo} ELO
              </span>
            </p>
          </div>
          {isOwnProfile ? (
            <Link
              href="/stances"
              className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Edit Stances
            </Link>
          ) : (
            <button className="px-3 py-1.5 bg-emerald-500 text-white rounded-md text-xs font-bold hover:bg-emerald-600 transition">
              Follow
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2">
          <div className="text-center py-2.5 bg-gray-100 rounded-lg">
            <p className="text-lg font-extrabold text-emerald-500">{profile.elo}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">ELO</p>
          </div>
          <div className="text-center py-2.5 bg-gray-100 rounded-lg">
            <p className="text-lg font-extrabold text-green-500">{profile.wins || 0}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Wins</p>
          </div>
          <div className="text-center py-2.5 bg-gray-100 rounded-lg">
            <p className="text-lg font-extrabold text-red-500">{profile.losses || 0}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Losses</p>
          </div>
          <div className="text-center py-2.5 bg-gray-100 rounded-lg">
            <p className="text-lg font-extrabold text-amber-500">{profile.total_votes_received || 0}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Votes</p>
          </div>
          <div className="text-center py-2.5 bg-gray-100 rounded-lg">
            <p className="text-lg font-extrabold text-gray-900">{profile.followers || 0}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Followers</p>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <ProfileTabs stancesByCategory={stancesByCategory} isOwnProfile={isOwnProfile} />
    </div>
  );
}
