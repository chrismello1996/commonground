import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { challengeId, action } = await req.json();

    if (!challengeId || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Missing challengeId or invalid action" }, { status: 400 });
    }

    // Fetch the challenge
    const { data: challenge } = await supabase
      .from("debate_challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Only the challenged user can respond
    if (challenge.challenged_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to respond" }, { status: 403 });
    }

    if (challenge.status !== "pending") {
      return NextResponse.json({ error: "Challenge already responded to" }, { status: 400 });
    }

    // Check if expired
    if (new Date(challenge.expires_at) < new Date()) {
      await supabase
        .from("debate_challenges")
        .update({ status: "expired" })
        .eq("id", challengeId);
      return NextResponse.json({ error: "Challenge has expired" }, { status: 410 });
    }

    if (action === "decline") {
      await supabase
        .from("debate_challenges")
        .update({ status: "declined", responded_at: new Date().toISOString() })
        .eq("id", challengeId);

      return NextResponse.json({ status: "declined" });
    }

    // Accept — create a debate with the challenge's format
    const { data: debate, error: debateError } = await supabase
      .from("debates")
      .insert({
        user_a: challenge.challenger_id,
        user_b: challenge.challenged_id,
        category: "anything",
        topic: "Open debate — discuss anything!",
        status: "active",
        format: challenge.format || "open_mic",
      })
      .select()
      .single();

    if (debateError || !debate) {
      return NextResponse.json({ error: "Failed to create debate" }, { status: 500 });
    }

    // Update challenge with debate reference
    await supabase
      .from("debate_challenges")
      .update({
        status: "accepted",
        debate_id: debate.id,
        responded_at: new Date().toISOString(),
      })
      .eq("id", challengeId);

    return NextResponse.json({
      status: "accepted",
      debateId: debate.id,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
