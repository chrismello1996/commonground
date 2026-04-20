-- ============================================
-- CommonGround: ELO Rating System + Anti-Cheat
-- Executed on 2026-04-20
-- ============================================

-- 1. Add wins/losses columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS wins int DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS losses int DEFAULT 0;

-- 2. Add debate result tracking to debates
ALTER TABLE debates ADD COLUMN IF NOT EXISTS winner_id uuid DEFAULT NULL;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS elo_processed boolean DEFAULT false;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS votes_a int DEFAULT 0;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS votes_b int DEFAULT 0;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS min_duration_met boolean DEFAULT false;

-- 3. Anti-cheat: track last opponent to prevent win-trading
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_opponent_id uuid DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_opponent_at timestamptz DEFAULT NULL;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_debates_users ON debates(user_a, user_b);
CREATE INDEX IF NOT EXISTS idx_debates_winner ON debates(winner_id);

-- 5. Generic increment function for atomic field updates
CREATE OR REPLACE FUNCTION increment_field(row_id uuid, field_name text, increment_by int)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE users SET %I = COALESCE(%I, 0) + $1 WHERE id = $2', field_name, field_name)
  USING increment_by, row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Anti-Cheat Protections Summary:
-- ============================================
-- 1. MIN DURATION: Debates < 60s don't affect ELO
-- 2. MIN VOTES: Need 2+ spectator votes for ELO to change
-- 3. SAME OPPONENT COOLDOWN: No ELO gain from same opponent within 30 min
-- 4. NO SELF-VOTING: Debaters can't vote in their own debate
-- 5. NO SELF-VOTE: Users can't vote for themselves
-- 6. ONE VOTE PER DEBATE: Unique constraint on (debate_id, voter_id)
-- 7. TIED VOTES: No ELO change on ties
-- 8. ELO FLOOR: Nobody drops below 100 ELO
