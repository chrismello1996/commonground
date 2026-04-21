"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const EMOTES = [
  { emoji: "👏", label: "Clap" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "💯", label: "100" },
  { emoji: "😂", label: "Laugh" },
  { emoji: "🤔", label: "Think" },
  { emoji: "👎", label: "Disagree" },
  { emoji: "🎯", label: "Bullseye" },
  { emoji: "💀", label: "Dead" },
];

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
}

export default function DebateChat({
  debateId,
  currentUserId,
  currentUsername,
  userAId,
  userAUsername,
  userBUsername,
  isActive,
}: DebateChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load existing messages and subscribe to new ones
  useEffect(() => {
    // Fetch existing messages
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("debate_id", debateId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data.map(m => ({
          ...m,
          username: m.user_id === userAId ? userAUsername : userBUsername,
        })));
      }
    };

    loadMessages();

    // Subscribe to new messages via Supabase Realtime
    const channel = supabase
      .channel(`debate-chat-${debateId}`)
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !isActive) return;

    setIsSending(true);
    const content = input.trim();
    setInput("");

    await supabase.from("messages").insert({
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

    await supabase.from("messages").insert({
      debate_id: debateId,
      user_id: currentUserId,
      content: emoji,
      type: "emote",
    });

    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-white">Debate Chat</h3>
        <p className="text-[10px] text-gray-500">{messages.length} messages</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-600 text-xs text-center mt-4">No messages yet. Say something!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === currentUserId;
          const isSystem = msg.type === "system";

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded">
                  {msg.content}
                </span>
              </div>
            );
          }

          if (msg.type === "emote") {
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className={`text-[10px] mb-0.5 ${isMe ? "text-emerald-500" : "text-red-400"}`}>
                  {msg.username || (isMe ? currentUsername : "Opponent")}
                </span>
                <div className="text-3xl py-1 px-2">{msg.content}</div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className={`text-[10px] mb-0.5 ${isMe ? "text-emerald-500" : "text-red-400"}`}>
                {msg.username || (isMe ? currentUsername : "Opponent")}
              </span>
              <div className={`max-w-[85%] px-3 py-1.5 rounded-lg text-sm ${
                isMe
                  ? "bg-emerald-600/20 text-emerald-100 border border-emerald-500/20"
                  : "bg-gray-800 text-gray-200 border border-gray-700"
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Emote bar */}
      {isActive && (
        <div className="px-4 py-2 border-t border-gray-800 flex gap-1 flex-wrap justify-center">
          {EMOTES.map((emote) => (
            <button
              key={emote.emoji}
              onClick={() => sendEmote(emote.emoji)}
              disabled={isSending}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 flex items-center justify-center text-base transition-colors disabled:opacity-50"
              title={emote.label}
            >
              {emote.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isActive ? "Type a message..." : "Debate ended"}
            disabled={!isActive}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending || !isActive}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
