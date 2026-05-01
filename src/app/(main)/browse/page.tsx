import { createClient } from "@/lib/supabase/server";
import { STANCE_OPTIONS, CATEGORY_TAGS } from "@/utils/constants";
import BrowseClient from "@/components/browse/BrowseClient";

export const revalidate = 10; // refresh every 10 seconds

export default async function BrowsePage() {
  const supabase = await createClient();

  // Fetch all active debates
  const { data: debates } = await supabase
    .from("debates")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Get unique user IDs from debates
  const userIds = new Set<string>();
  debates?.forEach((d) => {
    userIds.add(d.user_a);
    userIds.add(d.user_b);
  });

  // Fetch user profiles
  const { data: users } = userIds.size > 0
    ? await supabase
        .from("users")
        .select("id, username, display_name, avatar_url, elo")
        .in("id", Array.from(userIds))
    : { data: [] };

  // Fetch stances for all users
  const { data: stances } = userIds.size > 0
    ? await supabase
        .from("user_stances")
        .select("user_id, category, stance")
        .in("user_id", Array.from(userIds))
    : { data: [] };

  // Fetch vote counts per debate
  const { data: votes } = debates && debates.length > 0
    ? await supabase
        .from("debate_votes")
        .select("debate_id, voted_for")
        .in("debate_id", debates.map((d) => d.id))
    : { data: [] };

  // Build vote counts map
  const voteCounts: Record<string, { a: number; b: number }> = {};
  votes?.forEach((v) => {
    if (!voteCounts[v.debate_id]) voteCounts[v.debate_id] = { a: 0, b: 0 };
    const debate = debates?.find((d) => d.id === v.debate_id);
    if (debate) {
      if (v.voted_for === debate.user_a) voteCounts[v.debate_id].a++;
      else voteCounts[v.debate_id].b++;
    }
  });

  // Fetch all debates for topic popularity (all time)
  const { data: allDebates } = await supabase
    .from("debates")
    .select("topic, category")
    .in("status", ["active", "completed"]);

  // Fetch recent debates for trending (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentDebates } = await supabase
    .from("debates")
    .select("topic, category")
    .in("status", ["active", "completed"])
    .gte("created_at", sevenDaysAgo);

  const getCategoryLabel = (catId: string) =>
    CATEGORY_TAGS.find((c) => c.id === catId)?.label || catId;

  // Aggregate topic counts
  const aggregateTopics = (rows: { topic: string; category: string }[] | null) => {
    const map = new Map<string, { topic: string; category: string; count: number }>();
    rows?.forEach((r) => {
      if (!r.topic) return;
      const key = r.topic.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, { topic: r.topic, category: r.category, count: 0 });
      }
      map.get(key)!.count++;
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((t) => ({ ...t, categoryLabel: getCategoryLabel(t.category) }));
  };

  const trendingTopics = aggregateTopics(recentDebates);
  const allTimeTopics = aggregateTopics(allDebates);

  // Helper functions
  const getUser = (id: string) => users?.find((u) => u.id === id);
  const getStance = (userId: string, category: string) =>
    stances?.find((s) => s.user_id === userId && s.category === category)?.stance || "unknown";
  const getStanceColor = (category: string, stanceId: string) =>
    STANCE_OPTIONS[category]?.stances.find((s) => s.id === stanceId)?.color || "#6b7280";

  // Serialize debate cards for client component
  const debateCards = (debates || []).map((debate) => {
    const userA = getUser(debate.user_a);
    const userB = getUser(debate.user_b);
    const stanceA = getStance(debate.user_a, debate.category);
    const stanceB = getStance(debate.user_b, debate.category);
    const vc = voteCounts[debate.id] || { a: 0, b: 0 };

    return {
      id: debate.id,
      topic: debate.topic || "Open debate",
      category: debate.category,
      categoryLabel: STANCE_OPTIONS[debate.category]?.label || debate.category,
      createdAt: debate.created_at,
      userA: {
        username: userA?.username || "Unknown",
        color: getStanceColor(debate.category, stanceA),
      },
      userB: {
        username: userB?.username || "Unknown",
        color: getStanceColor(debate.category, stanceB),
      },
      votesA: vc.a,
      votesB: vc.b,
    };
  });

  return (
    <div className="flex flex-1 overflow-hidden">
      <BrowseClient
        debates={debateCards}
        trendingTopics={trendingTopics}
        allTimeTopics={allTimeTopics}
      />
    </div>
  );
}
