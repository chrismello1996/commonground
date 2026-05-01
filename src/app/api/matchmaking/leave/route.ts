import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";

const QUEUE_KEY = "matchmaking:queue";

export async function POST(req: Request) {
  try {
    // Auth check — only authenticated users can leave queue
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();

    // Ensure user can only remove themselves from queue
    if (!userId || userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
