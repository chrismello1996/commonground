import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { STANCE_OPTIONS } from "@/utils/constants";
import WatchClient from "./WatchClient";
import type { Metadata } from "next";

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: WatchPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: debate } = await supabase
    .from("debates")
    .select("topic, category, user_a, user_b, status")
    .eq("id", id)
    .single();

  if (!debate) {
    return { title: "Debate Not Found — CommonGround" };
  }

  // Fetch participant usernames
  const { data: users } = await supabase
    .from("users")
    .select("id, username")
    .in("id", [debate.user_a, debate.user_b]);

  const userA = users?.find((u) => u.id === debate.user_a)?.username || "Debater";
  const userB = users?.find((u) => u.id === debate.user_b)?.username || "Debater";
  const isLive = debate.status === "active";

  return {
    title: `${isLive ? "LIVE: " : ""}${debate.topic || "Open Debate"} — CommonGround`,
    description: `${userA} vs ${userB} debating "${debate.topic || "Open Topic"}" in ${debate.category}. ${isLive ? "Watch live and vote!" : "Watch the replay."}`,
    openGraph: {
      title: `${isLive ? "LIVE: " : ""}${debate.topic || "Open Debate"}`,
      description: `${userA} vs ${userB} · ${debate.category} · ${isLive ? "Watch live now" : "Replay"}`,
      url: `https://commongrounddebate.com/browse/watch/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${isLive ? "LIVE: " : ""}${debate.topic || "Open Debate"}`,
      description: `${userA} vs ${userB} on CommonGround`,
    },
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch debate
  const { data: debate, error } = await supabase
    .from("debates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !debate) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-3">Debate not found</p>
          <Link href="/browse" className="text-emerald-500 font-semibold text-sm hover:underline">
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  // Get user profiles
  const { data: users } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, elo")
    .in("id", [debate.user_a, debate.user_b]);

  const userA = users?.find((u) => u.id === debate.user_a);
  const userB = users?.find((u) => u.id === debate.user_b);

  // Get stances
  const { data: stances } = await supabase
    .from("user_stances")
    .select("user_id, stance")
    .eq("category", debate.category)
    .in("user_id", [debate.user_a, debate.user_b]);

  const stanceA = stances?.find((s) => s.user_id === debate.user_a)?.stance || "unknown";
  const stanceB = stances?.find((s) => s.user_id === debate.user_b)?.stance || "unknown";

  const colorA = STANCE_OPTIONS[debate.category]?.stances.find((s) => s.id === stanceA)?.color || "#10b981";
  const colorB = STANCE_OPTIONS[debate.category]?.stances.find((s) => s.id === stanceB)?.color || "#8B4513";

  // Get vote counts
  const { data: votes } = await supabase
    .from("debate_votes")
    .select("voted_for")
    .eq("debate_id", debate.id);

  let votesA = 0;
  let votesB = 0;
  votes?.forEach((v) => {
    if (v.voted_for === debate.user_a) votesA++;
    else votesB++;
  });

  // Check if current user already voted
  let userVote: string | null = null;
  if (user) {
    const { data: myVoteData } = await supabase
      .from("debate_votes")
      .select("voted_for")
      .eq("debate_id", debate.id)
      .eq("voter_id", user.id)
      .maybeSingle();
    if (myVoteData) {
      userVote = myVoteData.voted_for === debate.user_a ? "A" : "B";
    }
  }

  // Fetch other active debate IDs for the "Next" button
  const { data: otherDebates } = await supabase
    .from("debates")
    .select("id")
    .eq("status", "active")
    .neq("id", debate.id);

  const otherDebateIds = otherDebates?.map((d) => d.id) || [];

  return (
    <WatchClient
      debate={{
        id: debate.id,
        topic: debate.topic,
        category: debate.category,
        status: debate.status,
        createdAt: debate.created_at,
      }}
      userA={{
        id: debate.user_a,
        username: userA?.username || "Unknown",
        elo: userA?.elo || 1200,
        color: colorA,
        stance: stanceA,
      }}
      userB={{
        id: debate.user_b,
        username: userB?.username || "Unknown",
        elo: userB?.elo || 1200,
        color: colorB,
        stance: stanceB,
      }}
      initialVotesA={votesA}
      initialVotesB={votesB}
      initialUserVote={userVote as "A" | "B" | null}
      currentUserId={user?.id || null}
      otherDebateIds={otherDebateIds}
    />
  );
}
