"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ShareClip from "@/components/clips/ShareClip";

interface ClipData {
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
  user_vote: number | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

interface ClipDetailProps {
  clipId: string;
  currentUserId: string | null;
}

export default function ClipDetail({ clipId, currentUserId }: ClipDetailProps) {
  const [clip, setClip] = useState<ClipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchClip = async () => {
      try {
        const res = await fetch(`/api/clips/${clipId}`);
        if (!res.ok) {
          setError("Clip not found");
          return;
        }
        const data = await res.json();
        setClip(data.clip);
      } catch {
        setError("Failed to load clip");
      } finally {
        setLoading(false);
      }
    };
    fetchClip();
  }, [clipId]);

  const handleVote = async (vote: number) => {
    if (!currentUserId || !clip) return;

    // Optimistic update
    let scoreDelta = 0;
    let newUserVote: number | null = vote;

    if (clip.user_vote === vote) {
      scoreDelta = -vote;
      newUserVote = null;
    } else if (clip.user_vote) {
      scoreDelta = vote * 2;
    } else {
      scoreDelta = vote;
    }

    setClip({
      ...clip,
      score: clip.score + scoreDelta,
      user_vote: newUserVote,
    });

    try {
      await fetch(`/api/clips/${clipId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
    } catch {
      // revert — refetch
      const res = await fetch(`/api/clips/${clipId}`);
      const data = await res.json();
      setClip(data.clip);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400">Loading clip...</p>
        </div>
      </div>
    );
  }

  if (error || !clip) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            {error || "Clip not found"}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            This clip may have been removed or doesn&apos;t exist.
          </p>
          <Link
            href="/clips"
            className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition"
          >
            Browse Clips
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="28" height="22" viewBox="0 0 36 28" fill="none">
              <rect x="0" y="2" width="20" height="16" rx="4" fill="#10b981" />
              <polygon points="6,18 10,18 8,22" fill="#10b981" />
              <rect x="14" y="6" width="20" height="16" rx="4" fill="#8B4513" />
              <polygon points="26,22 30,22 28,26" fill="#8B4513" />
            </svg>
            <span className="font-brand text-lg text-brand-gradient">
              CommonGround
            </span>
          </Link>
          <Link
            href="/clips"
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← All Clips
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Video Player */}
        <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl mb-6">
          <video
            ref={videoRef}
            src={clip.video_url}
            className="w-full"
            style={{ aspectRatio: "16/9", maxHeight: "70vh" }}
            controls
            autoPlay
            playsInline
          />
          <div className="absolute top-3 right-3 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
            {formatDuration(clip.duration)}
          </div>
        </div>

        {/* Info + Actions */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left — clip info */}
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-gray-900 mb-1">
              {clip.debate_topic || "Untitled debate"}
            </h1>
            <p className="text-sm text-gray-500 mb-3">
              {clip.user_a_username} vs {clip.user_b_username}
              {clip.category && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-[10px] font-semibold text-gray-500 uppercase">
                  {clip.category}
                </span>
              )}
            </p>
            <p className="text-xs text-gray-400">
              Clipped by{" "}
              <Link
                href={`/profile/${clip.creator_username}`}
                className="text-emerald-600 hover:underline font-medium"
              >
                {clip.creator_username}
              </Link>{" "}
              · {formatTimeAgo(clip.created_at)}
            </p>
          </div>

          {/* Right — actions */}
          <div className="flex items-start gap-3">
            {/* Vote buttons */}
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => handleVote(1)}
                disabled={!currentUserId}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${
                  clip.user_vote === 1
                    ? "bg-emerald-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                {clip.upvotes}
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <button
                onClick={() => handleVote(-1)}
                disabled={!currentUserId}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${
                  clip.user_vote === -1
                    ? "bg-red-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                {clip.downvotes}
              </button>
            </div>

            {/* Share */}
            <ShareClip
              clipId={clip.id}
              clipUrl={clip.video_url}
              debateTopic={clip.debate_topic}
              variant="bar"
            />

            {/* Watch full debate */}
            <Link
              href={`/browse/watch/${clip.debate_id}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Watch Debate
            </Link>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-10 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-extrabold text-gray-900 mb-1">
            Think you could do better?
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Jump into a live debate on CommonGround — argue your position and
            let the audience decide who wins.
          </p>
          <Link
            href="/matchmaking"
            className="inline-block px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition"
          >
            Find a Debate
          </Link>
        </div>
      </main>
    </div>
  );
}
