"use client";

import { useState, useEffect, useRef } from "react";
import { STANCE_OPTIONS } from "@/utils/constants";

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
  const [debateTime, setDebateTime] = useState(0);
  const [isActive, setIsActive] = useState(status === "active");
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleEndDebate = async () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    // TODO: Update debate status in Supabase, calculate ELO changes
  };

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
          </div>
        </div>
      </div>

      {/* Main content — video areas */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* User A (left / top) video */}
        <div className="flex-1 relative bg-gray-950 border-b lg:border-b-0 lg:border-r border-gray-800">
          {/* Video placeholder — LiveKit will go here in Phase 5 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-emerald-400">
                  {me.username[0]?.toUpperCase()}
                </span>
              </div>
              <p className="text-white font-semibold text-lg">{me.username}</p>
              <p className="text-emerald-400 text-sm">{myStanceLabel}</p>
              <p className="text-gray-500 text-xs mt-1">{me.elo} ELO</p>
              <p className="text-gray-700 text-xs mt-4">Camera will appear here</p>
            </div>
          </div>

          {/* Name overlay */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <p className="text-white text-sm font-medium">{me.username} <span className="text-gray-400">(You)</span></p>
          </div>
        </div>

        {/* User B (right / bottom) video */}
        <div className="flex-1 relative bg-gray-950">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-red-400">
                  {opponent.username[0]?.toUpperCase()}
                </span>
              </div>
              <p className="text-white font-semibold text-lg">{opponent.username}</p>
              <p className="text-red-400 text-sm">{opponentStanceLabel}</p>
              <p className="text-gray-500 text-xs mt-1">{opponent.elo} ELO</p>
              <p className="text-gray-700 text-xs mt-4">Camera will appear here</p>
            </div>
          </div>

          {/* Name overlay */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <p className="text-white text-sm font-medium">{opponent.username}</p>
          </div>
        </div>
      </div>

      {/* Bottom bar — controls */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left — debate info */}
          <div className="text-sm text-gray-400">
            <span className="text-gray-500">Debate ID:</span> {debateId.slice(0, 8)}...
          </div>

          {/* Center — action buttons */}
          <div className="flex items-center gap-3">
            {/* Mic toggle placeholder */}
            <button className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
              🎙️
            </button>

            {/* Camera toggle placeholder */}
            <button className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
              📷
            </button>

            {/* End debate */}
            {isActive && (
              <button
                onClick={handleEndDebate}
                className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-colors"
              >
                ✕
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
