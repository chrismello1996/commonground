export interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  elo: number;
  coins: number;
  created_at: string;
}

export interface UserStance {
  id: string;
  user_id: string;
  category: string;
  stance: string;
  created_at: string;
}

export interface Debate {
  id: string;
  user_a: string;
  user_b: string;
  category: string;
  topic: string;
  status: "waiting" | "active" | "completed" | "cancelled";
  format: string;
  created_at: string;
  ended_at: string | null;
}

export interface Message {
  id: string;
  debate_id: string;
  user_id: string;
  content: string;
  type: "chat" | "system" | "emote";
  created_at: string;
}
