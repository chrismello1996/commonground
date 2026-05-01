"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ShareClip from "@/components/clips/ShareClip";

interface Clip {
  id: string;
  debate_id: string;
  creator_id: string;
  creator_username: string;
  video_url: string;
  duration: number;
  debate_topic: string;
  category: string;
  user_a_username: string;
  user_b_username: string;
  score: number;
  user_vote: number | null; // 1, -1, or null
  created_at: string;
}

interface ClipsFeedProps {
  currentUserId: string | null;
}

export default function ClipsFeed({ currentUserId }: ClipsFeedProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"new" | "top">("new");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeClip, setActiveClip] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const fetchClips = useCallback(async (cursor?: string) => {
    const isInitial = !cursor;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ sort, limit: "10" });
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/clips?${params}`);
      const data = await res.json();

      if (isInitial) {
        setClips(data.clips || []);
      } else {
        setClips((prev) => [...prev, ...(data.clips || [])]);
      }
      setNextCursor(data.nextCursor);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sort]);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  // Infinite scroll
  const lastClipRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          fetchClips(nextCursor);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loadingMore, nextCursor, fetchClips]
  );

  // Auto-play clip when scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const clipId = entry.target.getAttribute("data-clip-id");
          if (entry.isIntersecting && clipId) {
            setActiveClip(clipId);
            const video = entry.target.querySelector("video") as HTMLVideoElement;
            if (video) {
              video.play().catch(() => {});
            }
          } else {
            const video = entry.target.querySelector("video") as HTMLVideoElement;
            if (video) {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    const cards = feedRef.current?.querySelectorAll("[data-clip-id]");
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [clips]);

  const handleVote = async (clipId: string, vote: number) => {
    if (!currentUserId) return;

    // Optimistic update
    setClips((prev) =>
      prev.map((c) => {
        if (c.id !== clipId) return c;
        let scoreDelta = 0;
        let newUserVote: number | null = vote;

        if (c.user_vote === vote) {
          // Toggle off
          scoreDelta = -vote;
          newUserVote = null;
        } else if (c.user_vote) {
          // Switch
          scoreDelta = vote * 2;
        } else {
          // New
          scoreDelta = vote;
        }

        return { ...c, score: c.score + scoreDelta, user_vote: newUserVote };
      })
    );

    try {
      await fetch(`/api/clips/${clipId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
    } catch {
      // Revert on error — refetch
      fetchClips();
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (secs < 60) return "just now";
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400">Loading clips...</p>
        </div>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">No clips yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Be the first to clip a debate moment!
          </p>
          <Link
            href="/browse"
            className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition"
          >
            Watch Debates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Clips</h2>
        <div className="flex gap-1">
          {(["new", "top"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1 rounded text-[11px] font-semibold border transition ${
                sort === s
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:border-emerald-500"
              }`}
            >
              {s === "new" ? "Newest" : "Top"}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {clips.map((clip, i) => (
          <div
            key={clip.id}
            ref={i === clips.length - 1 ? lastClipRef : undefined}
            data-clip-id={clip.id}
            className="snap-start w-full flex items-center justify-center p-4"
            style={{
              minHeight: "calc(100vh - 130px)",
              scrollSnapAlign: "start",
            }}
          >
            <div
              className="relative bg-black rounded-2xl overflow-hidden shadow-xl"
              style={{
                width: "100%",
                maxWidth: 720,
                aspectRatio: "16/9",
              }}
            >
              {/* Video */}
              <video
                src={clip.video_url}
                className="w-full h-full object-contain bg-black"
                loop
                playsInline
                muted={activeClip !== clip.id}
                preload="metadata"
                onClick={(e) => {
                  const v = e.currentTarget;
                  if (v.paused) v.play().catch(() => {});
                  else v.pause();
                }}
              />

              {/* Duration badge */}
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                {formatDuration(clip.duration)}
              </div>

              {/* Info overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-14 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm font-bold leading-tight mb-1">
                  {clip.debate_topic || "Untitled debate"}
                </p>
                <p className="text-white/70 text-xs">
                  {clip.user_a_username} vs {clip.user_b_username}
                </p>
                <p className="text-white/50 text-[10px] mt-1">
                  Clipped by{" "}
                  <Link href={`/profile/${clip.creator_username}`} className="text-emerald-400 hover:underline">
                    {clip.creator_username}
                  </Link>{" "}
                  · {formatTimeAgo(clip.created_at)}
                </p>
              </div>

              {/* Side action buttons (TikTok style) */}
              <div className="absolute right-2 bottom-16 flex flex-col items-center gap-4">
                {/* Upvote */}
                <button
                  onClick={() => handleVote(clip.id, 1)}
                  disabled={!currentUserId}
                  className="flex flex-col items-center gap-0.5 group"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      clip.user_vote === 1
                        ? "bg-emerald-500 text-white"
                        : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </div>
                </button>

                {/* Score */}
                <span className={`text-xs font-bold ${clip.score >= 0 ? "text-white" : "text-red-400"}`}>
                  {clip.score}
                </span>

                {/* Downvote */}
                <button
                  onClick={() => handleVote(clip.id, -1)}
                  disabled={!currentUserId}
                  className="flex flex-col items-center gap-0.5 group"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      clip.user_vote === -1
                        ? "bg-red-500 text-white"
                        : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Share */}
                <ShareClip
                  clipId={clip.id}
                  clipUrl={clip.video_url}
                  debateTopic={clip.debate_topic}
                  variant="sidebar"
                />

                {/* Watch full debate */}
                <Link
                  href={`/browse/watch/${clip.debate_id}`}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <span className="text-[9px] text-white/60">Watch</span>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {loadingMore && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
