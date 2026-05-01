import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/clips/[id]/download — proxy-download clip video
// The watermark is burned client-side via canvas before download
// This route fetches the raw video from storage and streams it
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get clip record
    const { data: clip, error } = await supabase
      .from("clips")
      .select("video_url, debate_topic")
      .eq("id", id)
      .single();

    if (error || !clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Fetch the video from storage URL
    const videoRes = await fetch(clip.video_url);
    if (!videoRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch video" },
        { status: 502 }
      );
    }

    const videoBuffer = await videoRes.arrayBuffer();

    // Return video as downloadable file
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/webm",
        "Content-Disposition": `attachment; filename="commonground-clip-${id.slice(0, 8)}.webm"`,
        "Content-Length": String(videoBuffer.byteLength),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
