"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { STANCE_OPTIONS } from "@/utils/constants";
import { createClient } from "@/lib/supabase/client";
import DebateChat from "@/components/debate/DebateChat";
import { Room, RoomEvent, Track, RemoteTrack, RemoteTrackPublication, RemoteParticipant, ConnectionState } from "livekit-client";

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
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

const getEloRank = (elo: number) =>
  elo >= 1800 ? "text-amber-800" : elo >= 1500 ? "text-gray-500" : "text-orange-700";

export default function WatchClient({
  debate,
  userA,
  userB,
  initialVotesA,
  initialVotesB,
  initialUserVote,
  currentUserId,
}: WatchClientProps) {
  const [votedFor, setVotedFor] = useState<"A" | "B" | null>(initialUserVote);
  const [votesA, setVotesA] = useState(initialVotesA);
  const [votesB, setVotesB] = useState(initialVotesB);
  const [currentTopic, setCurrentTopic] = useState(debate.topic);
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - new Date(debate.createdAt).getTime()) / 1000)
  );
  const supabaseRef = useRef(createClient());

  // LiveKit viewer state
  const [videoTrackA, setVideoTrackA] = useState<RemoteTrack | null>(null);
  const [videoTrackB, setVideoTrackB] = useState<RemoteTrack | null>(null);
  const [devMode, setDevMode] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);

  const categoryConfig = STANCE_OPTIONS[debate.category];
  const stanceLabelA = categoryConfig?.stances.find((s) => s.id === userA.stance)?.label || userA.stance;
  const stanceLabelB = categoryConfig?.stances.find((s) => s.id === userB.stance)?.label || userB.stance;

  useEffect(() => {
    if (debate.status !== "active") return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [debate.status]);

  // Listen for topic changes in real time
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`watch-topic-${debate.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "debates", filter: `id=eq.${debate.id}` },
        (payload) => {
          if (payload.new.topic) {
            setCurrentTopic(payload.new.topic);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [debate.id]);

  // Connect to LiveKit as a viewer (subscribe-only, no publishing)
  useEffect(() => {
    if (debate.status !== "active" || !currentUserId) return;
    let cancelled = false;

    const connectViewer = async () => {
      try {
        // Fetch viewer token
        console.log("[LiveKit Viewer] Fetching token for debate:", debate.id);
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ debateId: debate.id }),
        });
        const data = await res.json();
        console.log("[LiveKit Viewer] Token response:", { devMode: data.devMode, hasToken: !!data.token });

        if (!res.ok || data.devMode || !data.token || cancelled) {
          setDevMode(true);
          return;
        }

        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!livekitUrl) {
          console.error("[LiveKit Viewer] NEXT_PUBLIC_LIVEKIT_URL not set");
          setDevMode(true);
          return;
        }

        // Create room (viewer — no publishing)
        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        // Track subscription: map participant identity to userA or userB
        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
          if (track.kind === Track.Kind.Video) {
            console.log("[LiveKit Viewer] Video track subscribed from:", participant.identity);
            if (participant.identity === userA.id) {
              setVideoTrackA(track);
            } else if (participant.identity === userB.id) {
              setVideoTrackB(track);
            }
          } else if (track.kind === Track.Kind.Audio) {
            // Attach audio track for playback
            const audioEl = track.attach();
            audioEl.setAttribute("data-lk-audio", "viewer");
            document.body.appendChild(audioEl);
            console.log("[LiveKit Viewer] Audio track attached from:", participant.identity);
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
          if (track.kind === Track.Kind.Video) {
            console.log("[LiveKit Viewer] Video track unsubscribed from:", participant.identity);
            if (participant.identity === userA.id) {
              setVideoTrackA(null);
            } else if (participant.identity === userB.id) {
              setVideoTrackB(null);
            }
          } else if (track.kind === Track.Kind.Audio) {
            track.detach().forEach((el) => el.remove());
            console.log("[LiveKit Viewer] Audio track detached from:", participant.identity);
          }
        });

        room.on(RoomEvent.TrackMuted, (pub, participant) => {
          if (pub.track?.kind === Track.Kind.Video && participant instanceof RemoteParticipant) {
            if (participant.identity === userA.id) setVideoTrackA(null);
            else if (participant.identity === userB.id) setVideoTrackB(null);
          }
        });

        room.on(RoomEvent.TrackUnmuted, (pub, participant) => {
          if (pub.track?.kind === Track.Kind.Video && participant instanceof RemoteParticipant) {
            const track = pub.track as RemoteTrack;
            if (participant.identity === userA.id) setVideoTrackA(track);
            else if (participant.identity === userB.id) setVideoTrackB(track);
          }
        });

        room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
          console.log("[LiveKit Viewer] Connection state:", state);
        });

        room.on(RoomEvent.Disconnected, () => {
          console.log("[LiveKit Viewer] Disconnected");
        });

        // Connect (viewer only subscribes, never publishes)
        console.log("[LiveKit Viewer] Connecting to:", livekitUrl);
        await room.connect(livekitUrl, data.token);
        console.log("[LiveKit Viewer] Connected successfully");

        // Check if participants already have tracks published
        if (!cancelled) {
          room.remoteParticipants.forEach((participant) => {
            participant.trackPublications.forEach((pub) => {
              if (pub.track && pub.track.kind === Track.Kind.Video) {
                console.log("[LiveKit Viewer] Found existing video track from:", participant.identity);
                if (participant.identity === userA.id) setVideoTrackA(pub.track as RemoteTrack);
                else if (participant.identity === userB.id) setVideoTrackB(pub.track as RemoteTrack);
              }
            });
          });
        }
      } catch (err) {
        console.error("[LiveKit Viewer] Connection failed:", err);
        setDevMode(true);
      }
    };

    connectViewer();
    return () => {
      cancelled = true;
      document.querySelectorAll("audio[data-lk-audio]").forEach((el) => el.remove());
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [debate.id, debate.status, currentUserId, userA.id, userB.id]);

  // Attach/detach video tracks to <video> elements
  useEffect(() => {
    const el = videoRefA.current;
    if (videoTrackA && el) {
      videoTrackA.attach(el);
      return () => { videoTrackA.detach(el); };
    }
  }, [videoTrackA]);

  useEffect(() => {
    const el = videoRefB.current;
    if (videoTrackB && el) {
      videoTrackB.attach(el);
      return () => { videoTrackB.detach(el); };
    }
  }, [videoTrackB]);

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
      // Revert on error
      setVotedFor(null);
      if (side === "A") setVotesA((v) => v - 1);
      else setVotesB((v) => v - 1);
    }
  };

  const totalVotes = votesA + votesB;
  const pctA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;

  const isEnded = debate.status !== "active";

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Back button + stream info */}
        <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-3">
          <Link href="/browse" className="text-gray-400 hover:text-gray-600 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{currentTopic || "No topic set yet"}</p>
            <p className="text-[11px] text-gray-500">
              {categoryConfig?.label || debate.category}
              {stanceLabelA !== "unknown" && stanceLabelB !== "unknown" && (
                <span> — {stanceLabelA} vs {stanceLabelB}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEnded ? (
              <span className="bg-gray-400 text-white text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wide">
                ENDED
              </span>
            ) : (
              <span className="bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wide animate-pulse">
                LIVE
              </span>
            )}
            <span className="text-[11px] text-gray-500 font-mono">{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Video Feed */}
        <div className="flex-1 flex gap-0.5 bg-gray-100 p-1">
          {/* Debater A */}
          <div className="flex-1 relative rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
            {videoTrackA ? (
              <video ref={videoRefA} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold text-white"
                  style={{ background: userA.color }}
                >
                  {userA.username[0].toUpperCase()}
                </div>
                <Link href={`/profile/${userA.username}`} className="text-sm font-bold text-gray-700 hover:underline hover:text-emerald-600 transition">{userA.username}</Link>
                {!devMode && debate.status === "active" && (
                  <span className="text-[10px] text-gray-400">Waiting for video...</span>
                )}
              </div>
            )}
            <Link href={`/profile/${userA.username}`} className="absolute bottom-3 left-3 bg-black/70 text-white px-2.5 py-1 rounded-md hover:bg-black/80 transition">
              <p className="text-xs font-bold">{userA.username}</p>
              <p className={`text-[10px] font-semibold ${getEloRank(userA.elo)}`}>{userA.elo} ELO</p>
            </Link>
            {stanceLabelA !== "unknown" && (
              <div
                className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold text-white"
                style={{ background: userA.color }}
              >
                {stanceLabelA}
              </div>
            )}
          </div>
          {/* VS divider */}
          <div className="flex items-center justify-center w-10 text-emerald-500 font-black text-sm">
            VS
          </div>
          {/* Debater B */}
          <div className="flex-1 relative rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
            {videoTrackB ? (
              <video ref={videoRefB} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold text-white"
                  style={{ background: userB.color }}
                >
                  {userB.username[0].toUpperCase()}
                </div>
                <Link href={`/profile/${userB.username}`} className="text-sm font-bold text-gray-700 hover:underline hover:text-emerald-600 transition">{userB.username}</Link>
                {!devMode && debate.status === "active" && (
                  <span className="text-[10px] text-gray-400">Waiting for video...</span>
                )}
              </div>
            )}
            <Link href={`/profile/${userB.username}`} className="absolute bottom-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-md text-right hover:bg-black/80 transition">
              <p className="text-xs font-bold">{userB.username}</p>
              <p className={`text-[10px] font-semibold ${getEloRank(userB.elo)}`}>{userB.elo} ELO</p>
            </Link>
            {stanceLabelB !== "unknown" && (
              <div
                className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold text-white"
                style={{ background: userB.color }}
              >
                {stanceLabelB}
              </div>
            )}
          </div>
        </div>

        {/* Vote Bar + Buttons */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          {/* Vote bar */}
          <div className="flex h-6 rounded-full overflow-hidden mb-3 bg-gray-200">
            <div
              className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
              style={{ width: `${pctA}%` }}
            >
              {pctA}%
            </div>
            <div
              className="bg-amber-800 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
              style={{ width: `${pctB}%` }}
            >
              {pctB}%
            </div>
          </div>
          {/* Vote buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleVote("A")}
              disabled={votedFor !== null || !currentUserId}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${
                votedFor === "A"
                  ? "bg-emerald-500 text-white"
                  : votedFor === "B"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30"
              }`}
            >
              Vote {userA.username}
            </button>
            <button
              onClick={() => handleVote("B")}
              disabled={votedFor !== null || !currentUserId}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${
                votedFor === "B"
                  ? "bg-amber-800 text-white"
                  : votedFor === "A"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-amber-800/10 text-amber-800 hover:bg-amber-800/20 border border-amber-800/30"
              }`}
            >
              Vote {userB.username}
            </button>
          </div>
          {!currentUserId && (
            <p className="text-[10px] text-gray-400 text-center mt-2">
              <Link href="/login" className="text-emerald-500 hover:underline">Sign in</Link> to vote
            </p>
          )}
          {totalVotes > 0 && (
            <p className="text-[10px] text-gray-400 text-center mt-1">
              {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      {currentUserId ? (
        <DebateChat
          debateId={debate.id}
          currentUserId={currentUserId}
          currentUsername="Spectator"
          userAId={userA.id}
          userAUsername={userA.username}
          userBUsername={userB.username}
          isActive={!isEnded}
          userAColor={userA.color}
          userBColor={userB.color}
          userAElo={userA.elo}
          userBElo={userB.elo}
          onReaction={() => {}}
        />
      ) : (
        <div className="hidden lg:flex w-[320px] border-l border-gray-200 flex-col bg-gray-50 items-center justify-center">
          <p className="text-xs text-gray-400 mb-2">Sign in to chat</p>
          <Link href="/login" className="text-emerald-500 text-xs font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
