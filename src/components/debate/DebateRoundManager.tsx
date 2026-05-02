"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Round {
  name: string;
  speaker: string; // "A" | "B" | "both"
  duration: number; // seconds
  description: string;
}

interface DebateRoundManagerProps {
  debateId: string;
  rounds: Round[];
  formatLabel: string;
  formatIcon: string;
  formatColor: string;
  totalTime: number;
  isUserA: boolean;
  currentUserId: string;
  userAUsername: string;
  userBUsername: string;
  isMicOn: boolean;
  toggleMic: () => void;
  onDebateEnd: () => void;
}

export default function DebateRoundManager({
  debateId,
  rounds,
  formatLabel,
  formatIcon,
  formatColor,
  isUserA,
  currentUserId,
  userAUsername,
  userBUsername,
  isMicOn,
  toggleMic,
  onDebateEnd,
}: DebateRoundManagerProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(rounds[0]?.duration || 0);
  const [isGracePeriod, setIsGracePeriod] = useState(false);
  const [graceTimeLeft, setGraceTimeLeft] = useState(5);
  const [isComplete, setIsComplete] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabaseRef = useRef(createClient());
  const prevMuteStateRef = useRef<boolean | null>(null);

  const round = rounds[currentRound];
  const totalRounds = rounds.length;

  // Determine who should be speaking
  const getSpeakerInfo = useCallback((r: Round) => {
    if (r.speaker === "both") {
      return { speakerLabel: "Both Speakers", canSpeak: true };
    }
    if (r.speaker === "A") {
      return {
        speakerLabel: `${userAUsername}'s turn`,
        canSpeak: isUserA,
      };
    }
    // speaker === "B"
    return {
      speakerLabel: `${userBUsername}'s turn`,
      canSpeak: !isUserA,
    };
  }, [isUserA, userAUsername, userBUsername]);

  const { speakerLabel, canSpeak } = round ? getSpeakerInfo(round) : { speakerLabel: "", canSpeak: true };

  // Enforce mic muting based on whose turn it is
  useEffect(() => {
    if (!round || isComplete) return;

    if (!canSpeak && isMicOn) {
      // Need to mute — not their turn
      prevMuteStateRef.current = true; // remember they were on
      toggleMic();
    } else if (canSpeak && prevMuteStateRef.current === true) {
      // Their turn now and they were muted by the system — unmute
      if (!isMicOn) {
        toggleMic();
      }
      prevMuteStateRef.current = null;
    }
  }, [currentRound, round, canSpeak, isMicOn, toggleMic, isComplete]);

  // Main countdown timer
  useEffect(() => {
    if (isComplete || isGracePeriod) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up — start grace period
          clearInterval(timerRef.current!);
          setIsGracePeriod(true);
          setGraceTimeLeft(5);
          setShowAlert(true);

          // Play alert sound
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
            setTimeout(() => {
              const osc2 = ctx.createOscillator();
              const gain2 = ctx.createGain();
              osc2.connect(gain2);
              gain2.connect(ctx.destination);
              osc2.frequency.value = 880;
              gain2.gain.value = 0.3;
              osc2.start();
              osc2.stop(ctx.currentTime + 0.3);
            }, 400);
          } catch {
            // Audio not available — ignore
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentRound, isComplete, isGracePeriod]);

  // Grace period countdown (5 seconds)
  useEffect(() => {
    if (!isGracePeriod) return;

    graceTimerRef.current = setInterval(() => {
      setGraceTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(graceTimerRef.current!);
          // Advance to next round
          advanceRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (graceTimerRef.current) clearInterval(graceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGracePeriod, currentRound]);

  const advanceRound = useCallback(() => {
    const nextRound = currentRound + 1;
    setIsGracePeriod(false);
    setShowAlert(false);
    prevMuteStateRef.current = null;

    if (nextRound >= totalRounds) {
      // All rounds complete
      setIsComplete(true);
      // Broadcast completion
      channelRef.current?.send({
        type: "broadcast",
        event: "round-change",
        payload: { round: nextRound, complete: true, from: currentUserId },
      });
      // End debate after short delay
      setTimeout(() => onDebateEnd(), 2000);
    } else {
      setCurrentRound(nextRound);
      setTimeLeft(rounds[nextRound].duration);
      // Broadcast round change
      channelRef.current?.send({
        type: "broadcast",
        event: "round-change",
        payload: { round: nextRound, complete: false, from: currentUserId },
      });
    }
  }, [currentRound, totalRounds, rounds, currentUserId, onDebateEnd]);

  // Supabase Realtime — sync round state between participants
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase.channel(`debate-rounds-${debateId}`);

    channel
      .on("broadcast", { event: "round-change" }, ({ payload }) => {
        if (payload.from === currentUserId) return; // ignore own broadcasts
        if (payload.complete) {
          setIsComplete(true);
          setIsGracePeriod(false);
          setShowAlert(false);
          setTimeout(() => onDebateEnd(), 2000);
        } else {
          setCurrentRound(payload.round);
          setTimeLeft(rounds[payload.round]?.duration || 0);
          setIsGracePeriod(false);
          setShowAlert(false);
          prevMuteStateRef.current = null;
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [debateId, currentUserId, rounds, onDebateEnd]);

  // Format time display
  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Calculate elapsed time across all rounds
  const elapsedRounds = rounds.slice(0, currentRound).reduce((sum, r) => sum + r.duration, 0);
  const totalDuration = rounds.reduce((sum, r) => sum + r.duration, 0);
  const currentElapsed = round ? round.duration - timeLeft : 0;
  const progressPercent = Math.min(100, ((elapsedRounds + currentElapsed) / totalDuration) * 100);

  if (isComplete) {
    return (
      <div className="round-manager">
        <div className="round-complete-banner" style={{ borderColor: formatColor }}>
          <span className="round-complete-icon">🏁</span>
          <div className="round-complete-text">
            <span className="round-complete-title">Debate Complete</span>
            <span className="round-complete-sub">All {totalRounds} rounds finished</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="round-manager">
      {/* Round progress bar */}
      <div className="round-progress-track">
        <div
          className="round-progress-fill"
          style={{ width: `${progressPercent}%`, background: formatColor }}
        />
        {/* Round markers */}
        {rounds.map((_, i) => {
          const pos = (rounds.slice(0, i).reduce((s, r) => s + r.duration, 0) / totalDuration) * 100;
          return i > 0 ? (
            <div
              key={i}
              className="round-progress-marker"
              style={{ left: `${pos}%` }}
            />
          ) : null;
        })}
      </div>

      {/* Round info banner */}
      <div
        className={`round-banner ${isGracePeriod ? "grace" : ""} ${showAlert ? "alert-flash" : ""}`}
        style={{ "--format-color": formatColor } as React.CSSProperties}
      >
        <div className="round-banner-left">
          <span className="round-number" style={{ background: `${formatColor}20`, color: formatColor }}>
            {currentRound + 1}/{totalRounds}
          </span>
          <div className="round-info">
            <span className="round-name">{round?.name}</span>
            <span className="round-desc">{round?.description}</span>
          </div>
        </div>

        <div className="round-banner-right">
          {/* Speaker indicator */}
          <div className={`speaker-indicator ${canSpeak ? "your-turn" : "their-turn"}`}>
            <span className="speaker-dot" style={{ background: canSpeak ? "#10b981" : "#ef4444" }} />
            <span className="speaker-label">{speakerLabel}</span>
            {!canSpeak && (
              <span className="muted-badge">🔇 Muted</span>
            )}
          </div>

          {/* Timer */}
          <div className={`round-timer ${timeLeft <= 10 ? "urgent" : ""} ${isGracePeriod ? "grace-timer" : ""}`}>
            {isGracePeriod ? (
              <span className="grace-countdown">Next in {graceTimeLeft}s</span>
            ) : (
              <span className="timer-digits">{formatTime(timeLeft)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Grace period overlay alert */}
      {isGracePeriod && (
        <div className="round-grace-alert">
          <span className="grace-bell">🔔</span>
          <span>Time&apos;s up! Moving to {currentRound + 1 < totalRounds ? `"${rounds[currentRound + 1]?.name}"` : "end"} in {graceTimeLeft}s</span>
        </div>
      )}
    </div>
  );
}
