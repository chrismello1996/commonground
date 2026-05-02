-- Add country column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS country text DEFAULT NULL;

-- Allow users to update their own country
CREATE POLICY "Users can update own country" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
