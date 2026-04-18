-- Reports & Suspension System for CommonGround
-- Executed on 2026-04-18

-- Add suspension columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until timestamptz DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason text DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS strike_count int DEFAULT 0;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES users(id) NOT NULL,
  reported_user_id uuid REFERENCES users(id) NOT NULL,
  debate_id uuid DEFAULT NULL,
  reason text DEFAULT 'nudity',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Unique constraint: one report per reporter per debate per reported user
CREATE UNIQUE INDEX IF NOT EXISTS unique_report_per_debate
  ON reports(reporter_id, reported_user_id, debate_id);

-- Index for looking up reports by reported user
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);

-- Enable RLS on reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can insert reports (but not report themselves)
CREATE POLICY "Users can submit reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id AND reporter_id != reported_user_id);

-- Users can view their own submitted reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Auto-suspend trigger function
-- 3 unique reporters = 24hr ban (strike 1)
-- 6 unique reporters = 7 day ban (strike 2)
-- 9 unique reporters = permanent ban (strike 3)
CREATE OR REPLACE FUNCTION check_and_suspend_user()
RETURNS TRIGGER AS $$
DECLARE
  unique_reporters int;
  current_strikes int;
BEGIN
  SELECT COUNT(DISTINCT reporter_id) INTO unique_reporters
  FROM reports
  WHERE reported_user_id = NEW.reported_user_id;

  SELECT strike_count INTO current_strikes
  FROM users
  WHERE id = NEW.reported_user_id;

  IF unique_reporters >= 3 AND current_strikes = 0 THEN
    UPDATE users SET
      suspended_until = now() + interval '24 hours',
      suspension_reason = 'Reported by multiple users for nudity',
      strike_count = 1
    WHERE id = NEW.reported_user_id;
  ELSIF unique_reporters >= 6 AND current_strikes = 1 THEN
    UPDATE users SET
      suspended_until = now() + interval '7 days',
      suspension_reason = 'Repeated violations - 7 day suspension',
      strike_count = 2
    WHERE id = NEW.reported_user_id;
  ELSIF unique_reporters >= 9 AND current_strikes = 2 THEN
    UPDATE users SET
      suspended_until = '2099-12-31'::timestamptz,
      suspension_reason = 'Permanent ban - repeated violations',
      strike_count = 3
    WHERE id = NEW.reported_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_report_check_suspend ON reports;
CREATE TRIGGER on_report_check_suspend
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION check_and_suspend_user();
