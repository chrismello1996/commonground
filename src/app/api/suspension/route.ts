import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

// GET /api/suspension — check if current user is suspended
export async function GET() {
  try {
    const supabase = await getSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("suspended_until, suspension_reason, strike_count")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ suspended: false });
    }

    const isSuspended =
      profile.suspended_until && new Date(profile.suspended_until) > new Date();

    return NextResponse.json({
      suspended: !!isSuspended,
      suspended_until: isSuspended ? profile.suspended_until : null,
      reason: isSuspended ? profile.suspension_reason : null,
      strike_count: profile.strike_count || 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
