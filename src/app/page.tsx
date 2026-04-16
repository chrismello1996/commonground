import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { CATEGORY_TAGS } from "@/utils/constants";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let stanceCount = 0;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;

    const { count } = await supabase
      .from("user_stances")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    stanceCount = count ?? 0;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-24 px-4 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full" />

          <div className="relative max-w-3xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
              Find your opponent.
              <br />
              <span className="text-emerald-500">Win the debate.</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
              Pick your stance, get matched with someone who disagrees, and
              settle it live on video.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={stanceCount > 0 ? "/debate" : "/stances"}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {stanceCount > 0 ? "Find a Debate" : "Pick Your Stances"}
              </Link>
              {stanceCount > 0 && (
                <Link
                  href="/stances"
                  className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl text-lg transition-colors border border-gray-700"
                >
                  Edit Stances
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Category Chips */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 text-center">
              Debate Categories
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {CATEGORY_TAGS.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/stances`}
                  className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-full text-sm text-gray-300 hover:border-emerald-500/50 hover:text-white transition-colors"
                >
                  <span className="mr-1.5">{cat.icon}</span>
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Row */}
        {profile && (
          <section className="py-12 px-4">
            <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                <p className="text-3xl font-bold text-emerald-500">
                  {profile.elo}
                </p>
                <p className="text-sm text-gray-500 mt-1">ELO Rating</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                <p className="text-3xl font-bold">
                  {profile.wins}/{profile.losses}
                </p>
                <p className="text-sm text-gray-500 mt-1">W/L Record</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                <p className="text-3xl font-bold">{stanceCount}</p>
                <p className="text-sm text-gray-500 mt-1">Stances Set</p>
              </div>
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="py-16 px-4 border-t border-gray-800/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Pick Your Stances",
                  desc: "Tell us where you stand on politics, economics, philosophy, and more.",
                },
                {
                  step: "02",
                  title: "Get Matched",
                  desc: "We pair you with someone who holds the opposing view on the same topic.",
                },
                {
                  step: "03",
                  title: "Debate Live",
                  desc: "Go head-to-head on video. Make your case. Win the crowd.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-sm font-bold text-emerald-500">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 px-4 text-center text-sm text-gray-600">
        CommonGround &copy; {new Date().getFullYear()} &mdash; Free speech
        through fair debate.
      </footer>
    </div>
  );
}
