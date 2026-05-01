import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/takedown — submit a takedown request
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: max 5 takedown requests per hour per user
    const { success } = rateLimit(`takedown:${user.id}`, 5, 3600_000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      reporterEmail,
      reporterName,
      reportedUsername,
      reportedUserId,
      debateId,
      clipId,
      contentType,
      description,
      contentUrl,
    } = body;

    // Validate required fields
    if (!reporterEmail || !contentType || !description) {
      return NextResponse.json(
        { error: "Email, content type, and description are required" },
        { status: 400 }
      );
    }

    // Validate content type
    const validTypes = ["intimate_image", "deepfake", "nonconsensual_recording", "other"];
    if (!validTypes.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Insert takedown request with 48-hour deadline
    const { data, error } = await supabase
      .from("takedown_requests")
      .insert({
        reporter_id: user.id,
        reporter_email: reporterEmail,
        reporter_name: reporterName || null,
        reported_user_id: reportedUserId || null,
        reported_username: reportedUsername || null,
        debate_id: debateId || null,
        clip_id: clipId || null,
        content_type: contentType,
        description,
        content_url: contentUrl || null,
        status: "pending",
      })
      .select("id, status, deadline_at, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to submit request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "submitted",
      request: data,
      message:
        "Your takedown request has been received. We are required by law to review and act on this within 48 hours.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/takedown — list your submitted requests
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("takedown_requests")
      .select("id, content_type, status, deadline_at, created_at, resolved_at")
      .eq("reporter_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: data || [] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
