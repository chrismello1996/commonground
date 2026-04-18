-- ============================================
-- CommonGround: Votes System
-- Tracks spectator votes on debates and
-- accumulates total_votes_received per user
-- ============================================

-- 1. Create debate_votes table
CREATE TABLE IF NOT EXISTS debate_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  debate_id uuid NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voted_for uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  -- Each user can only vote once per debate
  UNIQUE(debate_id, voter_id)
);

-- 2. Add total_votes_received column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_votes_received int DEFAULT 0;

-- 3. RLS policies for debate_votes
ALTER TABLE debate_votes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read votes (for vote counts)
CREATE POLICY "Anyone can view votes"
  ON debate_votes FOR SELECT
  USING (true);

-- Authenticated users can insert their own vote
CREATE POLICY "Authenticated users can vote"
  ON debate_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

-- No updates or deletes allowed (votes are final)

-- 4. Function to increment total_votes_received on the voted-for user
CREATE OR REPLACE FUNCTION increment_total_votes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET total_votes_received = total_votes_received + 1
  WHERE id = NEW.voted_for;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger: auto-increment on new vote
DROP TRIGGER IF EXISTS on_vote_increment_total ON debate_votes;
CREATE TRIGGER on_vote_increment_total
  AFTER INSERT ON debate_votes
  FOR EACH ROW
  EXECUTE FUNCTION increment_total_votes();

-- 6. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_debate_votes_debate ON debate_votes(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_votes_voted_for ON debate_votes(voted_for);
