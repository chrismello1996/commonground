import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redis } from "@/lib/redis";

const MATCH_PREFIX = "matchmaking:match:";
const QUEUE_KEY = "matchmaking:queue";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if a match has been found (same key prefix as join route)
    const matchData = await redis.get(`${MATCH_PREFIX}${user.id}`);
    if (matchData) {
      const parsed = typeof matchData === "string" ? JSON.parse(matchData) : matchData;
      // Clean up the match key after reading
      await redis.del(`${MATCH_PREFIX}${user.id}`);

      return NextResponse.json({
        status: "matched",
        debateId: parsed.debateId,
        topic: parsed.topic || "Open debate",
        opponent: parsed.opponent || { userId: "unknown", username: "Opponent", stance: "unknown", elo: 1200 },
      });
    }

    // Check if still in queue
    const queueRaw = await redis.lrange(QUEUE_KEY, 0, -1);
    const inQueue = queueRaw.some((raw) => {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return parsed.userId === user.id;
    });

    if (inQueue) {
      return NextResponse.json({ status: "queued" });
    }

    // Not in queue and no match
    return NextResponse.json({ status: "idle" });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
