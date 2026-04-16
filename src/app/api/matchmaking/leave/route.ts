import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { leaveQueue } from "@/lib/matchmaking";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await leaveQueue(user.id);

    return NextResponse.json({ status: "left" });
  } catch (error) {
    console.error("Leave queue error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
