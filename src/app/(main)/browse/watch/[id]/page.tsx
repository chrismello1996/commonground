"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FAKE_USERS, STREAM_TITLES, formatViewers, formatTime } from "@/utils/constants";

// Same stream data as browse page
const LIVE_STREAMS = [
  { id: 1, debaterA: FAKE_USERS[1], debaterB: FAKE_USERS[2], title: STREAM_TITLES[0], viewers: 2847, votesA: 62, votesB: 38, timeElapsed: 487, category: "economics", topic: "Is profit inherently exploitative?" },
  { id: 2, debaterA: FAKE_USERS[4], debaterB: FAKE_USERS[3], title: STREAM_TITLES[1], viewers: 5203, votesA: 45, votesB: 55, timeElapsed: 1294, category: "technology", topic: "Will AI replace most jobs in 10 years?" },
  { id: 3, debaterA: FAKE_USERS[5], debaterB: FAKE_USERS[6], title: STREAM_TITLES[4], viewers: 8623, votesA: 51, votesB: 49, timeElapsed: 743, category: "anything", topic: "Is social media a net negative?" },
  { id: 4, debaterA: FAKE_USERS[8], debaterB: FAKE_USERS[9], title: STREAM_TITLES[9], viewers: 12580, votesA: 58, votesB: 42, timeElapsed: 2156, category: "anything", topic: "Should billionaires exist?" },
  { id: 5, debaterA: FAKE_USERS[10], debaterB: FAKE_USERS[11], title: STREAM_TITLES[5], viewers: 4104, votesA: 44, votesB: 56, timeElapsed: 967, category: "anything", topic: "Are popular opinions popular because they're right?" },
  { id: 6, debaterA: FAKE_USERS[7], debaterB: FAKE_USERS[13], title: STREAM_TITLES[10], viewers: 15932, votesA: 70, votesB: 30, timeElapsed: 380, category: "conspiracy", topic: "Is the moon landing real?" },
];

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = parseInt(params.id as string, 10);
  const currentIndex = LIVE_STREAMS.findIndex((s) => s.id === streamId);
  const stream = currentIndex >= 0 ? LIVE_STREAMS[currentIndex] : undefined;
  const prevStream = currentIndex > 0 ? LIVE_STREAMS[currentIndex - 1] : null;
  const nextStream = currentIndex < LIVE_STREAMS.length - 1 ? LIVE_STREAMS[currentIndex + 1] : null;

  const [votedFor, setVotedFor] = useState<"A" | "B" | null>(null);
  const [elapsed, setElapsed] = useState(stream?.timeElapsed || 0);

  // Reset state when navigating between debates
  useEffect(() => {
    setVotedFor(null);
    setElapsed(stream?.timeElapsed || 0);
  }, [streamId, stream?.timeElapsed]);

  const [chatMessages] = useState([
    { user: "SpectatorX", msg: "This is getting heated!", time: "2m ago" },
    { user: "DebateFan", msg: "Great point about market dynamics", time: "1m ago" },
    { user: "CriticalThinker", msg: "He needs to back that up with data", time: "45s ago" },
    { user: "NewHere", msg: "First time watching, this is wild", time: "30s ago" },
    { user: "EconNerd", msg: "Classic Austrian vs Keynesian framing", time: "15s ago" },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!stream) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-3">Stream not found</p>
          <Link href="/browse" className="text-emerald-500 font-semibold text-sm hover:underline">
            ← Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const pctA = votedFor ? (votedFor === "A" ? stream.votesA + 1 : stream.votesA) : stream.votesA;
  const pctB = votedFor ? (votedFor === "B" ? stream.votesB + 1 : stream.votesB) : stream.votesB;
  const totalAdj = pctA + pctB;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Back button + stream info */}
        <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-3">
          <Link href="/browse" className="text-gray-400 hover:text-gray-600 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{stream.title}</p>
            <p className="text-[11px] text-gray-500">{stream.topic}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wide animate-pulse">
              LIVE
            </span>
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {formatViewers(stream.viewers)}
            </span>
            <span className="text-[11px] text-gray-500 font-mono">{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Video Feed */}
        <div className="flex-1 flex gap-0.5 bg-gray-900 p-1">
          {/* Debater A */}
          <div className="flex-1 relative rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold text-white"
              style={{ background: stream.debaterA.color }}
            >
              {stream.debaterA.name[0]}
            </div>
            <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2.5 py-1 rounded-md">
              <p className="text-xs font-bold">{stream.debaterA.name}</p>
              <p className="text-[10px] text-gray-400">{stream.debaterA.elo} ELO</p>
            </div>
          </div>
          {/* VS divider */}
          <div className="flex items-center justify-center w-10 text-emerald-500 font-black text-sm">
            VS
          </div>
          {/* Debater B */}
          <div className="flex-1 relative rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold text-white"
              style={{ background: stream.debaterB.color }}
            >
              {stream.debaterB.name[0]}
            </div>
            <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-md text-right">
              <p className="text-xs font-bold">{stream.debaterB.name}</p>
              <p className="text-[10px] text-gray-400">{stream.debaterB.elo} ELO</p>
            </div>
          </div>
        </div>

        {/* Vote Bar + Buttons */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          {/* Vote bar */}
          <div className="flex h-6 rounded-full overflow-hidden mb-3 bg-gray-200">
            <div
              className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
              style={{ width: `${(pctA / totalAdj) * 100}%` }}
            >
              {Math.round((pctA / totalAdj) * 100)}%
            </div>
            <div
              className="bg-amber-800 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
              style={{ width: `${(pctB / totalAdj) * 100}%` }}
            >
              {Math.round((pctB / totalAdj) * 100)}%
            </div>
          </div>
          {/* Vote buttons + Nav */}
          <div className="flex gap-2 items-stretch">
            {/* Prev button */}
            <button
              onClick={() => prevStream && router.push(`/browse/watch/${prevStream.id}`)}
              disabled={!prevStream}
              className="w-11 rounded-lg border-2 border-gray-200 bg-white flex items-center justify-center hover:border-gray-300 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
              title="Previous debate"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            {/* Vote buttons */}
            <div className="flex-1 flex gap-2">
              <button
                onClick={() => setVotedFor("A")}
                disabled={votedFor !== null}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${
                  votedFor === "A"
                    ? "bg-emerald-500 text-white"
                    : votedFor === "B"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30"
                }`}
              >
                Vote {stream.debaterA.name}
              </button>
              <button
                onClick={() => setVotedFor("B")}
                disabled={votedFor !== null}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${
                  votedFor === "B"
                    ? "bg-amber-800 text-white"
                    : votedFor === "A"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-amber-800/10 text-amber-800 hover:bg-amber-800/20 border border-amber-800/30"
                }`}
              >
                Vote {stream.debaterB.name}
              </button>
            </div>

            {/* Next button */}
            <button
              onClick={() => nextStream && router.push(`/browse/watch/${nextStream.id}`)}
              disabled={!nextStream}
              className="w-11 rounded-lg border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-25 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-white"
              title="Next debate"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="hidden lg:flex w-[300px] border-l border-gray-200 flex-col bg-white">
        <div className="px-3 py-2 border-b border-gray-200">
          <h3 className="text-xs font-bold text-gray-700">Live Chat</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chatMessages.map((msg, i) => (
            <div key={i}>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-bold text-emerald-600">{msg.user}</span>
                <span className="text-[10px] text-gray-400">{msg.time}</span>
              </div>
              <p className="text-[12px] text-gray-700">{msg.msg}</p>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-200">
          <input
            placeholder="Send a message..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>
    </div>
  );
}
