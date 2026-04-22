"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const EMOTES = ["🔥", "💀", "🫡", "💯", "🤡", "👑", "⚡", "🧠"];

interface ChatMessage {
  id: string;
  debate_id: string;
  user_id: string;
  content: string;
  type: "chat" | "system" | "emote";
  created_at: string;
  username?: string;
}

interface DebateChatProps {
  debateId: string;
  currentUserId: string;
  currentUsername: string;
  userAId: string;
  userAUsername: string;
  userBUsername: string;
  isActive: boolean;
  userAColor?: string;
  userBColor?: string;
  userAElo?: number;
  userBElo?: number;
  onReaction?: (emoji: string) => void;
}

export default function DebateChat({
  debateId,
  currentUserId,
  currentUsername,
  userAId,
  userAUsername,
  userBUsername,
  isActive,
  userAColor = "#10b981",
  userBColor = "#8B4513",
  userAElo = 1200,
  userBElo = 1200,
  onReaction,
}: DebateChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  // Load existing messages and subscribe to new ones
  useEffect(() => {
    const supabase = supabaseRef.current;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("debate_id", debateId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data.map((m) => ({
          ...m,
          username: m.user_id === userAId ? userAUsername : userBUsername,
        })));
      }
    };

    loadMessages();

    const channelName = `debate-chat-${debateId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `debate_id=eq.${debateId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          newMsg.username = newMsg.user_id === userAId ? userAUsername : userBUsername;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debateId, userAId, userAUsername, userBUsername]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isSending || !isActive) return;
    setIsSending(true);
    const content = input.trim();
    setInput("");

    await supabaseRef.current.from("messages").insert({
      debate_id: debateId,
      user_id: currentUserId,
      content,
      type: "chat",
    });

    setIsSending(false);
  };

  const sendEmote = async (emoji: string) => {
    if (isSending || !isActive) return;
    setIsSending(true);

    await supabaseRef.current.from("messages").insert({
      debate_id: debateId,
      user_id: currentUserId,
      content: emoji,
      type: "emote",
    });

    if (onReaction) onReaction(emoji);
    setIsSending(false);
  };

  const getEloColor = (elo: number) => {
    if (elo >= 1800) return { bg: "rgba(139,69,19,.2)", color: "#f5a623" };
    if (elo >= 1500) return { bg: "rgba(192,192,192,.2)", color: "#c0c0c0" };
    return { bg: "rgba(205,127,50,.2)", color: "#cd7f32" };
  };

  return (
    <div className="chat-sidebar">
      <div className="chat-header">
        <h3>Stream Chat</h3>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="twitch-msg system-msg" style={{ textAlign: "center", marginTop: 12 }}>
            ⚡ Debate started — say something!
          </div>
        )}
        {messages.map((msg) => {
          const isUserAMsg = msg.user_id === userAId;
          const color = isUserAMsg ? userAColor : userBColor;
          const elo = isUserAMsg ? userAElo : userBElo;
          const eloStyle = getEloColor(elo);
          const username = msg.username || (msg.user_id === currentUserId ? currentUsername : "Opponent");

          if (msg.type === "system") {
            return (
              <div key={msg.id} className="twitch-msg system-msg">⚡ {msg.content}</div>
            );
          }

          if (msg.type === "emote") {
            return (
              <div key={msg.id} className="twitch-msg">
                <span className="elo-tag" style={{ background: eloStyle.bg, color: eloStyle.color }}>{elo}</span>
                <Link href={`/profile/${username}`} className="username" style={{ color }}>{username}</Link>
                <span style={{ color: "var(--txt2)" }}>: </span>
                <span style={{ fontSize: 18 }}>{msg.content}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className="twitch-msg">
              <span className="elo-tag" style={{ background: eloStyle.bg, color: eloStyle.color }}>{elo}</span>
              <Link href={`/profile/${username}`} className="username" style={{ color }}>{username}</Link>
              <span style={{ color: "var(--txt2)" }}>: </span>
              <span>{msg.content}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="emote-row">
          {EMOTES.map((e) => (
            <button key={e} className="emote-btn" onClick={() => sendEmote(e)} disabled={!isActive || isSending}>
              {e}
            </button>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder={isActive ? "Say anything..." : "Debate ended"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={!isActive}
            maxLength={500}
          />
          <button className="chat-send" onClick={sendMessage} disabled={!input.trim() || isSending || !isActive}>
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}
