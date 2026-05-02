import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StancePicker from "@/components/debate/StancePicker";
import CountryPicker from "@/components/profile/CountryPicker";

export default async function StancesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch existing stances
  const { data: stances } = await supabase
    .from("user_stances")
    .select("*")
    .eq("user_id", user.id);

  const existingStances: Record<string, string> = {};
  stances?.forEach((s) => {
    existingStances[s.category] = s.stance;
  });

  // Fetch current country
  const { data: profile } = await supabase
    .from("users")
    .select("country")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pick Your Stances</h1>
        <p className="text-gray-500 mt-2">
          Choose where you stand on each topic. We&apos;ll match you with
          opponents who disagree.
        </p>
      </div>
      <CountryPicker userId={user.id} currentCountry={profile?.country || null} />
      <StancePicker userId={user.id} existingStances={existingStances} />
    </div>
  );
}
