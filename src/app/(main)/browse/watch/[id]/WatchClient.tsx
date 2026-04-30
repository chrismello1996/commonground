"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STANCE_OPTIONS } from "@/utils/constants";
import { createClient } from "@/lib/supabase/client";
import DebateChat from "@/components/debate/DebateChat";
import LiveKitVideo from "@/components/debate/LiveKitVideo";
import "@/styles/debate-room.css";

interface WatchClientProps {
  debate: {
    id: string;
    topic: string;
    category: string;
    status: string;
    createdAt: string;
  };
  userA: {
    id: string;
    username: string;
    elo: number;
    color: string;
    stance: string;
  };
  userB: {
    id: string;
    username: string;
    elo: number;
    color: string;
    stance: string;
  };
  initialVotesA: number;
  initialVotesB: number;
  initialUserVote: "A" | "B" | null;
  currentUserId: string | null;
  /** IDs of other live debates for the Next button */
  otherDebateIds: string[];
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

const getEloRank = (elo: number) =>
  elo >= 1800 ? "gold" : elo >= 1500 ? "silver" : "bronze";

export default function WatchClient({
  debate,
  userA,
  userB,
  initialVotesA,
  initialVotesB,
  initialUserVote,
  currentUserId,
  otherDebateIds,
}: WatchClientProps) {
  const router = useRouter();
  const [votedFor, setVotedFor] = useState<"A" | "B" | null>(initialUserVote);
  const [votesA, setVotesA] = useState(initialVotesA);
  const [votesB, setVotesB] = useState(initialVotesB);
  const [currentTopic, setCurrentTopic] = useState(debate.topic);
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - new Date(debate.createdAt).getTime()) / 1000)
  );
  const [viewerCount, setViewerCount] = useState(0);
  const supabaseRef = useRef(createClient());

  const [devMode, setDevMode] = useState(false);

  const categoryConfig = STANCE_OPTIONS[debate.category];
  const stanceLabelA = categoryConfig?.stances.find((s) => s.id === userA.stance)?.label || userA.stance;
  const stanceLabelB = categoryConfig?.stances.find((s) => s.id === userB.stance)?.label || userB.stance;
  const stanceColorA = categoryConfig?.stances.find((s) => s.id === userA.stance)?.color || userA.color;
  const stanceColorB = categoryConfig?.stances.find((s) => s.id === userB.stance)?.color || userB.color;

  const isEnded = debate.status !== "active";

  useEffect(() => {
    if (isEnded) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [isEnded]);

  // Listen for topic changes in real time
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`watch-topic-${debate.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "debates", filter: `id=eq.${debate.id}` },
        (payload) => {
          if (payload.new.topic) setCurrentTopic(payload.new.topic);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [debate.id]);

  const handleVote = async (side: "A" | "B") => {
    if (votedFor || !currentUserId) return;
    setVotedFor(side);
    if (side === "A") setVotesA((v) => v + 1);
    else setVotesB((v) => v + 1);

    try {
      await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debate_id: debate.id,
          voted_for: side === "A" ? userA.id : userB.id,
        }),
      });
    } catch {
      setVotedFor(null);
      if (side === "A") setVotesA((v) => v - 1);
      else setVotesB((v) => v - 1);
    }
  };

  const handleNext = () => {
    if (otherDebateIds.length > 0) {
      const randomId = otherDebateIds[Math.floor(Math.random() * otherDebateIds.length)];
      router.push(`/browse/watch/${randomId}`);
    } else {
      router.push("/browse");
    }
  };

  const handleLeave = () => {
    router.push("/browse");
  };

  const totalVotes = votesA + votesB;
  const normA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
  const normB = totalVotes > 0 ? 100 - normA : 50;

  const hasStanceA = stanceLabelA !== "unknown" && stanceLabelA !== "";
  const hasStanceB = stanceLabelB !== "unknown" && stanceLabelB !== "";

  return (
    <LiveKitVideo
      debateId={debate.id}
      isParticipant={false}
      onDevMode={() => setDevMode(true)}
      onConnectionChange={(_connected, viewers) => setViewerCount(viewers)}
    >
      {({ remoteVideoByIdentity }) => (
        <div className="debate-room-wrapper">
          <div className="debate-room">
            {/* ===== VIDEO AREA ===== */}
            <div className="video-area">
              <div className="video-grid">
                {/* DEBATER A */}
                <div className="video-panel">
                  {remoteVideoByIdentity[userA.id] ? (
                    <div style={{ width: "100%", height: "100%" }}>{remoteVideoByIdentity[userA.id]}</div>
                  ) : (
                    <div className="video-placeholder">
                      <div className="video-placeholder-avatar" style={{ background: stanceColorA }}>
                        {userA.username[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{userA.username}</span>
                      {!devMode && !isEnded && (
                        <span style={{ fontSize: 9, color: "var(--muted)", marginTop: 4 }}>Waiting for video...</span>
                      )}
                    </div>
                  )}
                  <div className="live-pill"><span className="live-pill-dot" />{isEnded ? "ENDED" : "LIVE"}</div>
                  <div className="viewer-count-badge">{viewerCount}</div>
                  <div className="video-label-row">
                    <Link href={`/profile/${userA.username}`} className="video-label video-label-link">
                      <span className="video-label-dot" style={{ background: "var(--green)" }} />
                      {userA.username}
                      <span className={`elo-badge ${getEloRank(userA.elo)}`}>{userA.elo}</span>
                    </Link>
                    {hasStanceA && (
                      <div className="stance-badge" style={{ borderColor: stanceColorA }}>
                        <span className="stance-badge-dot" style={{ background: stanceColorA }} />
                        {stanceLabelA}
                      </div>
                    )}
                  </div>
                  <div className="uptime-badge">{formatTime(elapsed)}</div>
                </div>

                {/* DEBATER B */}
                <div className="video-panel">
                  {remoteVideoByIdentity[userB.id] ? (
                    <div style={{ width: "100%", height: "100%" }}>{remoteVideoByIdentity[userB.id]}</div>
                  ) : (
                    <div className="video-placeholder">
                      <div className="video-placeholder-avatar" style={{ background: stanceColorB }}>
                        {userB.username[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{userB.username}</span>
                      {!devMode && !isEnded && (
                        <span style={{ fontSize: 9, color: "var(--muted)", marginTop: 4 }}>Waiting for video...</span>
                      )}
                    </div>
                  )}
                  <div className="video-label-row">
                    <Link href={`/profile/${userB.username}`} className="video-label video-label-link">
                      <span className="video-label-dot" style={{ background: "var(--red)" }} />
                      {userB.username}
                      <span className={`elo-badge ${getEloRank(userB.elo)}`}>{userB.elo}</span>
                    </Link>
                    {hasStanceB && (
                      <div className="stance-badge" style={{ borderColor: stanceColorB }}>
                        <span className="stance-badge-dot" style={{ background: stanceColorB }} />
                        {stanceLabelB}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vote bar + buttons (same style as DebateRoom) */}
              <div className="vote-section" style={{ marginTop: 4 }}>
                <div className="vote-pct left">{normA}%</div>
                <button
                  className={`vote-btn left ${votedFor === "A" ? "voted" : ""}`}
                  onClick={() => handleVote("A")}
                  disabled={votedFor !== null || !currentUserId}
                >
                  {userA.username}
                </button>
                <div className="vote-bar-lg" style={{ flex: 1 }}>
                  <div className="vote-bar-left" style={{ width: `${normA}%` }} />
                  <div className="vote-bar-right" />
                </div>
                <button
                  className={`vote-btn right ${votedFor === "B" ? "voted" : ""}`}
                  onClick={() => handleVote("B")}
                  disabled={votedFor !== null || !currentUserId}
                >
                  {userB.username}
                </button>
                <div className="vote-pct right">{normB}%</div>
              </div>
              <div className="vote-count-row">
                <span className="vote-count-left">{votesA}</span>
                <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
                <span className="vote-count-right">{votesB}</span>
              </div>

              {/* Topic banner */}
              <div className="topic-banner-wrap">
                <div className="topic-banner">
                  <span className="topic-label">{currentTopic ? "Topic" : "No topic set"}</span>
                  <span className="topic-text">
                    {currentTopic || "Debaters haven't set a topic yet"}
                  </span>
                </div>
                {categoryConfig && (
                  <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>
                      {categoryConfig.label}
                      {hasStanceA && hasStanceB && ` — ${stanceLabelA} vs ${stanceLabelB}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Controls bar — viewer version */}
              <div className="controls-bar">
                {!currentUserId && (
                  <Link href="/login" className="ctrl-btn" style={{ fontSize: 11, gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    <span>Sign in to vote</span>
                  </Link>
                )}
                <button className="ctrl-btn leave-btn" onClick={handleLeave}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Browse</span>
                </button>
                <button className="ctrl-btn next-btn" onClick={handleNext}>
                  <span>Next</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 4 15 12 5 20 5 4" />
                    <line x1="19" y1="5" x2="19" y2="19" />
                  </svg>
                </button>
              </div>

              {/* Dev mode indicator */}
              {devMode && (
                <div style={{ textAlign: "center", fontSize: 10, color: "#f59e0b", padding: 4, background: "rgba(245,158,11,.08)", borderRadius: 6 }}>
                  Dev Mode — LiveKit not connected, video disabled
                </div>
              )}
            </div>

            {/* ===== CHAT SIDEBAR ===== */}
            {currentUserId ? (
              <DebateChat
                debateId={debate.id}
                currentUserId={currentUserId}
                currentUsername="Spectator"
                userAId={userA.id}
                userAUsername={userA.username}
                userBUsername={userB.username}
                isActive={!isEnded}
                userAColor={stanceColorA}
                userBColor={stanceColorB}
                userAElo={userA.elo}
                userBElo={userB.elo}
                onReaction={() => {}}
              />
            ) : (
              <div className="hidden lg:flex w-[320px] border-l flex-col bg-gray-50 items-center justify-center" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs text-gray-400 mb-2">Sign in to chat</p>
                <Link href="/login" className="text-emerald-500 text-xs font-semibold hover:underline">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </LiveKitVideo>
  );
}
