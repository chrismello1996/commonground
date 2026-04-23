import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RankingsClient from "./RankingsClient";

export default async function RankingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch top users by ELO
  const { data: users } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, elo, wins, losses")
    .order("elo", { ascending: false })
    .limit(100);

  // Fetch all stances for ranked users
  const userIds = (users || []).map((u) => u.id);
  const { data: stances } = await supabase
    .from("user_stances")
    .select("user_id, category, stance")
    .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

  // Build stance map: { userId: { category: stance } }
  const stanceMap: Record<string, Record<string, string>> = {};
  (stances || []).forEach((s) => {
    if (!stanceMap[s.user_id]) stanceMap[s.user_id] = {};
    stanceMap[s.user_id][s.category] = s.stance;
  });

  const rankedUsers = (users || []).map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.display_name || u.username,
    avatarUrl: u.avatar_url,
    elo: u.elo ?? 1200,
    wins: u.wins ?? 0,
    losses: u.losses ?? 0,
    stances: stanceMap[u.id] || {},
  }));

  return <RankingsClient users={rankedUsers} />;
}
