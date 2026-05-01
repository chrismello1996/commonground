import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Expire stale challenges first
    await supabase
      .from("debate_challenges")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());

    // Fetch incoming pending challenges
    const { data: incoming } = await supabase
      .from("debate_challenges")
      .select("*")
      .eq("challenged_id", user.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    // Fetch outgoing pending challenges
    const { data: outgoing } = await supabase
      .from("debate_challenges")
      .select("*")
      .eq("challenger_id", user.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    // Fetch recently accepted challenges (to detect redirect)
    const { data: accepted } = await supabase
      .from("debate_challenges")
      .select("*")
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .eq("status", "accepted")
      .gt("responded_at", new Date(Date.now() - 30 * 1000).toISOString())
      .order("responded_at", { ascending: false })
      .limit(1);

    // Get user profiles for all challenge participants
    const userIds = new Set<string>();
    [...(incoming || []), ...(outgoing || []), ...(accepted || [])].forEach((c) => {
      userIds.add(c.challenger_id);
      userIds.add(c.challenged_id);
    });

    const { data: profiles } = userIds.size > 0
      ? await supabase
          .from("users")
          .select("id, username, display_name, elo")
          .in("id", Array.from(userIds))
      : { data: [] };

    const profileMap: Record<string, { username: string; display_name: string; elo: number }> = {};
    profiles?.forEach((p) => { profileMap[p.id] = p; });

    const enrichChallenge = (c: Record<string, unknown>) => ({
      ...c,
      challenger: profileMap[c.challenger_id as string] || { username: "Unknown", elo: 1200 },
      challenged: profileMap[c.challenged_id as string] || { username: "Unknown", elo: 1200 },
    });

    return NextResponse.json({
      incoming: (incoming || []).map(enrichChallenge),
      outgoing: (outgoing || []).map(enrichChallenge),
      accepted: (accepted || []).map(enrichChallenge),
    });
  } catch (error) {
    console.error("Challenges list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
