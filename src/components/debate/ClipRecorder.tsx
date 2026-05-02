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

  // Preview state — blob is held here after recording, before user decides
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState(0);

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
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke old preview URL when it changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const grid = videoGridRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const videos = grid.querySelectorAll("video");
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, w, h);

    if (videos.length >= 2) {
      const halfW = Math.floor(w / 2) - 2;
      try { ctx.drawImage(videos[0], 0, 0, halfW, h); } catch { /* video frame not ready */ }
      try { ctx.drawImage(videos[1], halfW + 4, 0, halfW, h); } catch { /* video frame not ready */ }
      ctx.fillStyle = "#333";
      ctx.fillRect(halfW, 0, 4, h);
    } else if (videos.length === 1) {
      try { ctx.drawImage(videos[0], 0, 0, w, h); } catch { /* video frame not ready */ }
    } else {
      ctx.fillStyle = "#666";
      ctx.font = "24px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Recording...", w / 2, h / 2);
    }

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

  // ---- User actions from preview ----

  const handlePost = useCallback(async () => {
    if (!previewBlob) return;
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("video", previewBlob, "clip.webm");
      formData.append("debate_id", debateId);
      formData.append("duration", String(previewDuration || Math.round(previewBlob.size / 250_000)));

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
      setPreviewBlob(null);
      setPreviewUrl(null);
      setPreviewDuration(0);
    }
  }, [debateId, previewBlob, previewDuration]);

  const handleSave = useCallback(() => {
    if (!previewBlob) return;
    const url = URL.createObjectURL(previewBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commonground-clip-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // Close preview after download
    setPreviewBlob(null);
    setPreviewUrl(null);
    setPreviewDuration(0);
  }, [previewBlob]);

  const handleDelete = useCallback(() => {
    setPreviewBlob(null);
    setPreviewUrl(null);
    setPreviewDuration(0);
  }, []);

  // ---- Recording logic ----

  const startRecording = useCallback(() => {
    setError(null);
    setClipSaved(false);
    setPreviewBlob(null);
    setPreviewUrl(null);
    const grid = videoGridRef.current;
    if (!grid) {
      setError("Video grid not found");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 360;
    canvasRef.current = canvas;

    animFrameRef.current = requestAnimationFrame(drawFrame);

    const stream = canvas.captureStream(30);
    streamRef.current = stream;

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
      // Instead of auto-uploading, show the preview
      setPreviewBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewDuration(recordingTime);
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
  }, [drawFrame, maxDuration, videoGridRef, stopRecording, recordingTime]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <>
      {/* Clip button */}
      <button
        className="ctrl-btn"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isUploading || !!previewBlob}
        title={isRecording ? "Stop clip" : "Clip this moment"}
        style={{
          width: "auto",
          borderRadius: 8,
          padding: "0 14px",
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "inherit",
          ...(isRecording
            ? {
                background: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.35)",
              }
            : {
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }),
        }}
      >
        {isUploading ? (
          <span style={{ fontSize: 11, fontWeight: 600 }}>Posting...</span>
        ) : isRecording ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
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

      {/* ===== CLIP PREVIEW OVERLAY ===== */}
      {previewBlob && previewUrl && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
          onClick={(e) => {
            // Close if clicking backdrop
            if (e.target === e.currentTarget) handleDelete();
          }}
        >
          <div
            style={{
              background: "#1a1a1a",
              borderRadius: 16,
              overflow: "hidden",
              maxWidth: 720,
              width: "90vw",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" fill="#ef4444" />
                </svg>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
                  Clip Preview
                </span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 500 }}>
                  {formatTime(previewDuration)}
                </span>
              </div>
              <button
                onClick={handleDelete}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
                title="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Video preview */}
            <div style={{ background: "#000", position: "relative" }}>
              <video
                src={previewUrl}
                controls
                autoPlay
                loop
                playsInline
                style={{
                  width: "100%",
                  display: "block",
                  maxHeight: "40vh",
                  objectFit: "contain",
                }}
              />
            </div>

            {/* Action buttons */}
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                gap: 10,
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Delete */}
              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "#ef4444",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete
              </button>

              {/* Save locally */}
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Save
              </button>

              {/* Post to feed */}
              <button
                onClick={handlePost}
                disabled={isUploading}
                style={{
                  flex: 1.5,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: isUploading
                    ? "rgba(16, 185, 129, 0.4)"
                    : "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: isUploading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                  boxShadow: isUploading ? "none" : "0 4px 16px rgba(16, 185, 129, 0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!isUploading) {
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(16, 185, 129, 0.5)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = isUploading ? "none" : "0 4px 16px rgba(16, 185, 129, 0.3)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                {isUploading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Posting...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Post to Feed
                  </>
                )}
              </button>
            </div>
          </div>
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
          Clip posted!
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

      {/* Spin keyframe for upload spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
