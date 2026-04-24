"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoTrack,
  RoomAudioRenderer,
  useRemoteParticipants,
  useTracks,
  useConnectionState,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track, ConnectionState } from "livekit-client";

interface LiveKitVideoRenderProps {
  localVideoEl: React.ReactNode;
  remoteVideoEl: React.ReactNode;
  /** Map of participant identity → video element (useful for watch page with 2 remote feeds) */
  remoteVideoByIdentity: Record<string, React.ReactNode>;
  isConnected: boolean;
  isCamOn: boolean;
  isMicOn: boolean;
  toggleCam: () => void;
  toggleMic: () => void;
  viewerCount: number;
}

interface LiveKitVideoProps {
  debateId: string;
  /** When true, participant publishes camera + mic. When false, subscribe-only (viewer). */
  isParticipant: boolean;
  /** Called when connection state changes */
  onConnectionChange?: (connected: boolean, viewerCount: number) => void;
  /** Called when devMode is detected (no LiveKit credentials configured) */
  onDevMode?: () => void;
  /** Render prop: receives local and remote video elements + connection info */
  children: (props: LiveKitVideoRenderProps) => React.ReactNode;
}

function LiveKitVideoInner({
  isParticipant,
  children,
  onConnectionChange,
}: {
  isParticipant: boolean;
  children: LiveKitVideoProps["children"];
  onConnectionChange?: LiveKitVideoProps["onConnectionChange"];
}) {
  const connectionState = useConnectionState();
  const isConnected = connectionState === ConnectionState.Connected;
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant } = useLocalParticipant();

  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [mediaInitialized, setMediaInitialized] = useState(false);

  // Enable camera and mic after connection (with error handling for missing devices)
  useEffect(() => {
    if (!isConnected || !isParticipant || mediaInitialized || !localParticipant) return;
    setMediaInitialized(true);

    const enableMedia = async () => {
      // Try camera
      try {
        await localParticipant.setCameraEnabled(true);
        setIsCamOn(true);
        console.log("[LiveKit] Camera enabled");
      } catch (err) {
        console.warn("[LiveKit] Camera not available:", err);
        setIsCamOn(false);
      }
      // Try microphone
      try {
        await localParticipant.setMicrophoneEnabled(true);
        setIsMicOn(true);
        console.log("[LiveKit] Microphone enabled");
      } catch (err) {
        console.warn("[LiveKit] Microphone not available:", err);
        setIsMicOn(false);
      }
    };

    enableMedia();
  }, [isConnected, isParticipant, mediaInitialized, localParticipant]);

  // Get all video tracks
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Separate local and remote video tracks
  const localVideoTrack = tracks.find(
    (t) =>
      t.participant?.identity === localParticipant?.identity &&
      t.source === Track.Source.Camera &&
      t.publication?.track
  );

  const remoteVideoTracks = tracks.filter(
    (t) =>
      t.participant?.identity !== localParticipant?.identity &&
      t.source === Track.Source.Camera &&
      t.publication?.track
  );

  const remoteVideoTrack = remoteVideoTracks[0] || null;

  // Viewer count: total participants minus 2 debaters
  const viewerCount = Math.max(0, remoteParticipants.length - 1);

  // Notify parent of connection changes
  useEffect(() => {
    onConnectionChange?.(isConnected, viewerCount);
  }, [isConnected, viewerCount, onConnectionChange]);

  const toggleCam = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setCameraEnabled(!isCamOn);
      setIsCamOn(!isCamOn);
    } catch (err) {
      console.error("[LiveKit] Camera toggle failed:", err);
    }
  };

  const toggleMic = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setMicrophoneEnabled(!isMicOn);
      setIsMicOn(!isMicOn);
    } catch (err) {
      console.error("[LiveKit] Mic toggle failed:", err);
    }
  };

  // Build video elements
  const localVideoEl = localVideoTrack?.publication?.track ? (
    <VideoTrack
      trackRef={localVideoTrack}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  ) : null;

  const remoteVideoEl = remoteVideoTrack?.publication?.track ? (
    <VideoTrack
      trackRef={remoteVideoTrack}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  ) : null;

  // Build map of identity → video element for multi-remote scenarios (watch page)
  const remoteVideoByIdentity: Record<string, React.ReactNode> = {};
  for (const rt of remoteVideoTracks) {
    if (rt.participant?.identity && rt.publication?.track) {
      remoteVideoByIdentity[rt.participant.identity] = (
        <VideoTrack
          trackRef={rt}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    }
  }

  return (
    <>
      {/* RoomAudioRenderer handles ALL remote audio playback automatically,
          including autoplay policies and browser restrictions */}
      <RoomAudioRenderer />
      {children({
        localVideoEl,
        remoteVideoEl,
        remoteVideoByIdentity,
        isConnected,
        isCamOn: isCamOn && !!localVideoTrack?.publication?.track,
        isMicOn,
        toggleCam,
        toggleMic,
        viewerCount,
      })}
    </>
  );
}

export default function LiveKitVideo({
  debateId,
  isParticipant,
  onConnectionChange,
  onDevMode,
  children,
}: LiveKitVideoProps) {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  // Prevent SSR hydration mismatch — only render LiveKit on client
  useEffect(() => { setMounted(true); }, []);

  // Fetch token on mount
  useEffect(() => {
    let cancelled = false;

    const fetchToken = async () => {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ debateId }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          console.error("[LiveKit] Token error:", data.error);
          setError(data.error);
          setDevMode(true);
          onDevMode?.();
          return;
        }

        if (data.devMode || !data.token) {
          setDevMode(true);
          onDevMode?.();
          return;
        }

        const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!url) {
          console.error("[LiveKit] NEXT_PUBLIC_LIVEKIT_URL not set");
          setDevMode(true);
          onDevMode?.();
          return;
        }

        setToken(data.token);
        setLivekitUrl(url);
      } catch (err) {
        console.error("[LiveKit] Failed to fetch token:", err);
        setDevMode(true);
        onDevMode?.();
      }
    };

    fetchToken();
    return () => { cancelled = true; };
  }, [debateId, onDevMode]);

  // Dev mode or not yet mounted — render children with no video
  if (!mounted || devMode || !token || !livekitUrl) {
    return (
      <>
        {children({
          localVideoEl: null,
          remoteVideoEl: null,
          remoteVideoByIdentity: {},
          isConnected: false,
          isCamOn: false,
          isMicOn: false,
          toggleCam: () => {},
          toggleMic: () => {},
          viewerCount: 0,
        })}
      </>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      video={false}
      audio={false}
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
      onDisconnected={() => {
        console.log("[LiveKit] Disconnected from room");
      }}
      onConnected={() => {
        console.log("[LiveKit] Connected to room");
      }}
    >
      <LiveKitVideoInner
        isParticipant={isParticipant}
        onConnectionChange={onConnectionChange}
      >
        {children}
      </LiveKitVideoInner>
    </LiveKitRoom>
  );
}
