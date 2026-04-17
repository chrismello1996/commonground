import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const MATCH_PREFIX = "matchmaking:match:";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
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
  } catch (error) {
    console.error("Matchmaking poll error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
