import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/moderation/report — log an NSFW violation
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: max 10 moderation reports per minute per user
    // (prevents spam but allows legit rapid detections)
    const { success } = rateLimit(`moderation:${user.id}`, 10, 60_000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many reports" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      debateId,
      violationType = "nsfw_content",
      detectionSource = "client_nsfwjs",
      confidence,
    } = body;

    // Validate
    const validTypes = ["nsfw_content", "nudity", "sexual_content", "violence", "other"];
    if (!validTypes.includes(violationType)) {
      return NextResponse.json({ error: "Invalid violation type" }, { status: 400 });
    }

    // Log the moderation event
    const { error: insertError } = await supabase
      .from("moderation_events")
      .insert({
        user_id: user.id,
        debate_id: debateId || null,
        violation_type: violationType,
        detection_source: detectionSource,
        confidence: confidence || null,
        action_taken: "auto_disconnect",
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to log moderation event" },
        { status: 500 }
      );
    }

    // Count total violations for this user
    const { count } = await supabase
      .from("moderation_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const totalViolations = count || 0;

    // Progressive suspension logic:
    // 1st offense: warning (already disconnected from debate)
    // 2nd offense: 1 hour suspension
    // 3rd offense: 24 hour suspension
    // 4th+ offense: permanent suspension
    let suspendUntil: string | null = null;
    let suspensionType: string | null = null;

    if (totalViolations >= 4) {
      // Permanent ban — set far future date
      suspendUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      suspensionType = "permanent";
    } else if (totalViolations === 3) {
      suspendUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      suspensionType = "24h";
    } else if (totalViolations === 2) {
      suspendUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      suspensionType = "1h";
    }

    // Apply suspension if needed
    if (suspendUntil) {
      await supabase
        .from("users")
        .update({
          suspended_until: suspendUntil,
          suspension_reason: `NSFW content violation (offense #${totalViolations})`,
        })
        .eq("id", user.id);
    }

    return NextResponse.json({
      logged: true,
      totalViolations,
      suspensionType,
      message:
        totalViolations === 1
          ? "Warning: NSFW content is not allowed. Further violations will result in suspension."
          : suspensionType === "permanent"
          ? "Your account has been permanently suspended for repeated NSFW violations."
          : suspendUntil
          ? `Your account has been suspended for ${suspensionType} due to NSFW violations.`
          : "Violation logged.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
