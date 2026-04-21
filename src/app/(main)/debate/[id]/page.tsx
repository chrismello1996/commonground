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
    .select("id, username, display_name, avatar_url, elo")
    .in("id", [debate.user_a, debate.user_b]);

  const userA = users?.find((u) => u.id === debate.user_a);
  const userB = users?.find((u) => u.id === debate.user_b);

  // Get stances for this debate category
  const { data: stances } = await supabase
    .from("user_stances")
    .select("user_id, stance")
    .eq("category", debate.category)
    .in("user_id", [debate.user_a, debate.user_b]);

  const stanceA = stances?.find((s) => s.user_id === debate.user_a)?.stance || "unknown";
  const stanceB = stances?.find((s) => s.user_id === debate.user_b)?.stance || "unknown";

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
          stance: stanceA,
        }}
        userB={{
          id: debate.user_b,
          username: userB?.username || "Unknown",
          displayName: userB?.display_name || userB?.username || "Unknown",
          avatarUrl: userB?.avatar_url || null,
          elo: userB?.elo || 1200,
          stance: stanceB,
        }}
      />
    </div>
  );
}
