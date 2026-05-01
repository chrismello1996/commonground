"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// NSFWJS model loaded lazily
let nsfwModel: unknown = null;
let modelLoadPromise: Promise<unknown> | null = null;

// Dynamically import nsfwjs (only in browser)
async function loadModel() {
  if (nsfwModel) return nsfwModel;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    try {
      // Dynamic imports — only load in browser
      const [nsfwjs, tf] = await Promise.all([
        import("nsfwjs"),
        import("@tensorflow/tfjs"),
      ]);

      // Use the lighter MobileNetV2 model for faster inference
      // Set backend to webgl for GPU acceleration
      await tf.setBackend("webgl");
      await tf.ready();

      // Load MobileNetV2 model from the public CDN instead of the bundled
      // version. This avoids webpack trying to bundle the 30MB+ model shard
      // files (which contain dynamic require() calls that break the build).
      const model = await nsfwjs.load(
        "https://nsfwjs.com/quant_nsfw_mobilenet/",
        { size: 224, type: "graph" }
      );
      nsfwModel = model;
      return model;
    } catch {
      modelLoadPromise = null;
      return null;
    }
  })();

  return modelLoadPromise;
}

interface NSFWPrediction {
  className: string;
  probability: number;
}

interface UseNSFWDetectionOptions {
  /** Check interval in ms (default: 3000 — every 3 seconds) */
  intervalMs?: number;
  /** Probability threshold to flag as NSFW (default: 0.70) */
  threshold?: number;
  /** Number of consecutive flags before triggering (default: 2) */
  strikeCount?: number;
  /** Whether detection is enabled (default: true) */
  enabled?: boolean;
  /** Callback when NSFW content is confirmed */
  onNSFWDetected?: () => void;
}

interface UseNSFWDetectionReturn {
  /** Attach this ref to a <video> element or pass a video element */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Whether the model is loaded and scanning */
  isScanning: boolean;
  /** Whether NSFW has been detected and confirmed */
  isViolation: boolean;
  /** Number of current consecutive strikes */
  strikes: number;
  /** Set a video element directly (alternative to ref) */
  setVideoElement: (el: HTMLVideoElement | null) => void;
}

export function useNSFWDetection({
  intervalMs = 3000,
  threshold = 0.70,
  strikeCount = 2,
  enabled = true,
  onNSFWDetected,
}: UseNSFWDetectionOptions = {}): UseNSFWDetectionReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const strikesRef = useRef(0);
  const triggeredRef = useRef(false);
  const onNSFWDetectedRef = useRef(onNSFWDetected);

  const [isScanning, setIsScanning] = useState(false);
  const [isViolation, setIsViolation] = useState(false);
  const [strikes, setStrikes] = useState(0);

  // Keep callback ref current
  useEffect(() => {
    onNSFWDetectedRef.current = onNSFWDetected;
  }, [onNSFWDetected]);

  const setVideoElement = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
  }, []);

  // Get the active video element (from ref or direct set)
  const getVideoEl = useCallback(() => {
    return videoElRef.current || videoRef.current;
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let cancelled = false;

    // Create offscreen canvas for frame capture
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = 224;
      canvasRef.current.height = 224;
    }

    const startScanning = async () => {
      const model = await loadModel();
      if (cancelled || !model) return;

      setIsScanning(true);

      intervalRef.current = setInterval(async () => {
        if (cancelled || triggeredRef.current) return;

        const video = getVideoEl();
        if (!video || video.readyState < 2 || video.videoWidth === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        try {
          // Draw current video frame to canvas at 224x224
          ctx.drawImage(video, 0, 0, 224, 224);

          // Run NSFW classification
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const predictions: NSFWPrediction[] = await (model as any).classify(
            canvas,
            3 // Top 3 predictions
          );

          // Check for NSFW categories
          const nsfwClasses = ["Porn", "Hentai", "Sexy"];
          const nsfwScore = predictions
            .filter((p) => nsfwClasses.includes(p.className))
            .reduce((sum, p) => sum + p.probability, 0);

          if (nsfwScore >= threshold) {
            strikesRef.current += 1;
            setStrikes(strikesRef.current);

            if (strikesRef.current >= strikeCount && !triggeredRef.current) {
              triggeredRef.current = true;
              setIsViolation(true);
              onNSFWDetectedRef.current?.();

              // Stop scanning after confirmed violation
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          } else {
            // Reset strikes on clean frame (non-consecutive)
            if (strikesRef.current > 0) {
              strikesRef.current = Math.max(0, strikesRef.current - 1);
              setStrikes(strikesRef.current);
            }
          }
        } catch {
          // Frame capture or classification failed — skip this frame
        }
      }, intervalMs);
    };

    startScanning();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsScanning(false);
    };
  }, [enabled, intervalMs, threshold, strikeCount, getVideoEl]);

  return {
    videoRef,
    isScanning,
    isViolation,
    strikes,
    setVideoElement,
  };
}
