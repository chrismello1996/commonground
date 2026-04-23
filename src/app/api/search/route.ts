import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [], debates: [] });
  }

  const supabase = await createClient();

  // Search users by username (case-insensitive prefix match)
  const { data: users } = await supabase
    .from("users")
    .select("id, username, display_name, elo")
    .ilike("username", `%${q}%`)
    .order("elo", { ascending: false })
    .limit(5);

  // Search active debates by topic (case-insensitive)
  const { data: debates } = await supabase
    .from("debates")
    .select("id, topic, category, status")
    .ilike("topic", `%${q}%`)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    users: users || [],
    debates: debates || [],
  });
}
