import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";

const MATCH_PREFIX = "matchmaking:match:";

export async function POST(req: Request) {
  try {
    // Auth check — only authenticated users can poll for matches
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();

    // Ensure user can only poll their own match status
    if (!userId || userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if there's a match result stored for this user
    const matchData = await redis.get(`${MATCH_PREFIX}${userId}`);

    if (matchData) {
      const parsed = typeof matchData === "string" ? JSON.parse(matchData) : matchData;
      // Clean up the match key
      await redis.del(`${MATCH_PREFIX}${userId}`);
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ matched: false });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
