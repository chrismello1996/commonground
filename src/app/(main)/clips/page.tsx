import ClipsFeed from "@/components/clips/ClipsFeed";
import { createClient } from "@/lib/supabase/server";

export default async function ClipsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <ClipsFeed currentUserId={user?.id || null} />;
}
