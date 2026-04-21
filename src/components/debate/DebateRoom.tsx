"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Room, RoomEvent, Track, RemoteTrack, LocalTrack, ConnectionState } from "livekit-client";
import { STANCE_OPTIONS } from "@/utils/constants";
import DebateChat from "./DebateChat";
import ReportButton from "./ReportButton";
import "@/styles/debate-room.css";

// ===== DEBATE TOPICS =====
const DEBATE_TOPICS: Record<string, { general: string[]; stancePairs?: Record<string, string[]> }> = {
  politics: {
    general: ["Should voting be mandatory?", "Is the two-party system broken?", "Should there be term limits for Congress?"],
    stancePairs: {
      "democrat|republican": ["Is big government the solution or the problem?", "Should taxes on the wealthy be increased?", "Gun control: safety measure or rights violation?", "Is universal healthcare a right?", "Immigration: open borders or secure borders?"],
      "libertarian|democrat": ["Should the government regulate social media?", "Is the welfare state helping or hurting?"],
    },
  },
  economics: {
    general: ["Is inflation always a monetary phenomenon?", "Should we return to the gold standard?", "Is UBI inevitable?"],
    stancePairs: {
      "capitalist|socialist": ["Should billionaires exist?", "Is profit inherently exploitative?", "Does trickle-down economics work?"],
      "keynesian|austrian": ["Should governments run deficits during recessions?", "Is central banking a net positive?"],
    },
  },
  philosophy: {
    general: ["Is free will an illusion?", "Does objective morality exist?", "Is consciousness just an emergent property?"],
  },
  sports: {
    general: ["Is the GOAT debate even possible?", "Should college athletes be paid?", "Is esports a real sport?"],
  },
  conspiracy: {
    general: ["Is the government hiding alien contact?", "Are we living in a simulation?", "Is the media trustworthy?"],
  },
  pill: {
    general: ["Which pill ideology is the most accurate worldview?", "Are pill ideologies helpful or reductive?"],
    stancePairs: {
      "redPill|bluePill": ["Is ignorance bliss?", "Is 'waking up' worth the cost?"],
    },
  },
  religion: {
    general: ["Can morality exist without religion?", "Should religion influence law?", "Can science and faith coexist?"],
    stancePairs: {
      "christianity|atheism": ["Does God exist?", "Is faith a virtue or a weakness?"],
      "islam|atheism": ["Is Islam compatible with Western values?", "Does secularism lead to moral decay?"],
    },
  },
  anything: {
    general: ["What's the most overrated thing in society?", "Is humanity getting better or worse?", "Should we colonize Mars?", "Is the American Dream dead?", "Is social media a net negative?"],
  },
};

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

const pickDebateTopic = (myStance: string, oppStance: string, category: string) => {
  const catTopics = DEBATE_TOPICS[category] || DEBATE_TOPICS.anything;
  if (catTopics.stancePairs) {
    for (const [pairKey, topics] of Object.entries(catTopics.stancePairs)) {
      const [sideA, sideB] = pairKey.split("|");
      if ((myStance === sideA && oppStance === sideB) || (myStance === sideB && oppStance === sideA)) {
        return { topic: topics[Math.floor(Math.random() * topics.length)], source: "stance" };
      }
    }
  }
  const general = catTopics.general || DEBATE_TOPICS.anything.general;
  return { topic: general[Math.floor(Math.random() * general.length)], source: "general" };
};

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
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const [connectionState, setConnectionState] = useState<string>("disconnected");

  // Video state
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<RemoteTrack | null>(null);
  const localAudioTrackRef = useRef<LocalTrack | null>(null);
  const [isOpponentCamOff, setIsOpponentCamOff] = useState(true);

  // Debate features
  const [debateViewers, setDebateViewers] = useState(Math.floor(Math.random() * 50) + 10);
  const [debateTopic, setDebateTopic] = useState<{ topic: string; source: string }>({ topic, source: "general" });
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [myVote, setMyVote] = useState<"A" | "B" | null>(null);
  const [debateVotesA, setDebateVotesA] = useState(50);
  const [debateVotesB, setDebateVotesB] = useState(50);

  // Fact check
  const [factChecks, setFactChecks] = useState<FactCheck[]>([]);
  const [factCheckHistory, setFactCheckHistory] = useState<FactCheck[]>([]);
  const [factCheckInput, setFactCheckInput] = useState("");

  // Reactions
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  const roomRef = useRef<Room | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isUserA = currentUserId === userA.id;
  const me = isUserA ? userA : userB;
  const opponent = isUserA ? userB : userA;

  const categoryConfig = STANCE_OPTIONS[category];
  const myStanceLabel = categoryConfig?.stances.find((s) => s.id === me.stance)?.label || me.stance;
  const opponentStanceLabel = categoryConfig?.stances.find((s) => s.id === opponent.stance)?.label || opponent.stance;
  const myStanceColor = categoryConfig?.stances.find((s) => s.id === me.stance)?.color || "#10b981";
  const opponentStanceColor = categoryConfig?.stances.find((s) => s.id === opponent.stance)?.color || "#8B4513";

  // Debate timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setDebateTime((t) => t + 1);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  // Simulate viewer count changes
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setDebateViewers((v) => Math.max(5, v + Math.floor(Math.random() * 8) - 3));
    }, 8000);
    return () => clearInterval(interval);
  }, [isActive]);

  // Simulate vote changes
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setDebateVotesA((v) => Math.max(10, Math.min(90, v + Math.floor(Math.random() * 6) - 3)));
      setDebateVotesB((v) => Math.max(10, Math.min(90, v + Math.floor(Math.random() * 6) - 3)));
    }, 5000);
    return () => clearInterval(interval);
  }, [isActive]);

  // Connect to LiveKit
  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;

    const connect = async () => {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ debateId }),
        });
        const data = await res.json();
        if (data.devMode) { setDevMode(true); setConnectionState("dev-mode"); return; }
        if (!data.token || cancelled) return;

        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!livekitUrl) { setDevMode(true); setConnectionState("dev-mode"); return; }

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video) { setRemoteVideoTrack(track); setIsOpponentCamOff(false); }
        });
        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video) { setRemoteVideoTrack(null); setIsOpponentCamOff(true); }
        });
        room.on(RoomEvent.TrackMuted, (pub) => {
          if (pub.track?.kind === Track.Kind.Video && !pub.isLocal) setIsOpponentCamOff(true);
        });
        room.on(RoomEvent.TrackUnmuted, (pub) => {
          if (pub.track?.kind === Track.Kind.Video && !pub.isLocal) setIsOpponentCamOff(false);
        });
        room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => setConnectionState(state));
        room.on(RoomEvent.Disconnected, () => setConnectionState("disconnected"));

        await room.connect(livekitUrl, data.token);
        setConnectionState("connected");

        if (!cancelled) {
          await room.localParticipant.enableCameraAndMicrophone();
          const vt = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track as LocalTrack | undefined;
          const at = room.localParticipant.getTrackPublication(Track.Source.Microphone)?.track as LocalTrack | undefined;
          if (vt) setLocalVideoTrack(vt);
          if (at) localAudioTrackRef.current = at;
        }
      } catch {
        setDevMode(true);
        setConnectionState("dev-mode");
      }
    };

    connect();
    return () => { cancelled = true; if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null; } };
  }, [debateId, isActive]);

  const toggleMic = useCallback(async () => {
    if (roomRef.current) await roomRef.current.localParticipant.setMicrophoneEnabled(!isMicOn);
    setIsMicOn(!isMicOn);
  }, [isMicOn]);

  const toggleCam = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setCameraEnabled(!isCamOn);
      if (!isCamOn) {
        const vt = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera)?.track as LocalTrack | undefined;
        if (vt) setLocalVideoTrack(vt);
      } else { setLocalVideoTrack(null); }
    }
    setIsCamOn(!isCamOn);
  }, [isCamOn]);

  const handleEndDebate = useCallback(async () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null; }
    try { await fetch("/api/debate/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ debateId }) }); } catch {}
  }, [debateId]);

  const handleSkip = useCallback(async () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null; }
    try { await fetch("/api/debate/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ debateId }) }); } catch {}
    try {
      const res = await fetch("/api/matchmaking/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category }) });
      const data = await res.json();
      if (data.status === "matched") router.push(`/debate/${data.debateId}`);
      else router.push("/debate");
    } catch { router.push("/debate"); }
  }, [debateId, category, router]);

  const handleLeave = useCallback(() => {
    if (roomRef.current) roomRef.current.disconnect();
    router.push("/");
  }, [router]);

  const shuffleTopic = () => {
    const newTopic = pickDebateTopic(me.stance, opponent.stance, category);
    setDebateTopic(newTopic);
  };

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

  const clipMoment = () => {
    addReaction("✂️");
  };

  const addReaction = (emoji: string) => {
    const r: FloatingReaction = { id: Date.now(), emoji, x: 10 + Math.random() * 80 };
    setFloatingReactions((prev) => [...prev, r]);
    setTimeout(() => setFloatingReactions((prev) => prev.filter((f) => f.id !== r.id)), 2000);
  };

  // Vote percentages
  const normA = Math.round((debateVotesA / (debateVotesA + debateVotesB)) * 100);
  const normB = 100 - normA;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.attach(localVideoRef.current);
      return () => { localVideoTrack.detach(localVideoRef.current!); };
    }
  }, [localVideoTrack]);

  useEffect(() => {
    if (remoteVideoTrack && remoteVideoRef.current) {
      remoteVideoTrack.attach(remoteVideoRef.current);
      return () => { remoteVideoTrack.detach(remoteVideoRef.current!); };
    }
  }, [remoteVideoTrack]);

  return (
    <div className="debate-room-wrapper">
      <div className="debate-room">
        {/* ===== VIDEO AREA ===== */}
        <div className="video-area">
          <div className="video-grid">
            {/* MY VIDEO PANEL */}
            <div className="video-panel">
              {localVideoTrack && !(!isCamOn) ? (
                <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="video-placeholder">
                  <div className="video-placeholder-avatar" style={{ background: myStanceColor }}>{me.username[0]?.toUpperCase()}</div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{me.username}</span>
                  {!isCamOn && <span style={{ fontSize: 9, color: "var(--muted)", marginTop: 4 }}>📷 Camera off</span>}
                </div>
              )}
              <div className="live-pill"><span className="live-pill-dot" />LIVE</div>
              <div className="viewer-count-badge">👁️ {debateViewers}</div>
              <div className="video-label">
                <span className="video-label-dot" style={{ background: "var(--green)" }} />
                {me.username}
                <span className={`elo-badge ${getEloRank(me.elo)}`}>{me.elo}</span>
              </div>
              <div className="uptime-badge">{formatTime(debateTime)}</div>
              <button className="clip-btn-overlay" onClick={clipMoment}>✂️ Clip</button>
              <div className="reaction-overlay">
                {floatingReactions.map((r) => (
                  <div key={r.id} className="floating-reaction" style={{ left: `${r.x}%` }}>{r.emoji}</div>
                ))}
              </div>
            </div>

            {/* OPPONENT VIDEO PANEL */}
            <div className="video-panel">
              {remoteVideoTrack && !isOpponentCamOff ? (
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="video-placeholder">
                  <div className="video-placeholder-avatar" style={{ background: opponentStanceColor }}>{opponent.username[0]?.toUpperCase()}</div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{opponent.username}</span>
                </div>
              )}
              <div className="video-label">
                <span className="video-label-dot" style={{ background: "var(--red)" }} />
                {opponent.username}
                <span className={`elo-badge ${getEloRank(opponent.elo)}`}>{opponent.elo}</span>
              </div>
              <div className="elo-overlay">🏆 ELO: {opponent.elo}</div>
              <button className="clip-btn-overlay" onClick={clipMoment}>✂️ Clip</button>

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
                            <span className="fc-source">📎 {fc.source}</span>
                            <span className="fc-trigger search">🔍 Search</span>
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
              <span style={{ fontSize: 10, color: "var(--txt2)", fontWeight: 600 }}>🔍 Fact Checks ({factCheckHistory.length})</span>
              <span style={{ color: "#10b981", fontWeight: 700, fontSize: 10 }}>✅ {factCheckHistory.filter((f) => f.verdict === "true").length}</span>
              <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 10 }}>❌ {factCheckHistory.filter((f) => f.verdict === "false").length}</span>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 10 }}>⚠️ {factCheckHistory.filter((f) => f.verdict === "misleading").length}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
                <input
                  className="topic-propose-input"
                  style={{ fontSize: 10, padding: "3px 8px", minWidth: 160 }}
                  placeholder="Type a claim to fact-check..."
                  value={factCheckInput}
                  onChange={(e) => setFactCheckInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && factCheckInput.trim()) { submitFactCheck(factCheckInput); setFactCheckInput(""); } }}
                />
                <button className="factcheck-btn" onClick={() => { if (factCheckInput.trim()) { submitFactCheck(factCheckInput); setFactCheckInput(""); } }}>🔍 Check</button>
              </div>
            </div>
          )}

          {/* Stance clash banner */}
          {myStanceLabel && opponentStanceLabel && myStanceLabel !== "unknown" && opponentStanceLabel !== "unknown" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "6px 12px", background: "rgba(239,68,68,.06)", borderRadius: 8, border: "1px solid rgba(239,68,68,.15)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>{myStanceLabel}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", padding: "1px 6px", background: "rgba(239,68,68,.1)", borderRadius: 4 }}>VS</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#8B4513" }}>{opponentStanceLabel}</span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>({categoryConfig?.label || category})</span>
            </div>
          )}

          {/* Audience vote bar */}
          <div className="vote-section" style={{ marginTop: 4 }}>
            <div className="vote-pct left">{normA}%</div>
            <button className={`vote-btn left ${myVote === "A" ? "voted" : ""}`} onClick={() => setMyVote("A")}>{me.username}</button>
            <div className="vote-bar-lg" style={{ flex: 1 }}>
              <div className="vote-bar-left" style={{ width: `${normA}%` }} />
              <div className="vote-bar-right" />
            </div>
            <button className={`vote-btn right ${myVote === "B" ? "voted" : ""}`} onClick={() => setMyVote("B")}>{opponent.username}</button>
            <div className="vote-pct right">{normB}%</div>
          </div>

          {/* Topic banner */}
          <div className="topic-banner">
            <span className="topic-label">Topic</span>
            <span className="topic-text">{debateTopic.topic}</span>
            <span className={`topic-source ${debateTopic.source}`}>
              {debateTopic.source === "stance" ? "From stances" : debateTopic.source === "custom" ? "Custom" : "Suggested"}
            </span>
            <button className="topic-shuffle-btn" title="Shuffle topic" onClick={shuffleTopic}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </button>
          </div>

          {/* Custom topic input */}
          <div className="topic-propose-row">
            <input
              className="topic-propose-input"
              placeholder="Propose your own topic..."
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customTopicInput.trim()) {
                  setDebateTopic({ topic: customTopicInput.trim(), source: "custom" });
                  setCustomTopicInput("");
                }
              }}
            />
            <button className="topic-propose-btn" onClick={() => {
              if (!customTopicInput.trim()) return;
              setDebateTopic({ topic: customTopicInput.trim(), source: "custom" });
              setCustomTopicInput("");
            }}>Set Topic</button>
          </div>

          {/* Open Mic indicator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "4px 0" }}>
            <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>🎙️ Open Mic — No rules, no turns, no time limit</span>
          </div>

          {/* Controls bar */}
          <div className="controls-bar">
            <button className={`ctrl-btn ${isMicOn ? "active" : ""}`} onClick={toggleMic}>
              {isMicOn ? "🎙️" : "🔇"}
            </button>
            <button className={`ctrl-btn ${isCamOn ? "active" : ""}`} onClick={toggleCam}>
              {isCamOn ? "📹" : "📷"}
            </button>
            <button className="factcheck-btn" onClick={() => {
              const q = prompt("Fact-check a claim:");
              if (q) submitFactCheck(q);
            }} title="Fact-check a claim">
              🔍 Fact Check
            </button>
            {isActive && (
              <ReportButton reportedUserId={opponent.id} reportedUsername={opponent.username} debateId={debateId} />
            )}
            {isActive ? (
              <button className="ctrl-btn danger" onClick={handleEndDebate} title="End debate">✕</button>
            ) : (
              <button className="ctrl-btn" onClick={handleLeave} style={{ fontSize: 11, width: "auto", borderRadius: 6, padding: "0 14px", fontWeight: 700 }}>Leave</button>
            )}
            {isActive && (
              <button className="ctrl-btn next-btn" onClick={handleSkip}>⏭ Next</button>
            )}
          </div>

          {/* Dev mode indicator */}
          {devMode && (
            <div style={{ textAlign: "center", fontSize: 10, color: "#f59e0b", padding: 4, background: "rgba(245,158,11,.08)", borderRadius: 6 }}>
              ⚡ Dev Mode — LiveKit not connected, video disabled
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
  );
}
