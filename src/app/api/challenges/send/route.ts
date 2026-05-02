import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { challengedId, message, format } = await req.json();

    if (!challengedId) {
      return NextResponse.json({ error: "Missing challengedId" }, { status: 400 });
    }

    if (challengedId === user.id) {
      return NextResponse.json({ error: "Cannot challenge yourself" }, { status: 400 });
    }

    // Check if challenger is suspended
    const { data: profile } = await supabase
      .from("users")
      .select("suspended_until")
      .eq("id", user.id)
      .single();

    if (profile?.suspended_until && new Date(profile.suspended_until) > new Date()) {
      return NextResponse.json({ error: "Your account is suspended" }, { status: 403 });
    }

    // Check for existing pending challenge between these users
    const { data: existing } = await supabase
      .from("debate_challenges")
      .select("id")
      .eq("challenger_id", user.id)
      .eq("challenged_id", challengedId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "You already have a pending challenge with this user" }, { status: 409 });
    }

    // Create challenge (expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data: challenge, error: insertError } = await supabase
      .from("debate_challenges")
      .insert({
        challenger_id: user.id,
        challenged_id: challengedId,
        message: message || null,
        format: format || "unstructured",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: "Failed to send challenge" }, { status: 500 });
    }

    return NextResponse.json({ status: "sent", challenge });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
