"use client";

import { useEffect, useState, useRef } from "react";
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
  const {
    localParticipant,
    isCameraEnabled,
    isMicrophoneEnabled,
    cameraTrack,
  } = useLocalParticipant();

  // Track whether we've already attempted to enable media
  const mediaInitRef = useRef(false);

  // Log connection state changes for debugging
  useEffect(() => {
    console.log("[LiveKit] Connection state:", connectionState);
  }, [connectionState]);

  // Log when remote participants change
  useEffect(() => {
    console.log("[LiveKit] Remote participants:", remoteParticipants.length, remoteParticipants.map(p => p.identity));
  }, [remoteParticipants]);

  // Enable camera and mic AFTER connection is established (with error handling for missing devices)
  // We use video={false}/audio={false} on LiveKitRoom to prevent device errors from killing the connection,
  // then manually enable here where we can catch errors gracefully.
  useEffect(() => {
    if (!isConnected || !isParticipant || !localParticipant || mediaInitRef.current) return;
    mediaInitRef.current = true;

    const enableMedia = async () => {
      // Try camera first
      try {
        await localParticipant.setCameraEnabled(true);
        console.log("[LiveKit] Camera enabled successfully");
      } catch (err) {
        console.warn("[LiveKit] Camera not available (this is OK on devices without a camera):", err);
      }

      // Try microphone separately — don't let camera failure prevent mic from working
      try {
        await localParticipant.setMicrophoneEnabled(true);
        console.log("[LiveKit] Microphone enabled successfully");
      } catch (err) {
        console.warn("[LiveKit] Microphone not available:", err);
      }
    };

    // Small delay to ensure room is fully ready before requesting media
    const timer = setTimeout(enableMedia, 500);
    return () => clearTimeout(timer);
  }, [isConnected, isParticipant, localParticipant]);

  // Log track state for debugging
  useEffect(() => {
    if (isParticipant) {
      console.log("[LiveKit] Local media state — camera:", isCameraEnabled, "mic:", isMicrophoneEnabled);
    }
  }, [isCameraEnabled, isMicrophoneEnabled, isParticipant]);

  // Get all video tracks
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Log tracks for debugging
  useEffect(() => {
    const trackInfo = tracks.map(t => ({
      identity: t.participant?.identity?.slice(0, 8),
      source: t.source,
      hasTrack: !!t.publication?.track,
      isSubscribed: t.publication?.isSubscribed,
    }));
    console.log("[LiveKit] Tracks:", JSON.stringify(trackInfo));
  }, [tracks]);

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

  // Viewer count: total participants minus 1 (the other debater)
  const viewerCount = Math.max(0, remoteParticipants.length - 1);

  // Notify parent of connection changes
  useEffect(() => {
    onConnectionChange?.(isConnected, viewerCount);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, viewerCount]);

  const toggleCam = async () => {
    if (!localParticipant) return;
    try {
      const newState = !isCameraEnabled;
      await localParticipant.setCameraEnabled(newState);
      console.log("[LiveKit] Camera toggled:", newState);
    } catch (err) {
      console.error("[LiveKit] Camera toggle failed:", err);
    }
  };

  const toggleMic = async () => {
    if (!localParticipant) return;
    try {
      const newState = !isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(newState);
      console.log("[LiveKit] Mic toggled:", newState);
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
        isCamOn: isCameraEnabled && !!cameraTrack,
        isMicOn: isMicrophoneEnabled,
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

  // Prevent SSR hydration mismatch — only render LiveKit on client
  useEffect(() => { setMounted(true); }, []);

  // Fetch token on mount
  useEffect(() => {
    let cancelled = false;

    const fetchToken = async () => {
      try {
        console.log("[LiveKit] Fetching token for debate:", debateId);
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ debateId }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          console.error("[LiveKit] Token error:", data.error);
          setDevMode(true);
          onDevMode?.();
          return;
        }

        if (data.devMode || !data.token) {
          console.warn("[LiveKit] Dev mode — no LiveKit credentials configured");
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

        console.log("[LiveKit] Token received, connecting to:", url);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debateId]);

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

  // IMPORTANT: video={false} and audio={false} prevents device errors from killing
  // the entire connection (e.g. on Mac Mini without camera/mic). Media is enabled
  // manually in LiveKitVideoInner after connection is established, with try/catch
  // so missing devices don't crash anything.
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
        console.log("[LiveKit] Connected to room successfully");
      }}
      onError={(err) => {
        // Log but don't crash — device errors are expected on some machines
        console.warn("[LiveKit] Room error (non-fatal):", err.message);
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
