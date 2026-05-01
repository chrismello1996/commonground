"use client";

import { useState, useRef, useEffect } from "react";

interface ShareClipProps {
  clipId: string;
  clipUrl: string; // video_url for download
  debateTopic?: string;
  /** Render style: "sidebar" for TikTok-style side buttons, "bar" for horizontal row */
  variant?: "sidebar" | "bar";
}

export default function ShareClip({
  clipId,
  clipUrl,
  debateTopic,
  variant = "sidebar",
}: ShareClipProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/clip/${clipId}`
    : `/clip/${clipId}`;

  const shareText = debateTopic
    ? `Check out this debate clip: "${debateTopic}" on CommonGround`
    : "Check out this debate clip on CommonGround";

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl });
        setShowMenu(false);
        return true;
      } catch {
        // User cancelled or not supported
      }
    }
    return false;
  };

  const handleShare = async () => {
    // Try native share first (mobile)
    const didNative = await handleNativeShare();
    if (!didNative) {
      setShowMenu(true);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setShowMenu(false), 1000);
    } catch {
      // fallback
    }
  };

  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "width=600,height=500,noopener,noreferrer");
    setShowMenu(false);
  };

  const shareToTwitter = () => {
    openShareWindow(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    );
  };

  const shareToReddit = () => {
    openShareWindow(
      `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
    );
  };

  // For TikTok/YouTube/Instagram — these platforms don't have direct URL share APIs,
  // so we download the clip and the user uploads it themselves
  // Download clip with CommonGround watermark burned in via canvas
  const downloadWithWatermark = async (platform?: string) => {
    setDownloading(true);
    try {
      // Create a hidden video element to load the clip
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = clipUrl;
      video.muted = true;
      video.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror = () => reject(new Error("Failed to load video"));
        video.load();
      });

      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 360;

      // Create canvas for watermarked frames
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Capture watermarked stream from canvas
      const stream = canvas.captureStream(30);

      // Try to get audio from original video
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      } catch {
        // No audio available
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2_500_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordingDone = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType }));
        };
      });

      recorder.start(100);

      // Draw frames with watermark
      const drawWatermarkedFrame = () => {
        ctx.drawImage(video, 0, 0, w, h);

        // Watermark — semi-transparent box in bottom-right
        const text = "commongrounddebate.com";
        ctx.font = `bold ${Math.round(h * 0.035)}px Inter, system-ui, sans-serif`;
        const textWidth = ctx.measureText(text).width;
        const padding = 8;
        const boxW = textWidth + padding * 2;
        const boxH = Math.round(h * 0.055);
        const boxX = w - boxW - 12;
        const boxY = h - boxH - 12;

        // Background pill
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 4);
        ctx.fill();

        // Text
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillText(text, boxX + padding, boxY + boxH / 2);

        if (!video.ended && !video.paused) {
          requestAnimationFrame(drawWatermarkedFrame);
        }
      };

      video.play();
      drawWatermarkedFrame();

      // Wait for video to end
      await new Promise<void>((resolve) => {
        video.onended = () => {
          // Give recorder a moment to flush
          setTimeout(() => {
            recorder.stop();
            resolve();
          }, 200);
        };
      });

      const blob = await recordingDone;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `commonground-clip-${clipId.slice(0, 8)}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      video.remove();
      setShowMenu(false);

      if (platform) {
        alert(
          `Clip downloaded! Open ${platform} and upload the video from your downloads.`
        );
      }
    } catch {
      // Fallback to direct download without watermark
      try {
        const res = await fetch(`/api/clips/${clipId}/download`);
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `commonground-clip-${clipId.slice(0, 8)}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowMenu(false);
        if (platform) {
          alert(`Clip downloaded! Open ${platform} and upload the video from your downloads.`);
        }
      } catch {
        alert("Failed to download clip. Please try again.");
      }
    } finally {
      setDownloading(false);
    }
  };

  const shareButtons = [
    {
      name: "Copy Link",
      icon: copied ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
      ),
      color: "#6b7280",
      action: copyLink,
    },
    {
      name: "Twitter / X",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
      ),
      color: "#000",
      action: shareToTwitter,
    },
    {
      name: "Reddit",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 13.69c.11.25.17.53.17.81 0 2.35-2.74 4.26-6.12 4.26S4.94 16.85 4.94 14.5c0-.29.06-.57.18-.83-.39-.2-.65-.6-.65-1.07 0-.66.54-1.2 1.2-1.2.33 0 .62.13.83.34 1.15-.83 2.72-1.37 4.48-1.42l.84-3.94.01-.01c.04-.14.14-.25.27-.31.14-.06.29-.06.43-.01l2.78.63c.18-.37.56-.62.99-.62.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1l-2.49-.56-.75 3.54c1.73.07 3.26.61 4.38 1.43.22-.22.52-.35.85-.35.66 0 1.2.54 1.2 1.2 0 .47-.27.88-.67 1.08zM9.3 13.5c0 .61.49 1.1 1.1 1.1s1.1-.49 1.1-1.1-.49-1.1-1.1-1.1-1.1.49-1.1 1.1zm5.4 2.73c-.49.49-1.43.73-2.7.73s-2.21-.24-2.7-.73a.34.34 0 0 1 0-.48.34.34 0 0 1 .48 0c.36.36 1.12.53 2.22.53s1.87-.17 2.22-.53a.34.34 0 0 1 .48 0 .34.34 0 0 1 0 .48zm-.18-1.63c-.61 0-1.1-.49-1.1-1.1s.49-1.1 1.1-1.1 1.1.49 1.1 1.1-.49 1.1-1.1 1.1z" /></svg>
      ),
      color: "#FF4500",
      action: shareToReddit,
    },
    {
      name: "TikTok",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.25 8.25 0 0 0 4.84 1.56V6.8a4.87 4.87 0 0 1-1.08-.11z" /></svg>
      ),
      color: "#000",
      action: () => downloadWithWatermark("TikTok"),
    },
    {
      name: "YouTube",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
      ),
      color: "#FF0000",
      action: () => downloadWithWatermark("YouTube"),
    },
    {
      name: "Instagram",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
      ),
      color: "#E4405F",
      action: () => downloadWithWatermark("Instagram"),
    },
  ];

  if (variant === "sidebar") {
    return (
      <div className="relative">
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-0.5"
        >
          <div className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <span className="text-[9px] text-white/60">Share</span>
        </button>

        {/* Share menu popup */}
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 w-48 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
              Share clip
            </p>
            {shareButtons.map((btn) => (
              <button
                key={btn.name}
                onClick={btn.action}
                disabled={downloading}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                <span style={{ color: btn.color }}>{btn.icon}</span>
                <span className="text-xs font-medium">{btn.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // "bar" variant — horizontal row of share buttons
  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-semibold text-gray-700"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share
      </button>

      {showMenu && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 w-48 z-50"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
            Share clip
          </p>
          {shareButtons.map((btn) => (
            <button
              key={btn.name}
              onClick={btn.action}
              disabled={downloading}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              <span style={{ color: btn.color }}>{btn.icon}</span>
              <span className="text-xs font-medium">{btn.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
