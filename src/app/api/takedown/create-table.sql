-- Take It Down Act Compliance: Takedown Request Tracking
-- Tracks requests for removal of nonconsensual intimate images
-- Must be acted on within 48 hours per federal law

CREATE TABLE IF NOT EXISTS takedown_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Reporter info
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email TEXT NOT NULL,
  reporter_name TEXT,

  -- Subject of the request
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_username TEXT,
  debate_id UUID REFERENCES debates(id) ON DELETE SET NULL,
  clip_id UUID,

  -- Request details
  content_type TEXT NOT NULL CHECK (content_type IN ('intimate_image', 'deepfake', 'nonconsensual_recording', 'other')),
  description TEXT NOT NULL,
  content_url TEXT,

  -- Compliance tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'removed', 'denied', 'duplicate')),
  deadline_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for compliance monitoring
CREATE INDEX idx_takedown_status ON takedown_requests(status);
CREATE INDEX idx_takedown_deadline ON takedown_requests(deadline_at) WHERE status IN ('pending', 'under_review');
CREATE INDEX idx_takedown_reporter ON takedown_requests(reporter_id);
CREATE INDEX idx_takedown_reported ON takedown_requests(reported_user_id);

-- Enable RLS
ALTER TABLE takedown_requests ENABLE ROW LEVEL SECURITY;

-- Users can submit takedown requests
CREATE POLICY "Users can submit takedown requests" ON takedown_requests
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own requests
CREATE POLICY "Users can view own takedown requests" ON takedown_requests
  FOR SELECT USING (auth.uid() = reporter_id);

-- Service role can manage all requests (for admin API)
CREATE POLICY "Service role full access" ON takedown_requests
  FOR ALL USING (auth.role() = 'service_role');
