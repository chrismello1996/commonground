import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// --- ELO Configuration ---
const K_FACTOR = 32;
const MIN_DEBATE_DURATION_SECS = 60; // Must last 60s+ to affect ELO
const MIN_VOTES_FOR_ELO = 2; // Need 2+ spectator votes
const SAME_OPPONENT_COOLDOWN_MINS = 30; // No ELO from same opponent within 30 min

/**
 * Standard ELO calculation.
 * scoreA: 1 = A wins, 0 = B wins, 0.5 = draw
 */
function calculateElo(
  ratingA: number,
  ratingB: number,
  scoreA: number
): [number, number] {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;
  const newA = Math.round(ratingA + K_FACTOR * (scoreA - expectedA));
  const newB = Math.round(ratingB + K_FACTOR * (1 - scoreA - expectedB));
  return [Math.max(100, newA), Math.max(100, newB)];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { debateId } = await request.json();

    if (!debateId) {
      return NextResponse.json({ error: "Debate ID is required" }, { status: 400 });
    }

    // Fetch debate
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

    // --- Duration check ---
    const durationSecs = Math.floor(
      (Date.now() - new Date(debate.created_at).getTime()) / 1000
    );
    const durationMet = durationSecs >= MIN_DEBATE_DURATION_SECS;

    // --- Count votes ---
    const { data: votes } = await supabase
      .from("debate_votes")
      .select("voted_for")
      .eq("debate_id", debateId);

    let votesA = 0;
    let votesB = 0;
    for (const v of votes || []) {
      if (v.voted_for === debate.user_a) votesA++;
      else if (v.voted_for === debate.user_b) votesB++;
    }
    const totalVotes = votesA + votesB;

    // --- Determine winner ---
    let winnerId: string | null = null;
    let loserId: string | null = null;
    let eloProcessed = false;
    let reason = "";

    if (!durationMet) {
      reason = `Debate too short (${durationSecs}s, need ${MIN_DEBATE_DURATION_SECS}s)`;
    } else if (totalVotes < MIN_VOTES_FOR_ELO) {
      reason = `Not enough votes (${totalVotes}, need ${MIN_VOTES_FOR_ELO})`;
    } else if (votesA === votesB) {
      reason = "Tied vote — no ELO change";
    } else {
      winnerId = votesA > votesB ? debate.user_a : debate.user_b;
      loserId = votesA > votesB ? debate.user_b : debate.user_a;
    }

    // --- Anti-cheat: same opponent cooldown ---
    let sameOpponentBlock = false;
    if (winnerId) {
      const { data: winnerProfile } = await supabase
        .from("users")
        .select("last_opponent_id, last_opponent_at, elo")
        .eq("id", winnerId)
        .single();

      if (
        winnerProfile?.last_opponent_id === loserId &&
        winnerProfile?.last_opponent_at
      ) {
        const minutesSince =
          (Date.now() - new Date(winnerProfile.last_opponent_at).getTime()) /
          1000 /
          60;
        if (minutesSince < SAME_OPPONENT_COOLDOWN_MINS) {
          sameOpponentBlock = true;
          reason = `Same opponent cooldown (${Math.round(minutesSince)}min < ${SAME_OPPONENT_COOLDOWN_MINS}min)`;
        }
      }
    }

    // --- Apply ELO ---
    if (winnerId && loserId && !sameOpponentBlock) {
      const { data: profileA } = await supabase
        .from("users")
        .select("elo")
        .eq("id", debate.user_a)
        .single();
      const { data: profileB } = await supabase
        .from("users")
        .select("elo")
        .eq("id", debate.user_b)
        .single();

      const eloA = profileA?.elo ?? 1200;
      const eloB = profileB?.elo ?? 1200;
      const scoreA = winnerId === debate.user_a ? 1 : 0;
      const [newEloA, newEloB] = calculateElo(eloA, eloB, scoreA);

      // Update winner: new ELO + increment wins + track opponent
      await supabase
        .from("users")
        .update({
          elo: winnerId === debate.user_a ? newEloA : newEloB,
          last_opponent_id: loserId,
          last_opponent_at: new Date().toISOString(),
        })
        .eq("id", winnerId);

      await supabase.rpc("increment_field", {
        row_id: winnerId,
        field_name: "wins",
        increment_by: 1,
      });

      // Update loser: new ELO + increment losses + track opponent
      await supabase
        .from("users")
        .update({
          elo: loserId === debate.user_a ? newEloA : newEloB,
          last_opponent_id: winnerId,
          last_opponent_at: new Date().toISOString(),
        })
        .eq("id", loserId);

      await supabase.rpc("increment_field", {
        row_id: loserId,
        field_name: "losses",
        increment_by: 1,
      });

      eloProcessed = true;
      reason = "ELO updated";
    }

    // --- End the debate ---
    const { error: updateError } = await supabase
      .from("debates")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        winner_id: winnerId && !sameOpponentBlock ? winnerId : null,
        elo_processed: eloProcessed,
        votes_a: votesA,
        votes_b: votesB,
        min_duration_met: durationMet,
      })
      .eq("id", debateId);

    if (updateError) {
      console.error("Failed to end debate:", updateError);
      return NextResponse.json({ error: "Failed to end debate" }, { status: 500 });
    }

    return NextResponse.json({
      status: "ended",
      debateId,
      winner: winnerId && !sameOpponentBlock ? winnerId : null,
      votesA,
      votesB,
      eloProcessed,
      durationSecs,
      reason,
    });
  } catch (error) {
    console.error("End debate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
