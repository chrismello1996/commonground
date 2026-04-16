import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { debateId } = await request.json();

    if (!debateId) {
      return NextResponse.json({ error: "Debate ID is required" }, { status: 400 });
    }

    // Verify user is part of this debate
    const { data: debate } = await supabase
      .from("debates")
      .select("user_a, user_b, status")
      .eq("id", debateId)
      .single();

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    if (debate.user_a !== user.id && debate.user_b !== user.id) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    if (debate.status !== "active") {
      return NextResponse.json({ error: "Debate is not active" }, { status: 400 });
    }

    // Get user profile for display name
    const { data: profile } = await supabase
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single();

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret || apiKey === "your_livekit_api_key_here") {
      // Return a dev-mode response so the UI still works without LiveKit configured
      return NextResponse.json({
        token: null,
        devMode: true,
        message: "LiveKit not configured — video disabled, chat still works",
      });
    }

    // Generate LiveKit access token
    const roomName = `debate-${debateId}`;
    const participantIdentity = user.id;
    const participantName = profile?.username || "Anonymous";

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: "2h",
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      devMode: false,
      roomName,
    });
  } catch (error) {
    console.error("LiveKit token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
