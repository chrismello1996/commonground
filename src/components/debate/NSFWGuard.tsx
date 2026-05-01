"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useNSFWDetection } from "@/hooks/useNSFWDetection";

interface NSFWGuardProps {
  /** The debate ID for logging */
  debateId: string;
  /** Current user ID */
  userId: string;
  /** Whether the camera is on */
  isCamOn: boolean;
  /** Callback to disable the camera */
  toggleCam: () => void;
  /** Called when the user should be disconnected from the debate */
  onViolation: () => void;
  /** The local video element container — NSFWGuard will observe it for <video> tags */
  localVideoContainerRef: React.RefObject<HTMLDivElement | null>;
}

export default function NSFWGuard({
  debateId,
  // userId is available for future use (e.g., server-side logging)
  userId: _userId,
  isCamOn,
  toggleCam,
  onViolation,
  localVideoContainerRef,
}: NSFWGuardProps) {
  const [warningVisible, setWarningVisible] = useState(false);
  const [violationMessage, setViolationMessage] = useState("");
  const reportedRef = useRef(false);

  const handleNSFWDetected = useCallback(async () => {
    if (reportedRef.current) return;
    reportedRef.current = true;

    // 1. Immediately kill camera
    toggleCam();

    // 2. Show warning overlay
    setWarningVisible(true);

    // 3. Report to server
    try {
      const res = await fetch("/api/moderation/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debateId,
          violationType: "nsfw_content",
          detectionSource: "client_nsfwjs",
        }),
      });
      const data = await res.json();
      setViolationMessage(data.message || "NSFW content detected.");

      // 4. After brief delay, trigger disconnect
      setTimeout(() => {
        onViolation();
      }, 3000);
    } catch {
      setViolationMessage("NSFW content detected. You have been disconnected.");
      setTimeout(() => {
        onViolation();
      }, 3000);
    }
  }, [debateId, toggleCam, onViolation]);

  const { setVideoElement } = useNSFWDetection({
    enabled: isCamOn,
    intervalMs: 3000,
    threshold: 0.70,
    strikeCount: 2,
    onNSFWDetected: handleNSFWDetected,
  });

  // Observe the local video container for <video> elements
  // LiveKit renders the video element dynamically, so we use MutationObserver
  useEffect(() => {
    const container = localVideoContainerRef.current;
    if (!container) return;

    const findAndSetVideo = () => {
      const videoEl = container.querySelector("video");
      if (videoEl) {
        setVideoElement(videoEl);
      }
    };

    // Initial check
    findAndSetVideo();

    // Watch for video element being added/removed
    const observer = new MutationObserver(() => {
      findAndSetVideo();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      setVideoElement(null);
    };
  }, [localVideoContainerRef, setVideoElement]);

  if (!warningVisible) return null;

  // Violation overlay
  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4">
      <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">
          Content Violation Detected
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {violationMessage || "Nudity or sexually explicit content has been detected. Your camera has been disabled and you are being disconnected from this debate."}
        </p>
        <p className="text-xs text-gray-400">
          CommonGround has a zero-tolerance policy for NSFW content. Repeated violations will result in account suspension.
        </p>
        <div className="mt-6">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full animate-[shrink_3s_linear_forwards]" />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Disconnecting...</p>
        </div>
      </div>
    </div>
  );
}
