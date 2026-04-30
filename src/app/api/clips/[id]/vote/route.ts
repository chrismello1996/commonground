import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/clips/[id]/vote — upvote or downvote a clip
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clipId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { vote } = await request.json(); // 1 or -1

    if (vote !== 1 && vote !== -1) {
      return NextResponse.json(
        { error: "vote must be 1 (upvote) or -1 (downvote)" },
        { status: 400 }
      );
    }

    // Check if clip exists
    const { data: clip } = await supabase
      .from("clips")
      .select("id, score")
      .eq("id", clipId)
      .single();

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Check for existing vote
    const { data: existingVote } = await supabase
      .from("clip_votes")
      .select("id, vote")
      .eq("clip_id", clipId)
      .eq("user_id", user.id)
      .maybeSingle();

    let scoreDelta = 0;

    if (existingVote) {
      if (existingVote.vote === vote) {
        // Same vote — remove it (toggle off)
        await supabase
          .from("clip_votes")
          .delete()
          .eq("id", existingVote.id);
        scoreDelta = -vote; // reverse the vote
      } else {
        // Different vote — update it
        await supabase
          .from("clip_votes")
          .update({ vote })
          .eq("id", existingVote.id);
        scoreDelta = vote * 2; // swing from -1 to +1 or vice versa
      }
    } else {
      // New vote
      await supabase
        .from("clip_votes")
        .insert({ clip_id: clipId, user_id: user.id, vote });
      scoreDelta = vote;
    }

    // Update clip score
    const newScore = clip.score + scoreDelta;
    await supabase
      .from("clips")
      .update({ score: newScore })
      .eq("id", clipId);

    return NextResponse.json({
      score: newScore,
      userVote: existingVote?.vote === vote ? null : vote,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
