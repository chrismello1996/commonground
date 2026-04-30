"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ClipRecorderProps {
  debateId: string;
  /** CSS selector or ref to the .video-grid container that holds both video panels */
  videoGridRef: React.RefObject<HTMLDivElement | null>;
  maxDuration?: number; // max clip length in seconds (default 30)
}

export default function ClipRecorder({
  debateId,
  videoGridRef,
  maxDuration = 30,
}: ClipRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [clipSaved, setClipSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const grid = videoGridRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Find all video elements in the grid
    const videos = grid.querySelectorAll("video");
    const w = canvas.width;
    const h = canvas.height;

    // Black background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, w, h);

    if (videos.length >= 2) {
      // Side by side
      const halfW = Math.floor(w / 2) - 2;
      try { ctx.drawImage(videos[0], 0, 0, halfW, h); } catch {}
      try { ctx.drawImage(videos[1], halfW + 4, 0, halfW, h); } catch {}
      // Divider line
      ctx.fillStyle = "#333";
      ctx.fillRect(halfW, 0, 4, h);
    } else if (videos.length === 1) {
      try { ctx.drawImage(videos[0], 0, 0, w, h); } catch {}
    } else {
      // No videos — draw placeholder
      ctx.fillStyle = "#666";
      ctx.font = "24px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Recording...", w / 2, h / 2);
    }

    // "REC" indicator
    ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
    ctx.beginPath();
    ctx.arc(24, 24, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("REC", 36, 28);

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [videoGridRef]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const uploadClip = useCallback(async (blob: Blob) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("video", blob, "clip.webm");
      formData.append("debate_id", debateId);
      formData.append("duration", String(recordingTime || Math.round(blob.size / 250_000))); // rough estimate if timer is 0

      const res = await fetch("/api/clips", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setClipSaved(true);
      setTimeout(() => setClipSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save clip");
    } finally {
      setIsUploading(false);
      setRecordingTime(0);
    }
  }, [debateId, recordingTime]);

  const startRecording = useCallback(() => {
    setError(null);
    setClipSaved(false);
    const grid = videoGridRef.current;
    if (!grid) {
      setError("Video grid not found");
      return;
    }

    // Create offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 360;
    canvasRef.current = canvas;

    // Start drawing frames
    animFrameRef.current = requestAnimationFrame(drawFrame);

    // Capture canvas stream
    const stream = canvas.captureStream(30); // 30fps
    streamRef.current = stream;

    // Also try to capture audio from video elements
    const videos = grid.querySelectorAll("video");
    videos.forEach((video) => {
      try {
        const mediaEl = video as HTMLVideoElement;
        if (mediaEl.srcObject && mediaEl.srcObject instanceof MediaStream) {
          const audioTracks = mediaEl.srcObject.getAudioTracks();
          audioTracks.forEach((track) => {
            stream.addTrack(track.clone());
          });
        }
      } catch {
        // Audio capture not available
      }
    });

    // Setup MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2_000_000,
    });

    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const blob = new Blob(chunksRef.current, { type: mimeType });
      uploadClip(blob);
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime((t) => {
        if (t + 1 >= maxDuration) {
          stopRecording();
          return maxDuration;
        }
        return t + 1;
      });
    }, 1000);
  }, [drawFrame, maxDuration, videoGridRef, stopRecording, uploadClip]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <>
      {/* Clip button */}
      <button
        className={`ctrl-btn ${isRecording ? "danger" : ""}`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isUploading}
        title={isRecording ? "Stop clip" : "Clip this moment"}
        style={
          isRecording
            ? {}
            : {
                width: "auto",
                borderRadius: 8,
                padding: "0 14px",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "inherit",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }
        }
      >
        {isUploading ? (
          <span style={{ fontSize: 11, fontWeight: 600 }}>Saving...</span>
        ) : isRecording ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
            <span>Clip</span>
          </>
        )}
      </button>

      {/* Recording indicator overlay */}
      {isRecording && (
        <div
          style={{
            position: "fixed",
            top: 60,
            right: 16,
            background: "rgba(239, 68, 68, 0.95)",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6,
            zIndex: 100,
            animation: "pulse-dot 1.5s infinite",
            boxShadow: "0 2px 12px rgba(239, 68, 68, 0.4)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#fff",
              animation: "pulse-dot 0.8s infinite",
            }}
          />
          Recording clip — {formatTime(recordingTime)}
        </div>
      )}

      {/* Success toast */}
      {clipSaved && (
        <div
          style={{
            position: "fixed",
            top: 60,
            right: 16,
            background: "rgba(16, 185, 129, 0.95)",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            zIndex: 100,
            boxShadow: "0 2px 12px rgba(16, 185, 129, 0.4)",
          }}
        >
          Clip saved!
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div
          style={{
            position: "fixed",
            top: 60,
            right: 16,
            background: "rgba(239, 68, 68, 0.95)",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            zIndex: 100,
            cursor: "pointer",
          }}
          onClick={() => setError(null)}
        >
          {error}
        </div>
      )}
    </>
  );
}
