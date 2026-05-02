-- Add format column to debate_challenges table
ALTER TABLE debate_challenges ADD COLUMN IF NOT EXISTS format text DEFAULT 'unstructured';
