import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { debateId } = await request.json();

    if (!debateId) {
      return NextResponse.json({ error: "Debate ID is required" }, { status: 400 });
    }

    // Verify user is part of this debate
    const { data: debate } = await supabase
      .from("debates")
      .select("*")
      .eq("id", debateId)
      .single();

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    if (debate.user_a !== user.id && debate.user_b !== user.id) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    if (debate.status !== "active") {
      return NextResponse.json({ error: "Debate already ended" }, { status: 400 });
    }

    // End the debate
    const { error: updateError } = await supabase
      .from("debates")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
      })
      .eq("id", debateId);

    if (updateError) {
      console.error("Failed to end debate:", updateError);
      return NextResponse.json({ error: "Failed to end debate" }, { status: 500 });
    }

    return NextResponse.json({ status: "ended", debateId });
  } catch (error) {
    console.error("End debate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
