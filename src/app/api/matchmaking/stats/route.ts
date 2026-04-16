import { NextResponse } from "next/server";
import { getQueueStats } from "@/lib/matchmaking";

export async function GET() {
  try {
    const stats = await getQueueStats();
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({ stats, total });
  } catch (error) {
    console.error("Queue stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
