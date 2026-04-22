import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { STANCE_OPTIONS, CATEGORY_TAGS } from "@/utils/constants";
import TrendingTopics from "@/components/browse/TrendingTopics";

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

  // Fetch stances for all users in their debate categories
  const stanceQueries: { user_id: string; category: string }[] = [];
  debates?.forEach((d) => {
    stanceQueries.push({ user_id: d.user_a, category: d.category });
    stanceQueries.push({ user_id: d.user_b, category: d.category });
  });

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
    // We'll count by who was voted for
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

  const getUser = (id: string) => users?.find((u) => u.id === id);
  const getStance = (userId: string, category: string) =>
    stances?.find((s) => s.user_id === userId && s.category === category)?.stance || "unknown";
  const getStanceColor = (category: string, stanceId: string) =>
    STANCE_OPTIONS[category]?.stances.find((s) => s.id === stanceId)?.color || "#6b7280";

  const formatTime = (createdAt: string) => {
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const s = (elapsed % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold">Live Debates</h2>
          <span className="text-xs text-gray-400 font-medium">
            {debates?.length || 0} live now
          </span>
        </div>

        {/* Stream Grid */}
        {debates && debates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {debates.map((debate) => {
              const userA = getUser(debate.user_a);
              const userB = getUser(debate.user_b);
              const stanceA = getStance(debate.user_a, debate.category);
              const stanceB = getStance(debate.user_b, debate.category);
              const colorA = getStanceColor(debate.category, stanceA);
              const colorB = getStanceColor(debate.category, stanceB);
              const vc = voteCounts[debate.id] || { a: 0, b: 0 };
              const totalVotes = vc.a + vc.b;
              const pctA = totalVotes > 0 ? Math.round((vc.a / totalVotes) * 100) : 50;

              return (
                <Link
                  href={`/browse/watch/${debate.id}`}
                  key={debate.id}
                  className="rounded-lg overflow-hidden cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md block border border-gray-100"
                >
                  {/* Thumbnail */}
                  <div className="h-40 bg-gray-100 relative flex items-center justify-center">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-lg font-extrabold text-white"
                        style={{ background: colorA }}
                      >
                        {(userA?.username || "?")[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-black text-emerald-600">VS</span>
                      <div
                        className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-lg font-extrabold text-white"
                        style={{ background: colorB }}
                      >
                        {(userB?.username || "?")[0].toUpperCase()}
                      </div>
                    </div>
                    {/* LIVE badge */}
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                      LIVE
                    </div>
                    {/* Time */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      {formatTime(debate.created_at)}
                    </div>
                    {/* Vote bar mini */}
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] flex">
                      <div className="bg-emerald-500 transition-all" style={{ width: `${pctA}%` }} />
                      <div className="bg-amber-800 flex-1" />
                    </div>
                  </div>
                  {/* Info */}
                  <div className="py-2 px-2.5">
                    <p className="text-xs font-semibold truncate leading-tight">{debate.topic}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {userA?.username || "Unknown"} vs {userB?.username || "Unknown"}
                    </p>
                    <div className="flex gap-1 mt-1 items-center">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
                        {STANCE_OPTIONS[debate.category]?.label || debate.category}
                      </span>
                      {totalVotes > 0 && (
                        <span className="text-[9px] text-gray-400 ml-auto">
                          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No live debates right now</p>
            <p className="text-xs text-gray-400 mb-4">Start one and be the first!</p>
            <Link
              href="/debate"
              className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition"
            >
              Find a Debate
            </Link>
          </div>
        )}
      </div>

      {/* Trending Topics Sidebar */}
      <TrendingTopics trending={trendingTopics} allTime={allTimeTopics} />
    </div>
  );
}
