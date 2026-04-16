"use client";

import { useRef, useEffect } from "react";
import type { Track } from "livekit-client";

interface VideoTileProps {
  track?: Track;
  username: string;
  stanceLabel: string;
  elo: number;
  isLocal: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  accentColor: "emerald" | "red";
}

export default function VideoTile({
  track,
  username,
  stanceLabel,
  elo,
  isLocal,
  isMuted = false,
  isCameraOff = false,
  accentColor,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (track && el) {
      track.attach(el);
      return () => {
        track.detach(el);
      };
    }
  }, [track]);

  const colorClasses = {
    emerald: {
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/40",
      text: "text-emerald-400",
      stanceBg: "bg-emerald-500/20",
      stanceBorder: "border-emerald-500/30",
    },
    red: {
      bg: "bg-red-500/20",
      border: "border-red-500/40",
      text: "text-red-400",
      stanceBg: "bg-red-500/20",
      stanceBorder: "border-red-500/30",
    },
  }[accentColor];

  return (
    <div className="flex-1 relative bg-gray-950 overflow-hidden">
      {/* Video element */}
      {track && !isCameraOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        /* Avatar placeholder when no video */
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full ${colorClasses.bg} border-2 ${colorClasses.border} flex items-center justify-center mx-auto mb-4`}>
              <span className={`text-3xl font-bold ${colorClasses.text}`}>
                {username[0]?.toUpperCase()}
              </span>
            </div>
            <p className="text-white font-semibold text-lg">{username}</p>
            <p className={`${colorClasses.text} text-sm`}>{stanceLabel}</p>
            <p className="text-gray-500 text-xs mt-1">{elo} ELO</p>
            {isCameraOff && track !== undefined && (
              <p className="text-gray-600 text-xs mt-3">Camera off</p>
            )}
          </div>
        </div>
      )}

      {/* Name overlay */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
        <p className="text-white text-sm font-medium">
          {username} {isLocal && <span className="text-gray-400">(You)</span>}
        </p>
        {isMuted && (
          <span className="text-red-400 text-xs">🔇</span>
        )}
      </div>

      {/* Stance badge */}
      <div className={`absolute top-4 left-4 ${colorClasses.stanceBg} border ${colorClasses.stanceBorder} rounded-full px-2.5 py-0.5`}>
        <span className={`text-xs font-medium ${colorClasses.text}`}>{stanceLabel}</span>
      </div>
    </div>
  );
}
