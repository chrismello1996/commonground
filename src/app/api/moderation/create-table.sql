-- Moderation Events: Track NSFW and content violations
-- Used for progressive suspension system

CREATE TABLE IF NOT EXISTS moderation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debate_id UUID REFERENCES debates(id) ON DELETE SET NULL,

  -- Violation details
  violation_type TEXT NOT NULL CHECK (violation_type IN ('nsfw_content', 'nudity', 'sexual_content', 'violence', 'other')),
  detection_source TEXT NOT NULL DEFAULT 'client_nsfwjs' CHECK (detection_source IN ('client_nsfwjs', 'manual_report', 'server_scan', 'admin')),
  confidence REAL,

  -- Action taken
  action_taken TEXT NOT NULL DEFAULT 'auto_disconnect' CHECK (action_taken IN ('auto_disconnect', 'warning', 'suspension', 'ban', 'none')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add suspension columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_moderation_user ON moderation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_debate ON moderation_events(debate_id);
CREATE INDEX IF NOT EXISTS idx_moderation_created ON moderation_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_suspended ON users(suspended_until) WHERE suspended_until IS NOT NULL;

-- Enable RLS
ALTER TABLE moderation_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own moderation events (auto-reported by client)
CREATE POLICY "Users can report own violations" ON moderation_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own moderation history
CREATE POLICY "Users can view own moderation events" ON moderation_events
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all events (for admin)
CREATE POLICY "Service role full access on moderation" ON moderation_events
  FOR ALL USING (auth.role() = 'service_role');
