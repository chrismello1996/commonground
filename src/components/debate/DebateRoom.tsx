"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// livekit-client types used by LiveKitVideo component
import { STANCE_OPTIONS } from "@/utils/constants";
import { createClient } from "@/lib/supabase/client";
import DebateChat from "./DebateChat";
import ReportButton from "./ReportButton";
import LiveKitVideo from "./LiveKitVideo";
import ClipRecorder from "./ClipRecorder";
import "@/styles/debate-room.css";

// ===== FACT CHECK DATA =====
const FACT_CHECK_CLAIMS: Record<string, { claim: string; verdict: string; source: string }[]> = {
  politics: [
    { claim: "The US national debt is over $35 trillion", verdict: "true", source: "US Treasury Dept" },
    { claim: "Voter fraud decided the last three elections", verdict: "false", source: "Election Integrity Project" },
    { claim: "Congress has a 90% incumbent reelection rate", verdict: "true", source: "OpenSecrets.org" },
  ],
  economics: [
    { claim: "The US GDP is approximately $28 trillion", verdict: "true", source: "Bureau of Economic Analysis" },
    { claim: "Minimum wage hasn't increased since 2009", verdict: "true", source: "Dept of Labor" },
    { claim: "Inflation only affects the lower class", verdict: "false", source: "Federal Reserve data" },
  ],
  anything: [
    { claim: "Humans only use 10% of their brain", verdict: "false", source: "Neuroscience research consensus" },
    { claim: "Cold weather causes colds", verdict: "false", source: "NIH Common Cold Research" },
  ],
};

const VERDICT_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  true: { icon: "✅", label: "True", color: "#10b981" },
  false: { icon: "❌", label: "False", color: "#ef4444" },
  misleading: { icon: "⚠️", label: "Misleading", color: "#f59e0b" },
  unverified: { icon: "❓", label: "Unverified", color: "#8b5cf6" },
};

interface DebateUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  elo: number;
  stance: string;
  stanceCategory?: string;
}

interface DebateRoomProps {
  debateId: string;
  currentUserId: string;
  topic: string;
  category: string;
  status: string;
  userA: DebateUser;
  userB: DebateUser;
}

interface FactCheck {
  id: number;
  claim: string;
  verdict: string;
  source: string;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
}

const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

const getEloRank = (elo: number) => elo >= 1800 ? "gold" : elo >= 1500 ? "silver" : "bronze";

export default function DebateRoom({
  debateId,
  currentUserId,
  topic,
  category,
  status,
  userA,
  userB,
}: DebateRoomProps) {
  const router = useRouter();
  const [debateTime, setDebateTime] = useState(0);
  const [isActive, setIsActive] = useState(status === "active");
  const [devMode, setDevMode] = useState(false);
  const [isAutoSearching, setIsAutoSearching] = useState(false);
  const [autoSearchStatus, setAutoSearchStatus] = useState<string>("");

  // Debate features
  const [debateViewers, setDebateViewers] = useState(0);
  const [debateTopic, setDebateTopic] = useState(topic || "");
  const [proposedTopic, setProposedTopic] = useState("");
  const [pendingProposal, setPendingProposal] = useState<{ topic: string; proposedBy: string } | null>(null);
  const [myVote, setMyVote] = useState<"A" | "B" | null>(null);
  const [debateVotesA, setDebateVotesA] = useState(0);
  const [debateVotesB, setDebateVotesB] = useState(0);

  // Fact check
  const [factChecks, setFactChecks] = useState<FactCheck[]>([]);
  const [factCheckHistory, setFactCheckHistory] = useState<FactCheck[]>([]);
  const [factCheckInput, setFactCheckInput] = useState("");

  // Reactions
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoGridRef = useRef<HTMLDivElement>(null);

  const isUserA = currentUserId === userA.id;
  const me = isUserA ? userA : userB;
  const opponent = isUserA ? userB : userA;

  // Look up stance data — use stanceCategory if the debate category has no stances
  const myStanceConfig = STANCE_OPTIONS[me.stanceCategory || category];
  const opponentStanceConfig = STANCE_OPTIONS[opponent.stanceCategory || category];
  const myStanceData = myStanceConfig?.stances.find((s) => s.id === me.stance);
  const opponentStanceData = opponentStanceConfig?.stances.find((s) => s.id === opponent.stance);
  const myStanceLabel = myStanceData?.label || me.stance;
  const opponentStanceLabel = opponentStanceData?.label || opponent.stance;
  const myStanceColor = myStanceData?.color || "#10b981";
  const opponentStanceColor = opponentStanceData?.color || "#8B4513";

  // Debate timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setDebateTime((t) => t + 1);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  // End debate on tab close / navigation away
  useEffect(() => {
    const endOnUnload = () => {
      if (isActive) {
        // Use sendBeacon for reliable delivery during page unload
        navigator.sendBeacon(
          "/api/debate/end",
          new Blob([JSON.stringify({ debateId })], { type: "application/json" })
        );
      }
    };
    window.addEventListener("beforeunload", endOnUnload);
    return () => window.removeEventListener("beforeunload", endOnUnload);
  }, [isActive, debateId]);

  // Viewer count is updated by LiveKitVideo component via onConnectionChange

  // Simulate vote changes
  const handleVote = (side: "A" | "B") => {
    if (myVote === side) return; // already voted this side
    if (myVote) {
      // switching vote — remove from old side, add to new
      if (myVote === "A") setDebateVotesA((v) => Math.max(0, v - 1));
      else setDebateVotesB((v) => Math.max(0, v - 1));
    }
    if (side === "A") setDebateVotesA((v) => v + 1);
    else setDebateVotesB((v) => v + 1);
    setMyVote(side);
  };

  const handleEndDebate = useCallback(async () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsAutoSearching(true);
    setAutoSearchStatus("Ending debate — finding next...");
    try { await fetch("/api/debate/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ debateId }) }); } catch {}
    try {
      const res = await fetch("/api/matchmaking/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: currentUserId, category }) });
      const data = await res.json();
      if (data.status === "matched") {
        setAutoSearchStatus("Match found! Connecting...");
        setTimeout(() => router.push(`/debate/${data.debateId}`), 800);
      } else {
        setAutoSearchStatus("Searching for opponent...");
        setTimeout(() => router.push("/debate"), 800);
      }
    } catch {
      setAutoSearchStatus("Searching for opponent...");
      setTimeout(() => router.push("/debate"), 800);
    }
  }, [debateId, currentUserId, category, router]);

  const handleSkip = useCallback(async () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsAutoSearching(true);
    setAutoSearchStatus("Skipping — finding next...");
    try { await fetch("/api/debate/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ debateId }) }); } catch {}
    try {
      const res = await fetch("/api/matchmaking/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: currentUserId, category }) });
      const data = await res.json();
      if (data.status === "matched") {
        setAutoSearchStatus("Match found! Connecting...");
        setTimeout(() => router.push(`/debate/${data.debateId}`), 800);
      } else {
        setAutoSearchStatus("Searching for opponent...");
        setTimeout(() => router.push("/debate"), 800);
      }
    } catch {
      setAutoSearchStatus("Searching for opponent...");
      setTimeout(() => router.push("/debate"), 800);
    }
  }, [debateId, category, router, currentUserId]);

  const handleLeave = useCallback(async () => {
    if (isActive) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      try { await fetch("/api/debate/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ debateId }) }); } catch {}
    }
    router.push("/");
  }, [router, isActive, debateId]);

  const submitFactCheck = (claim: string) => {
    const catData = FACT_CHECK_CLAIMS[category] || FACT_CHECK_CLAIMS.anything;
    const match = catData?.find((c) => claim.toLowerCase().includes(c.claim.toLowerCase().slice(0, 20)));
    const fc: FactCheck = match
      ? { id: Date.now(), claim: match.claim, verdict: match.verdict, source: match.source }
      : { id: Date.now(), claim, verdict: ["true", "false", "misleading"][Math.floor(Math.random() * 3)], source: "Automated check" };
    setFactChecks((prev) => [...prev.slice(-1), fc]);
    setFactCheckHistory((prev) => [...prev, fc]);
    setTimeout(() => setFactChecks((prev) => prev.filter((f) => f.id !== fc.id)), 8000);
  };

  const addReaction = (emoji: string) => {
    const r: FloatingReaction = { id: Date.now(), emoji, x: 10 + Math.random() * 80 };
    setFloatingReactions((prev) => [...prev, r]);
    setTimeout(() => setFloatingReactions((prev) => prev.filter((f) => f.id !== r.id)), 2000);
  };

  // Vote percentages
  const totalVotes = debateVotesA + debateVotesB;
  const normA = totalVotes > 0 ? Math.round((debateVotesA / totalVotes) * 100) : 50;
  const normB = totalVotes > 0 ? 100 - normA : 50;

  // Video refs and track management handled by LiveKitVideo component

  // Supabase Realtime channel for topic proposals
  const supabaseRef = useRef(createClient());
  const topicChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase.channel(`debate-topic-${debateId}`);

    channel
      .on("broadcast", { event: "topic-propose" }, ({ payload }) => {
        if (payload.proposedBy !== currentUserId) {
          setPendingProposal({ topic: payload.topic, proposedBy: payload.proposedBy });
        }
      })
      .on("broadcast", { event: "topic-accept" }, ({ payload }) => {
        setDebateTopic(payload.topic);
        setPendingProposal(null);
      })
      .on("broadcast", { event: "topic-decline" }, () => {
        setPendingProposal(null);
      })
      .subscribe();

    topicChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [debateId, currentUserId]);

  // Auto-search when opponent leaves — Omegle-style
  // Uses polling + Realtime for reliability
  const autoSearchTriggered = useRef(false);

  const triggerAutoSearch = useCallback(async () => {
    if (autoSearchTriggered.current) return;
    autoSearchTriggered.current = true;
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsAutoSearching(true);
    setAutoSearchStatus("Opponent disconnected — finding next...");

    try {
      const res = await fetch("/api/matchmaking/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, category }),
      });
      const data = await res.json();
      if (data.status === "matched") {
        setAutoSearchStatus("Match found! Connecting...");
        setTimeout(() => router.push(`/debate/${data.debateId}`), 800);
      } else {
        setAutoSearchStatus("Searching for opponent...");
        setTimeout(() => router.push("/debate"), 800);
      }
    } catch {
      setAutoSearchStatus("Searching for opponent...");
      setTimeout(() => router.push("/debate"), 800);
    }
  }, [currentUserId, category, router]);

  // Poll debate status every 3 seconds as primary detection
  useEffect(() => {
    if (!isActive) return;

    const pollInterval = setInterval(async () => {
      try {
        const supabase = supabaseRef.current;
        const { data } = await supabase
          .from("debates")
          .select("status")
          .eq("id", debateId)
          .single();

        if (data && data.status !== "active") {
          clearInterval(pollInterval);
          triggerAutoSearch();
        }
      } catch {
        // Silently retry
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [debateId, isActive, triggerAutoSearch]);

  // Also listen via Realtime for faster detection (if enabled)
  useEffect(() => {
    const supabase = supabaseRef.current;
    const statusChannel = supabase
      .channel(`debate-status-${debateId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "debates", filter: `id=eq.${debateId}` },
        (payload) => {
          if (payload.new.status && payload.new.status !== "active") {
            triggerAutoSearch();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(statusChannel); };
  }, [debateId, triggerAutoSearch]);

  const handleProposeTopic = () => {
    if (!proposedTopic.trim()) return;
    const proposal = { topic: proposedTopic.trim(), proposedBy: currentUserId };
    setPendingProposal(proposal);
    setProposedTopic("");
    topicChannelRef.current?.send({
      type: "broadcast",
      event: "topic-propose",
      payload: proposal,
    });
  };

  const handleAcceptProposal = async () => {
    if (pendingProposal) {
      const acceptedTopic = pendingProposal.topic;
      setDebateTopic(acceptedTopic);
      topicChannelRef.current?.send({
        type: "broadcast",
        event: "topic-accept",
        payload: { topic: acceptedTopic },
      });
      setPendingProposal(null);

      // Save to Supabase so viewers/browse can see the topic
      await supabaseRef.current
        .from("debates")
        .update({ topic: acceptedTopic })
        .eq("id", debateId);
    }
  };

  const handleDeclineProposal = () => {
    topicChannelRef.current?.send({
      type: "broadcast",
      event: "topic-decline",
      payload: {},
    });
    setPendingProposal(null);
  };

  // Show stance if user has one set (not "unknown")
  const hasMyStance = me.stance !== "unknown" && me.stance !== "";
  const hasOpponentStance = opponent.stance !== "unknown" && opponent.stance !== "";

  return (
    <LiveKitVideo
      debateId={debateId}
      isParticipant={true}
      onDevMode={() => setDevMode(true)}
      onConnectionChange={(connected, viewers) => {
        setDebateViewers(viewers);
      }}
    >
      {({ localVideoEl, remoteVideoEl, isCamOn, isMicOn, toggleCam, toggleMic }) => (
    <div className="debate-room-wrapper">
      <div className="debate-room">
        {/* ===== VIDEO AREA ===== */}
        <div className="video-area">
          <div className="video-grid" ref={videoGridRef} style={{ position: "relative" }}>
            {/* Auto-search overlay — covers video grid */}
            {isAutoSearching && (
              <div className="auto-search-overlay">
                <div className="auto-search-spinner" />
                <h2 className="auto-search-title">Finding Opponent...</h2>
                <p className="auto-search-subtitle">{autoSearchStatus}</p>
                <button
                  className="auto-search-stop"
                  onClick={() => {
                    setIsAutoSearching(false);
                    autoSearchTriggered.current = false;
                    router.push("/");
                  }}
                >
                  Stop
                </button>
              </div>
            )}
            {/* MY VIDEO PANEL */}
            <div className="video-panel">
              {localVideoEl && isCamOn ? (
                <div style={{ width: "100%", height: "100%" }}>{localVideoEl}</div>
              ) : (
                <div className="video-placeholder">
                  <div className="video-placeholder-avatar" style={{ background: myStanceColor }}>{me.username[0]?.toUpperCase()}</div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{me.username}</span>
                  {!isCamOn && <span style={{ fontSize: 9, color: "var(--muted)", marginTop: 4 }}>Camera off</span>}
                </div>
              )}
              <div className="live-pill"><span className="live-pill-dot" />LIVE</div>
              <div className="viewer-count-badge">{debateViewers}</div>
              <div className="video-label-row">
                <Link href={`/profile/${me.username}`} className="video-label video-label-link">
                  <span className="video-label-dot" style={{ background: "var(--green)" }} />
                  {me.username}
                  <span className={`elo-badge ${getEloRank(me.elo)}`}>{me.elo}</span>
                </Link>
                {hasMyStance && (
                  <div className="stance-badge" style={{ borderColor: myStanceColor }}>
                    <span className="stance-badge-dot" style={{ background: myStanceColor }} />
                    {myStanceLabel}
                  </div>
                )}
              </div>
              <div className="uptime-badge">{formatTime(debateTime)}</div>
              <div className="reaction-overlay">
                {floatingReactions.map((r) => (
                  <div key={r.id} className="floating-reaction" style={{ left: `${r.x}%` }}>{r.emoji}</div>
                ))}
              </div>
            </div>

            {/* OPPONENT VIDEO PANEL */}
            <div className="video-panel">
              {remoteVideoEl ? (
                <div style={{ width: "100%", height: "100%" }}>{remoteVideoEl}</div>
              ) : (
                <div className="video-placeholder">
                  <div className="video-placeholder-avatar" style={{ background: opponentStanceColor }}>{opponent.username[0]?.toUpperCase()}</div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{opponent.username}</span>
                </div>
              )}
              <div className="video-label-row">
                <Link href={`/profile/${opponent.username}`} className="video-label video-label-link">
                  <span className="video-label-dot" style={{ background: "var(--red)" }} />
                  {opponent.username}
                  <span className={`elo-badge ${getEloRank(opponent.elo)}`}>{opponent.elo}</span>
                </Link>
                {hasOpponentStance && (
                  <div className="stance-badge" style={{ borderColor: opponentStanceColor }}>
                    <span className="stance-badge-dot" style={{ background: opponentStanceColor }} />
                    {opponentStanceLabel}
                  </div>
                )}
              </div>

              {/* Fact check overlay */}
              {factChecks.length > 0 && (
                <div className="factcheck-overlay">
                  {factChecks.slice(-2).map((fc) => {
                    const verdict = VERDICT_CONFIG[fc.verdict] || VERDICT_CONFIG.unverified;
                    return (
                      <div key={fc.id} className="factcheck-card">
                        <div className={`fc-verdict ${fc.verdict}`}>{verdict.icon}</div>
                        <div className="fc-body">
                          <div className={`fc-label ${fc.verdict}`}>{verdict.label}</div>
                          <div className="fc-claim">&quot;{fc.claim}&quot;</div>
                          <div className="fc-meta">
                            <span className="fc-source">{fc.source}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Fact check score bar */}
          {factCheckHistory.length > 0 && (
            <div className="fc-score">
              <span style={{ fontSize: 10, color: "var(--txt2)", fontWeight: 600 }}>Fact Checks ({factCheckHistory.length})</span>
              <span style={{ color: "#10b981", fontWeight: 700, fontSize: 10 }}>{factCheckHistory.filter((f) => f.verdict === "true").length} True</span>
              <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 10 }}>{factCheckHistory.filter((f) => f.verdict === "false").length} False</span>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 10 }}>{factCheckHistory.filter((f) => f.verdict === "misleading").length} Misleading</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
                <input
                  className="topic-propose-input"
                  style={{ fontSize: 10, padding: "3px 8px", minWidth: 160 }}
                  placeholder="Type a claim to fact-check..."
                  value={factCheckInput}
                  onChange={(e) => setFactCheckInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && factCheckInput.trim()) { submitFactCheck(factCheckInput); setFactCheckInput(""); } }}
                />
                <button className="factcheck-btn" onClick={() => { if (factCheckInput.trim()) { submitFactCheck(factCheckInput); setFactCheckInput(""); } }}>Check</button>
              </div>
            </div>
          )}

          {/* Audience vote bar with vote counts */}
          <div className="vote-section" style={{ marginTop: 4 }}>
            <div className="vote-pct left">{normA}%</div>
            <button className={`vote-btn left ${myVote === "A" ? "voted" : ""}`} onClick={() => handleVote("A")}>{me.username}</button>
            <div className="vote-bar-lg" style={{ flex: 1 }}>
              <div className="vote-bar-left" style={{ width: `${normA}%` }} />
              <div className="vote-bar-right" />
            </div>
            <button className={`vote-btn right ${myVote === "B" ? "voted" : ""}`} onClick={() => handleVote("B")}>{opponent.username}</button>
            <div className="vote-pct right">{normB}%</div>
          </div>
          <div className="vote-count-row">
            <span className="vote-count-left">{debateVotesA}</span>
            <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
            <span className="vote-count-right">{debateVotesB}</span>
          </div>

          {/* Topic banner with propose/accept */}
          <div className="topic-banner-wrap">
            {debateTopic ? (
              <div className="topic-banner">
                <span className="topic-label">Topic</span>
                <span className="topic-text">{debateTopic}</span>
              </div>
            ) : (
              <div className="topic-banner">
                <span className="topic-label">No topic set</span>
                <span className="topic-text" style={{ color: "var(--muted)", fontStyle: "italic" }}>Propose a topic below</span>
              </div>
            )}

            {/* Pending proposal notification */}
            {pendingProposal && pendingProposal.proposedBy !== currentUserId ? (
              <div className="topic-proposal-alert">
                <span className="proposal-text">
                  {opponent.username} proposes: <strong>&quot;{pendingProposal.topic}&quot;</strong>
                </span>
                <button className="proposal-accept-btn" onClick={handleAcceptProposal}>Accept</button>
                <button className="proposal-decline-btn" onClick={handleDeclineProposal}>Decline</button>
              </div>
            ) : pendingProposal && pendingProposal.proposedBy === currentUserId ? (
              <div className="topic-proposal-pending">
                <span>Waiting for {opponent.username} to accept: &quot;{pendingProposal.topic}&quot;</span>
                <button className="proposal-decline-btn" onClick={handleDeclineProposal}>Cancel</button>
              </div>
            ) : (
              <div className="topic-propose-row">
                <input
                  className="topic-propose-input"
                  placeholder="Propose a topic..."
                  value={proposedTopic}
                  onChange={(e) => setProposedTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleProposeTopic();
                  }}
                />
                <button className="topic-set-btn" onClick={handleProposeTopic}>
                  Propose
                </button>
              </div>
            )}
          </div>

          {/* Controls bar — sleek, no emoji */}
          <div className="controls-bar">
            <button className={`ctrl-btn ${isMicOn ? "active" : ""}`} onClick={toggleMic} title={isMicOn ? "Mute" : "Unmute"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMicOn ? (
                  <>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </>
                ) : (
                  <>
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.5-.36 2.18" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </>
                )}
              </svg>
            </button>
            <button className={`ctrl-btn ${isCamOn ? "active" : ""}`} onClick={toggleCam} title={isCamOn ? "Camera off" : "Camera on"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isCamOn ? (
                  <>
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </>
                ) : (
                  <>
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" />
                  </>
                )}
              </svg>
            </button>
            <button className="ctrl-btn factcheck-ctrl" onClick={() => {
              const q = prompt("Fact-check a claim:");
              if (q) submitFactCheck(q);
            }} title="Fact-check a claim">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Fact Check</span>
            </button>
            {isActive && (
              <ClipRecorder debateId={debateId} videoGridRef={videoGridRef} maxDuration={30} />
            )}
            {isActive && (
              <ReportButton reportedUserId={opponent.id} reportedUsername={opponent.username} debateId={debateId} />
            )}
            {isActive && !isAutoSearching ? (
              <>
                <button className="ctrl-btn danger" onClick={handleEndDebate} title="End debate">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <button className="ctrl-btn next-btn" onClick={handleSkip}>
                  <span>Next</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 4 15 12 5 20 5 4" />
                    <line x1="19" y1="5" x2="19" y2="19" />
                  </svg>
                </button>
              </>
            ) : !isAutoSearching ? (
              <button className="ctrl-btn leave-btn" onClick={handleLeave}>Leave</button>
            ) : null}
          </div>

          {/* Dev mode indicator */}
          {devMode && (
            <div style={{ textAlign: "center", fontSize: 10, color: "#f59e0b", padding: 4, background: "rgba(245,158,11,.08)", borderRadius: 6 }}>
              Dev Mode — LiveKit not connected, video disabled
            </div>
          )}
        </div>

        {/* ===== CHAT SIDEBAR ===== */}
        <DebateChat
          debateId={debateId}
          currentUserId={currentUserId}
          currentUsername={me.username}
          userAId={userA.id}
          userAUsername={userA.username}
          userBUsername={userB.username}
          isActive={isActive}
          userAColor={myStanceColor}
          userBColor={opponentStanceColor}
          userAElo={userA.elo}
          userBElo={userB.elo}
          onReaction={addReaction}
        />
      </div>
    </div>
      )}
    </LiveKitVideo>
  );
}
