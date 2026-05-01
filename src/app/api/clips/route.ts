import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/clips — create a new clip
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;
    const debateId = formData.get("debate_id") as string;
    const duration = parseInt(formData.get("duration") as string) || 0;

    if (!videoFile || !debateId) {
      return NextResponse.json(
        { error: "video file and debate_id are required" },
        { status: 400 }
      );
    }

    // Fetch debate info for metadata
    const { data: debate } = await supabase
      .from("debates")
      .select("topic, category, user_a, user_b")
      .eq("id", debateId)
      .single();

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    // Get usernames
    const { data: users } = await supabase
      .from("users")
      .select("id, username")
      .in("id", [debate.user_a, debate.user_b]);

    const userAUsername = users?.find((u) => u.id === debate.user_a)?.username || "Unknown";
    const userBUsername = users?.find((u) => u.id === debate.user_b)?.username || "Unknown";

    // Upload video to Supabase Storage
    const fileName = `${debateId}/${user.id}_${Date.now()}.webm`;
    const arrayBuffer = await videoFile.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("clips")
      .upload(fileName, arrayBuffer, {
        contentType: "video/webm",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: "Failed to upload clip" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("clips")
      .getPublicUrl(fileName);

    // Create clip record
    const { data: clip, error: insertError } = await supabase
      .from("clips")
      .insert({
        debate_id: debateId,
        creator_id: user.id,
        video_url: urlData.publicUrl,
        duration,
        debate_topic: debate.topic,
        category: debate.category,
        user_a_id: debate.user_a,
        user_a_username: userAUsername,
        user_b_id: debate.user_b,
        user_b_username: userBUsername,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: "Failed to save clip" }, { status: 500 });
    }

    return NextResponse.json({ clip }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/clips — list clips for feed
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor"); // created_at cursor for pagination
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const sort = searchParams.get("sort") || "new"; // "new" or "top"

    let query = supabase
      .from("clips")
      .select("*")
      .limit(limit);

    if (sort === "top") {
      query = query.order("score", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    if (cursor) {
      if (sort === "top") {
        query = query.lt("score", parseInt(cursor));
      } else {
        query = query.lt("created_at", cursor);
      }
    }

    const { data: clips, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get current user's votes on these clips
    const { data: { user } } = await supabase.auth.getUser();
    const userVotes: Record<string, number> = {};

    if (user && clips && clips.length > 0) {
      const { data: votes } = await supabase
        .from("clip_votes")
        .select("clip_id, vote")
        .eq("user_id", user.id)
        .in("clip_id", clips.map((c) => c.id));

      votes?.forEach((v) => {
        userVotes[v.clip_id] = v.vote;
      });
    }

    // Get creator usernames
    const creatorIds = Array.from(new Set(clips?.map((c) => c.creator_id) || []));
    const creatorMap: Record<string, string> = {};
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from("users")
        .select("id, username")
        .in("id", creatorIds);
      creators?.forEach((c) => {
        creatorMap[c.id] = c.username;
      });
    }

    const enrichedClips = clips?.map((c) => ({
      ...c,
      creator_username: creatorMap[c.creator_id] || "Unknown",
      user_vote: userVotes[c.id] || null,
    }));

    return NextResponse.json({
      clips: enrichedClips,
      nextCursor: clips && clips.length === limit
        ? sort === "top"
          ? clips[clips.length - 1].score
          : clips[clips.length - 1].created_at
        : null,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
