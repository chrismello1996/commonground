import { NextResponse } from "next/server";
import { getQueueStats } from "@/lib/matchmaking";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Auth check — only authenticated users can view queue stats
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getQueueStats();
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({ stats, total });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
