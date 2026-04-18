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

// POST /api/reports — submit a report against a user
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the reporter themselves is suspended
    const { data: reporter } = await supabase
      .from("users")
      .select("suspended_until")
      .eq("id", user.id)
      .single();

    if (reporter?.suspended_until && new Date(reporter.suspended_until) > new Date()) {
      return NextResponse.json(
        { error: "Your account is currently suspended" },
        { status: 403 }
      );
    }

    const { reported_user_id, debate_id, reason } = await req.json();

    if (!reported_user_id) {
      return NextResponse.json(
        { error: "reported_user_id is required" },
        { status: 400 }
      );
    }

    // Can't report yourself
    if (reported_user_id === user.id) {
      return NextResponse.json(
        { error: "You cannot report yourself" },
        { status: 400 }
      );
    }

    // Insert report (unique constraint prevents duplicate reports per debate)
    const { data, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        reported_user_id,
        debate_id: debate_id || null,
        reason: reason || "nudity",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You already reported this user for this debate" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ report: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/reports/check?reported_user_id=xxx&debate_id=yyy — check if user already reported
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reportedUserId = req.nextUrl.searchParams.get("reported_user_id");
    const debateId = req.nextUrl.searchParams.get("debate_id");

    if (!reportedUserId) {
      return NextResponse.json(
        { error: "reported_user_id is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("reported_user_id", reportedUserId);

    if (debateId) {
      query = query.eq("debate_id", debateId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      alreadyReported: (data?.length || 0) > 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
