import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component context
          }
        },
      },
    }
  );
}

// POST /api/votes — cast a vote for a debater
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { debate_id, voted_for } = await req.json();

    if (!debate_id || !voted_for) {
      return NextResponse.json(
        { error: "debate_id and voted_for are required" },
        { status: 400 }
      );
    }

    // Anti-cheat: debaters cannot vote in their own debate
    const { data: debate } = await supabase
      .from("debates")
      .select("user_a, user_b")
      .eq("id", debate_id)
      .single();

    if (debate && (debate.user_a === user.id || debate.user_b === user.id)) {
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

    // Check if user already voted in this debate
    const { data: existingVote } = await supabase
      .from("debate_votes")
      .select("id, voted_for")
      .eq("debate_id", debate_id)
      .eq("voter_id", user.id)
      .maybeSingle();

    if (existingVote) {
      if (existingVote.voted_for === voted_for) {
        // Already voted for same person — no change needed
        return NextResponse.json({ vote: existingVote, changed: false }, { status: 200 });
      }
      // Switch vote: delete old, insert new
      await supabase
        .from("debate_votes")
        .delete()
        .eq("id", existingVote.id);
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
      console.error("Vote insert error:", error);
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
    const supabase = await getSupabase();
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
        .single();
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
