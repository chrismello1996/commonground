-- Phase 6: Messages table (run in Supabase SQL Editor if not already created)

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  debate_id uuid REFERENCES public.debates(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'chat' CHECK (type IN ('chat', 'system', 'emote')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages from debates they're part of
CREATE POLICY IF NOT EXISTS "Users can read debate messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.debates
      WHERE debates.id = messages.debate_id
      AND (debates.user_a = auth.uid() OR debates.user_b = auth.uid())
    )
  );

-- Policy: Users can insert messages into debates they're part of
CREATE POLICY IF NOT EXISTS "Users can send messages in their debates"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.debates
      WHERE debates.id = messages.debate_id
      AND (debates.user_a = auth.uid() OR debates.user_b = auth.uid())
      AND debates.status = 'active'
    )
  );

-- Performance index
CREATE INDEX IF NOT EXISTS idx_messages_debate_id ON public.messages(debate_id, created_at);

-- Enable Realtime on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
