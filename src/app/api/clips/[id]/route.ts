import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/clips/[id] — get a single clip by ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: clip, error } = await supabase
      .from("clips")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Get creator username
    const { data: creator } = await supabase
      .from("users")
      .select("username")
      .eq("id", clip.creator_id)
      .single();

    // Get current user's vote
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userVote = null;
    if (user) {
      const { data: vote } = await supabase
        .from("clip_votes")
        .select("vote")
        .eq("clip_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      userVote = vote?.vote || null;
    }

    // Get vote counts
    const { data: votes } = await supabase
      .from("clip_votes")
      .select("vote")
      .eq("clip_id", id);

    const upvotes = votes?.filter((v) => v.vote === 1).length || 0;
    const downvotes = votes?.filter((v) => v.vote === -1).length || 0;

    return NextResponse.json({
      clip: {
        ...clip,
        creator_username: creator?.username || "Unknown",
        user_vote: userVote,
        upvotes,
        downvotes,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
