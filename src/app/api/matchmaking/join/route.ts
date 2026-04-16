import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { joinQueue, type QueueEntry } from "@/lib/matchmaking";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category } = await request.json();

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("username, elo")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get user's stance for this category (if not "anything")
    let stance = "any";
    if (category !== "anything") {
      const { data: stanceData } = await supabase
        .from("user_stances")
        .select("stance")
        .eq("user_id", user.id)
        .eq("category", category)
        .single();

      if (!stanceData) {
        return NextResponse.json(
          { error: "You need to pick a stance for this category first. Visit /stances to set one." },
          { status: 400 }
        );
      }
      stance = stanceData.stance;
    }

    const entry: QueueEntry = {
      userId: user.id,
      username: profile.username,
      category,
      stance,
      elo: profile.elo,
      joinedAt: Date.now(),
    };

    const result = await joinQueue(entry);

    if (result.match) {
      // Instant match — create debate in Supabase
      const { error: debateError } = await supabase
        .from("debates")
        .insert({
          id: result.match.debateId,
          user_a: user.id,
          user_b: result.match.opponent.userId,
          category: result.match.category,
          topic: result.match.topic,
          status: "active",
          format: "open",
        })
        .select()
        .single();

      if (debateError) {
        console.error("Failed to create debate:", debateError);
        return NextResponse.json({ error: "Failed to create debate" }, { status: 500 });
      }

      return NextResponse.json({
        status: "matched",
        debateId: result.match.debateId,
        topic: result.match.topic,
        opponent: result.match.opponent,
      });
    }

    return NextResponse.json({ status: "queued", category });
  } catch (error) {
    console.error("Join queue error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
