import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const QUEUE_KEY = "matchmaking:queue";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Remove user from queue
    const queueRaw = await redis.lrange(QUEUE_KEY, 0, -1);
    for (const raw of queueRaw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed.userId === userId) {
        await redis.lrem(QUEUE_KEY, 1, raw);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Matchmaking leave error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
