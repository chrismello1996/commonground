import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkMatch, isInQueue, type MatchResult } from "@/lib/matchmaking";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if a match has been found
    const match: MatchResult | null = await checkMatch(user.id);
    if (match) {
      // Create debate row for the matched user's side too
      const { error: debateError } = await supabase
        .from("debates")
        .upsert({
          id: match.debateId,
          user_a: match.opponent.userId,
          user_b: user.id,
          category: match.category,
          topic: match.topic,
          status: "active",
          format: "open",
        }, { onConflict: "id" });

      if (debateError) {
        console.error("Failed to upsert debate:", debateError);
      }

      return NextResponse.json({
        status: "matched",
        debateId: match.debateId,
        topic: match.topic,
        opponent: match.opponent,
      });
    }

    // Check if still in queue
    const queueCategory = await isInQueue(user.id);
    if (queueCategory) {
      return NextResponse.json({ status: "queued", category: queueCategory });
    }

    // Not in queue and no match
    return NextResponse.json({ status: "idle" });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
