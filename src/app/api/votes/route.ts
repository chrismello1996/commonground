import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/votes — cast or switch a vote for a debater
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: max 10 vote actions per 60 seconds per user
    const { success } = rateLimit(`vote:${user.id}`, 10, 60_000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many vote requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const { debate_id, voted_for } = await req.json();

    if (!debate_id || !voted_for) {
      return NextResponse.json(
        { error: "debate_id and voted_for are required" },
        { status: 400 }
      );
    }

    // Anti-cheat: debaters cannot vote in their own debate
    const { data: debate, error: debateError } = await supabase
      .from("debates")
      .select("user_a, user_b")
      .eq("id", debate_id)
      .single();

    if (debateError || !debate) {
      return NextResponse.json(
        { error: "Debate not found" },
        { status: 404 }
      );
    }

    if (debate.user_a === user.id || debate.user_b === user.id) {
      return NextResponse.json(
        { error: "Debaters cannot vote in their own debate" },
        { status: 403 }
      );
    }

    // Anti-cheat: cannot vote for yourself
    if (voted_for === user.id) {
      return NextResponse.json(
        { error: "You cannot vote for yourself" },
        { status: 403 }
      );
    }

    // Validate voted_for is actually one of the debaters
    if (voted_for !== debate.user_a && voted_for !== debate.user_b) {
      return NextResponse.json(
        { error: "voted_for must be one of the debaters" },
        { status: 400 }
      );
    }

    // Check if user already voted in this debate
    const { data: existingVote, error: lookupError } = await supabase
      .from("debate_votes")
      .select("id, voted_for")
      .eq("debate_id", debate_id)
      .eq("voter_id", user.id)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: "Failed to check existing vote" }, { status: 500 });
    }

    if (existingVote) {
      if (existingVote.voted_for === voted_for) {
        // Already voted for same person — no change needed
        return NextResponse.json({ vote: existingVote, changed: false }, { status: 200 });
      }

      // Switch vote: delete old vote first
      const { error: deleteError } = await supabase
        .from("debate_votes")
        .delete()
        .eq("id", existingVote.id);

      if (deleteError) {
        return NextResponse.json(
          { error: "Failed to switch vote" },
          { status: 500 }
        );
      }
    }

    // Insert new vote
    const { data, error } = await supabase
      .from("debate_votes")
      .insert({
        debate_id,
        voter_id: user.id,
        voted_for,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vote: data, changed: !!existingVote }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/votes?debate_id=xxx — get vote counts for a debate
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const debateId = req.nextUrl.searchParams.get("debate_id");

    if (!debateId) {
      return NextResponse.json(
        { error: "debate_id is required" },
        { status: 400 }
      );
    }

    // Get all votes for the debate
    const { data: votes, error } = await supabase
      .from("debate_votes")
      .select("voted_for")
      .eq("debate_id", debateId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count votes per debater
    const counts: Record<string, number> = {};
    votes?.forEach((v) => {
      counts[v.voted_for] = (counts[v.voted_for] || 0) + 1;
    });

    // Check if current user already voted
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userVote = null;
    if (user) {
      const { data: existingVote } = await supabase
        .from("debate_votes")
        .select("voted_for")
        .eq("debate_id", debateId)
        .eq("voter_id", user.id)
        .maybeSingle();
      userVote = existingVote?.voted_for || null;
    }

    return NextResponse.json({
      counts,
      total: votes?.length || 0,
      userVote,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
