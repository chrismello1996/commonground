import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DebateRoom from "@/components/debate/DebateRoom";

interface DebatePageProps {
  params: Promise<{ id: string }>;
}

export default async function DebatePage({ params }: DebatePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch debate details
  const { data: debate, error } = await supabase
    .from("debates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !debate) {
    redirect("/find");
  }

  // Verify user is part of this debate
  if (debate.user_a !== user.id && debate.user_b !== user.id) {
    redirect("/find");
  }

  // Get both user profiles
  const { data: users } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, elo, country")
    .in("id", [debate.user_a, debate.user_b]);

  const userA = users?.find((u) => u.id === debate.user_a);
  const userB = users?.find((u) => u.id === debate.user_b);

  // Get stances — try debate category first, fall back to any stance
  const { data: stances } = await supabase
    .from("user_stances")
    .select("user_id, category, stance")
    .in("user_id", [debate.user_a, debate.user_b]);

  const getStance = (userId: string) => {
    const categoryStance = stances?.find((s) => s.user_id === userId && s.category === debate.category);
    if (categoryStance) return { stance: categoryStance.stance, stanceCategory: categoryStance.category };
    const anyStance = stances?.find((s) => s.user_id === userId);
    if (anyStance) return { stance: anyStance.stance, stanceCategory: anyStance.category };
    return { stance: "unknown", stanceCategory: debate.category };
  };

  const stanceDataA = getStance(debate.user_a);
  const stanceDataB = getStance(debate.user_b);

  return (
    <div className="min-h-screen">
      <DebateRoom
        debateId={debate.id}
        currentUserId={user.id}
        topic={debate.topic}
        category={debate.category}
        status={debate.status}
        userA={{
          id: debate.user_a,
          username: userA?.username || "Unknown",
          displayName: userA?.display_name || userA?.username || "Unknown",
          avatarUrl: userA?.avatar_url || null,
          elo: userA?.elo || 1200,
          stance: stanceDataA.stance,
          stanceCategory: stanceDataA.stanceCategory,
          country: userA?.country || null,
        }}
        userB={{
          id: debate.user_b,
          username: userB?.username || "Unknown",
          displayName: userB?.display_name || userB?.username || "Unknown",
          avatarUrl: userB?.avatar_url || null,
          elo: userB?.elo || 1200,
          stance: stanceDataB.stance,
          stanceCategory: stanceDataB.stanceCategory,
          country: userB?.country || null,
        }}
      />
    </div>
  );
}
