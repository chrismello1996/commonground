"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ChallengeUser {
  username: string;
  display_name?: string;
  elo: number;
}

interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  status: string;
  message: string | null;
  debate_id: string | null;
  created_at: string;
  expires_at: string;
  challenger: ChallengeUser;
  challenged: ChallengeUser;
}

interface ChallengesResponse {
  incoming: Challenge[];
  outgoing: Challenge[];
  accepted: Challenge[];
}

export default function ChallengeNotifications() {
  const router = useRouter();
  const [data, setData] = useState<ChallengesResponse>({ incoming: [], outgoing: [], accepted: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<Challenge | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set<string>());

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch("/api/challenges");
      if (!res.ok) return;
      const json: ChallengesResponse = await res.json();
      setData(json);

      // Show toast for new incoming challenges
      for (const c of json.incoming) {
        if (!seenIds.current.has(c.id)) {
          seenIds.current.add(c.id);
          setToast(c);
          setTimeout(() => setToast((prev) => (prev?.id === c.id ? null : prev)), 8000);
        }
      }

      // Auto-redirect if a challenge was accepted and has a debate_id
      for (const c of json.accepted) {
        if (c.debate_id) {
          router.push(`/debate/${c.debate_id}`);
          break;
        }
      }
    } catch {
      // Silently retry
    }
  }, [router]);

  // Poll every 5 seconds
  useEffect(() => {
    fetchChallenges();
    const interval = setInterval(fetchChallenges, 5000);
    return () => clearInterval(interval);
  }, [fetchChallenges]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const respond = async (challengeId: string, action: "accept" | "decline") => {
    setResponding(challengeId);
    try {
      const res = await fetch("/api/challenges/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, action }),
      });
      const json = await res.json();
      if (action === "accept" && json.debateId) {
        router.push(`/debate/${json.debateId}`);
      }
      // Refresh list
      fetchChallenges();
    } catch {
      // Handle error
    }
    setResponding(null);
  };

  const totalPending = data.incoming.length;
  const allChallenges = [...data.incoming, ...data.outgoing];

  const timeLeft = (expiresAt: string) => {
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Bell icon with badge */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-1.5 rounded-lg hover:bg-gray-200 transition"
          title="Challenges"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {totalPending > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {totalPending}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
            <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Challenges</span>
              <Link href="/challenge" className="text-[10px] text-emerald-600 font-semibold hover:text-emerald-700">
                Challenge someone
              </Link>
            </div>

            {allChallenges.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {data.incoming.map((c) => (
                  <div key={c.id} className="px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                        {c.challenger.username[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {c.challenger.username} <span className="text-gray-400 font-normal">challenged you</span>
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {c.challenger.elo} ELO · expires in {timeLeft(c.expires_at)}
                        </p>
                      </div>
                    </div>
                    {c.message && (
                      <p className="text-[11px] text-gray-500 italic mb-1.5 pl-9">&quot;{c.message}&quot;</p>
                    )}
                    <div className="flex gap-1.5 pl-9">
                      <button
                        onClick={() => respond(c.id, "accept")}
                        disabled={responding === c.id}
                        className="px-3 py-1 text-[10px] font-bold rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition disabled:opacity-50"
                      >
                        {responding === c.id ? "..." : "Accept"}
                      </button>
                      <button
                        onClick={() => respond(c.id, "decline")}
                        disabled={responding === c.id}
                        className="px-3 py-1 text-[10px] font-bold rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
                {data.outgoing.map((c) => (
                  <div key={c.id} className="px-3 py-2.5 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                        {c.challenged.username[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          You challenged <span className="text-emerald-600">{c.challenged.username}</span>
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Waiting... · expires in {timeLeft(c.expires_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-gray-400">No pending challenges</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-16 right-4 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[100] animate-slide-in">
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white">
                {toast.challenger.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-800">
                  {toast.challenger.username} wants to debate!
                </p>
                <p className="text-[10px] text-gray-400">{toast.challenger.elo} ELO</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-gray-300 hover:text-gray-500 transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {toast.message && (
              <p className="text-[11px] text-gray-500 italic mb-2">&quot;{toast.message}&quot;</p>
            )}
            <div className="flex gap-1.5">
              <button
                onClick={() => { respond(toast.id, "accept"); setToast(null); }}
                className="flex-1 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
              >
                Accept
              </button>
              <button
                onClick={() => { respond(toast.id, "decline"); setToast(null); }}
                className="flex-1 py-1.5 text-[11px] font-bold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              >
                Decline
              </button>
            </div>
          </div>
          {/* Expiry countdown bar */}
          <div className="h-0.5 bg-gray-100">
            <div className="h-full bg-emerald-500 animate-shrink" />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink {
          animation: shrink 8s linear;
        }
      `}</style>
    </>
  );
}
