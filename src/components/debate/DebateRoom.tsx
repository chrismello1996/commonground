"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Room, RoomEvent, Track, RemoteTrack, LocalTrack, ConnectionState } from "livekit-client";
import { STANCE_OPTIONS } from "@/utils/constants";
import VideoTile from "./VideoTile";
import DebateChat from "./DebateChat";

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
  const [showChat, setShowChat] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const [connectionState, setConnectionState] = useState<string>("disconnected");

  // LiveKit state
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<RemoteTrack | null>(null);
  const localAudioTrackRef = useRef<LocalTrack | null>(null);
  const [isOpponentMuted, setIsOpponentMuted] = useState(false);
  const [isOpponentCamOff, setIsOpponentCamOff] = useState(true);

  const roomRef = useRef<Room | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isUserA = currentUserId === userA.id;
  const me = isUserA ? userA : userB;
  const opponent = isUserA ? userB : userA;

  const categoryConfig = STANCE_OPTIONS[category];
  const myStanceLabel = categoryConfig?.stances.find((s) => s.id === me.stance)?.label || me.stance;
  const opponentStanceLabel = categoryConfig?.stances.find((s) => s.id === opponent.stance)?.label || opponent.stance;

  // Debate timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setDebateTime((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  // Connect to LiveKit room
  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;

    const connect = async () => {
      try {
        // Get token from API
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ debateId }),
        });

        const data = await res.json();

        if (data.devMode) {
          setDevMode(true);
          setConnectionState("dev-mode");
          return;
        }

        if (!data.token || cancelled) return;

        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!livekitUrl) {
          setDevMode(true);
          setConnectionState("dev-mode");
          return;
        }

        // Create and connect to room
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        roomRef.current = room;

        // Handle remote tracks
        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video) {
            setRemoteVideoTrack(track);
            setIsOpponentCamOff(false);
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video) {
            setRemoteVideoTrack(null);
            setIsOpponentCamOff(true);
          }
        });

        room.on(RoomEvent.TrackMuted, (publication) => {
          if (publication.track?.kind === Track.Kind.Audio && !publication.isLocal) {
            setIsOpponentMuted(true);
          }
          if (publication.track?.kind === Track.Kind.Video && !publication.isLocal) {
            setIsOpponentCamOff(true);
          }
        });

        room.on(RoomEvent.TrackUnmuted, (publication) => {
          if (publication.track?.kind === Track.Kind.Audio && !publication.isLocal) {
            setIsOpponentMuted(false);
          }
          if (publication.track?.kind === Track.Kind.Video && !publication.isLocal) {
            setIsOpponentCamOff(false);
          }
        });

        room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
          setConnectionState(state);
        });

        room.on(RoomEvent.Disconnected, () => {
          setConnectionState("disconnected");
        });

        // Connect
        await room.connect(livekitUrl, data.token);
        setConnectionState("connected");

        // Publish local tracks
        if (!cancelled) {
          await room.localParticipant.enableCameraAndMicrophone();
          const videoTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track as LocalTrack | undefined;
          const audioTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone)?.track as LocalTrack | undefined;
          if (videoTrack) setLocalVideoTrack(videoTrack);
          if (audioTrack) localAudioTrackRef.current = audioTrack;
        }
      } catch (error) {
        console.error("LiveKit connection error:", error);
        setDevMode(true);
        setConnectionState("dev-mode");
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [debateId, isActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleMic = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!isMicOn);
    }
    setIsMicOn(!isMicOn);
  }, [isMicOn]);

  const toggleCam = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setCameraEnabled(!isCamOn);
      if (!isCamOn) {
        const videoTrack = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera)?.track as LocalTrack | undefined;
        if (videoTrack) setLocalVideoTrack(videoTrack);
      } else {
        setLocalVideoTrack(null);
      }
    }
    setIsCamOn(!isCamOn);
  }, [isCamOn]);

  const handleEndDebate = useCallback(async () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Disconnect LiveKit
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    // Update debate status in Supabase
    try {
      await fetch("/api/debate/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debateId }),
      });
    } catch (error) {
      console.error("Failed to end debate:", error);
    }
  }, [debateId]);

  const handleLeave = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
    }
    router.push("/find");
  }, [router]);

  const handleSkip = useCallback(async () => {
    // End current debate
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    try {
      await fetch("/api/debate/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debateId }),
      });
    } catch {
      // Best effort
    }

    // Rejoin queue with same category
    try {
      const res = await fetch("/api/matchmaking/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (data.status === "matched") {
        router.push(`/debate/${data.debateId}`);
      } else {
        router.push("/find");
      }
    } catch {
      router.push("/find");
    }
  }, [debateId, category, router]);

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar — topic + timer */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-400 uppercase tracking-wider font-medium mb-0.5">
              {categoryConfig?.label || category}
            </p>
            <p className="text-white font-medium truncate">{topic}</p>
          </div>

          <div className="flex items-center gap-4 ml-4">
            {/* Connection status */}
            {devMode && (
              <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
                Dev Mode — no video
              </span>
            )}

            {/* Timer */}
            <div className="text-center">
              <p className="text-2xl font-mono text-white">{formatTime(debateTime)}</p>
              <p className="text-[10px] text-gray-500 uppercase">Duration</p>
            </div>

            {/* Status indicator */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-gray-800 text-gray-400 border border-gray-700"
            }`}>
              {isActive ? "● LIVE" : "ENDED"}
            </div>

            {/* Chat toggle */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                showChat
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-gray-800 text-gray-400 border border-gray-700 hover:text-white"
              }`}
            >
              💬 Chat
            </button>
          </div>
        </div>
      </div>

      {/* Main content — video + chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* My video */}
          <div className="flex-1 relative border-b lg:border-b-0 lg:border-r border-gray-800">
            <VideoTile
              track={localVideoTrack || undefined}
              username={me.username}
              stanceLabel={myStanceLabel}
              elo={me.elo}
              isLocal={true}
              isMuted={!isMicOn}
              isCameraOff={!isCamOn}
              accentColor="emerald"
            />
          </div>

          {/* Opponent video */}
          <div className="flex-1 relative">
            <VideoTile
              track={remoteVideoTrack || undefined}
              username={opponent.username}
              stanceLabel={opponentStanceLabel}
              elo={opponent.elo}
              isLocal={false}
              isMuted={isOpponentMuted}
              isCameraOff={isOpponentCamOff}
              accentColor="red"
            />
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-80 hidden lg:flex flex-col">
            <DebateChat
              debateId={debateId}
              currentUserId={currentUserId}
              currentUsername={me.username}
              userAId={userA.id}
              userAUsername={userA.username}
              userBUsername={userB.username}
              isActive={isActive}
            />
          </div>
        )}
      </div>

      {/* Bottom bar — controls */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left — debate info */}
          <div className="text-sm text-gray-400">
            <span className="text-gray-500">ID:</span> {debateId.slice(0, 8)}
            {connectionState === "connected" && (
              <span className="ml-2 text-emerald-400 text-xs">● Connected</span>
            )}
            {connectionState === "dev-mode" && (
              <span className="ml-2 text-yellow-400 text-xs">● Dev mode</span>
            )}
          </div>

          {/* Center — action buttons */}
          <div className="flex items-center gap-3">
            {/* Mic toggle */}
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isMicOn
                  ? "bg-gray-800 border border-gray-700 text-white hover:bg-gray-700"
                  : "bg-red-600/20 border border-red-500/30 text-red-400"
              }`}
            >
              {isMicOn ? "🎙️" : "🔇"}
            </button>

            {/* Camera toggle */}
            <button
              onClick={toggleCam}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isCamOn
                  ? "bg-gray-800 border border-gray-700 text-white hover:bg-gray-700"
                  : "bg-red-600/20 border border-red-500/30 text-red-400"
              }`}
            >
              {isCamOn ? "📷" : "📷"}
            </button>

            {/* Skip / Next opponent */}
            {isActive && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 rounded-lg bg-orange-600/20 border border-orange-500/30 text-orange-400 hover:bg-orange-600/30 transition-colors text-sm font-medium"
                title="Skip to next opponent"
              >
                Skip ⏭
              </button>
            )}

            {/* End debate / Leave */}
            {isActive ? (
              <button
                onClick={handleEndDebate}
                className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-colors"
                title="End debate"
              >
                ✕
              </button>
            ) : (
              <button
                onClick={handleLeave}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm font-medium"
              >
                Leave Room
              </button>
            )}
          </div>

          {/* Right — viewer count placeholder */}
          <div className="text-sm text-gray-400">
            👁️ <span className="text-white">0</span> watching
          </div>
        </div>
      </div>
    </div>
  );
}
