import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";


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
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 overflow-y-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="font-brand text-4xl sm:text-5xl tracking-wide mb-3 text-brand-gradient">
            CommonGround
          </h1>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-3 text-gray-900">
            Real Talk.<br />
            <span className="text-brand-gradient">No Filter.</span>
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Get matched for live video conversation. Zero censorship. The audience votes. Your ELO rises or falls.
          </p>
          <p className="text-xs text-gray-400 mt-2 italic">
            CommonGround is for debate. Keep your clothes on. Everything else is fair game.
          </p>
        </div>

        {/* Match Options */}
        <div className="flex gap-4 mb-10 flex-wrap justify-center">
          <Link
            href={stanceCount > 0 ? "/debate" : "/stances"}
            className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 w-52 text-center hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              {stanceCount > 0 ? "Find a Debate" : "Pick Stances First"}
            </h3>
            <p className="text-[11px] text-gray-500 leading-snug">
              {stanceCount > 0
                ? "Get matched with someone who disagrees"
                : "Choose where you stand on key topics"}
            </p>
          </Link>
          <Link
            href="/browse"
            className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 w-52 text-center hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Browse Live</h3>
            <p className="text-[11px] text-gray-500 leading-snug">
              Watch live debates and vote for the winner
            </p>
          </Link>
          {stanceCount > 0 && (
            <Link
              href="/stances"
              className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 w-52 text-center hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Edit Stances</h3>
              <p className="text-[11px] text-gray-500 leading-snug">
                Update your positions on topics
              </p>
            </Link>
          )}
        </div>

        {/* Stats Row */}
        {profile && (
          <div className="grid grid-cols-4 gap-4 max-w-lg w-full mb-10">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
              <p className="text-2xl font-black text-emerald-500">{profile.elo}</p>
              <p className="text-[11px] text-gray-400 mt-1 font-medium">ELO Rating</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
              <p className="text-2xl font-black text-gray-900">
                {profile.wins}/{profile.losses}
              </p>
              <p className="text-[11px] text-gray-400 mt-1 font-medium">W/L Record</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
              <p className="text-2xl font-black text-amber-500">{profile.total_votes_received || 0}</p>
              <p className="text-[11px] text-gray-400 mt-1 font-medium">Total Votes</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
              <p className="text-2xl font-black text-gray-900">{stanceCount}</p>
              <p className="text-[11px] text-gray-400 mt-1 font-medium">Stances Set</p>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="w-full max-w-3xl border-t border-gray-200 pt-12 mb-8">
          <h2 className="text-xl font-extrabold text-center mb-10 text-gray-900">How It Works</h2>
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
                <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xs font-bold text-emerald-600">{item.step}</span>
                </div>
                <h3 className="font-bold text-sm mb-2 text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-5 px-4 text-center text-xs text-gray-400">
        <p>CommonGround &copy; {new Date().getFullYear()} &mdash; Free speech through fair debate.</p>
        <p className="mt-1">
          <Link href="/terms" className="text-emerald-500 hover:underline">Terms of Service</Link>
          {" · "}
          <Link href="/privacy" className="text-emerald-500 hover:underline">Privacy Policy</Link>
        </p>
      </footer>
    </div>
  );
}
