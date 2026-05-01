import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ClipDetail from "./ClipDetail";

interface ClipPageProps {
  params: Promise<{ id: string }>;
}

// Generate dynamic OG meta tags for social media previews
export async function generateMetadata({
  params,
}: ClipPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: clip } = await supabase
    .from("clips")
    .select("debate_topic, user_a_username, user_b_username, video_url")
    .eq("id", id)
    .single();

  if (!clip) {
    return {
      title: "Clip Not Found — CommonGround",
      description: "This clip does not exist or has been removed.",
    };
  }

  const title = clip.debate_topic
    ? `${clip.debate_topic} — CommonGround Debate Clip`
    : "Debate Clip — CommonGround";
  const description = `Watch ${clip.user_a_username} vs ${clip.user_b_username} debate live on CommonGround. Vote for who's winning!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
      url: `https://www.commongrounddebate.com/clip/${id}`,
      siteName: "CommonGround",
      videos: clip.video_url
        ? [
            {
              url: clip.video_url,
              type: "video/webm",
              width: 1280,
              height: 360,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "player",
      title,
      description,
      players: clip.video_url
        ? [
            {
              playerUrl: `https://www.commongrounddebate.com/clip/${id}`,
              streamUrl: clip.video_url,
              width: 1280,
              height: 360,
            },
          ]
        : undefined,
    },
  };
}

export default async function ClipPage({ params }: ClipPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <ClipDetail clipId={id} currentUserId={user?.id || null} />;
}
