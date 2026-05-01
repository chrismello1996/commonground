-- Run this in Supabase SQL Editor to create the debate_challenges table

CREATE TABLE IF NOT EXISTS debate_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  debate_id UUID REFERENCES debates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '5 minutes'),
  responded_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX idx_challenges_challenged ON debate_challenges(challenged_id, status);
CREATE INDEX idx_challenges_challenger ON debate_challenges(challenger_id, status);
CREATE INDEX idx_challenges_expires ON debate_challenges(expires_at) WHERE status = 'pending';

-- RLS
ALTER TABLE debate_challenges ENABLE ROW LEVEL SECURITY;

-- Users can see challenges they sent or received
CREATE POLICY "Users can view own challenges"
  ON debate_challenges FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Users can insert challenges (as challenger)
CREATE POLICY "Users can send challenges"
  ON debate_challenges FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

-- Users can update challenges they received (accept/decline)
CREATE POLICY "Users can respond to challenges"
  ON debate_challenges FOR UPDATE
  USING (auth.uid() = challenged_id OR auth.uid() = challenger_id);
