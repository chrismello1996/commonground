import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FindDebate from "@/components/matchmaking/FindDebate";

export default async function FindPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get user's stances
  const { data: stances } = await supabase
    .from("user_stances")
    .select("category, stance")
    .eq("user_id", user.id);

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("username, elo")
    .eq("id", user.id)
    .single();

  const stanceMap: Record<string, string> = {};
  stances?.forEach((s) => {
    stanceMap[s.category] = s.stance;
  });

  return (
    <div className="min-h-screen bg-gray-950 pt-20 pb-12">
      <FindDebate
        userId={user.id}
        username={profile?.username || "anonymous"}
        elo={profile?.elo || 1200}
        userStances={stanceMap}
      />
    </div>
  );
}
