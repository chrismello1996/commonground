-- ===== CLIPS TABLE =====
create table if not exists public.clips (
  id uuid default gen_random_uuid() primary key,
  debate_id uuid references public.debates(id) on delete cascade not null,
  creator_id uuid references auth.users(id) on delete cascade not null,
  video_url text not null,
  thumbnail_url text,
  duration integer not null default 0, -- seconds
  debate_topic text,
  category text,
  user_a_id uuid,
  user_a_username text,
  user_b_id uuid,
  user_b_username text,
  score integer not null default 0, -- net upvotes - downvotes
  created_at timestamptz default now() not null
);

-- Index for feed queries (newest first, highest score)
create index if not exists clips_created_at_idx on public.clips(created_at desc);
create index if not exists clips_score_idx on public.clips(score desc);
create index if not exists clips_debate_id_idx on public.clips(debate_id);
create index if not exists clips_creator_id_idx on public.clips(creator_id);

-- RLS
alter table public.clips enable row level security;

create policy "Clips are viewable by everyone"
  on public.clips for select using (true);

create policy "Authenticated users can create clips"
  on public.clips for insert with check (auth.uid() = creator_id);

create policy "Users can delete their own clips"
  on public.clips for delete using (auth.uid() = creator_id);

create policy "Score can be updated by anyone"
  on public.clips for update using (true);

-- ===== CLIP VOTES TABLE =====
create table if not exists public.clip_votes (
  id uuid default gen_random_uuid() primary key,
  clip_id uuid references public.clips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  vote smallint not null check (vote in (1, -1)), -- 1 = upvote, -1 = downvote
  created_at timestamptz default now() not null,
  unique(clip_id, user_id)
);

create index if not exists clip_votes_clip_id_idx on public.clip_votes(clip_id);

-- RLS
alter table public.clip_votes enable row level security;

create policy "Clip votes are viewable by everyone"
  on public.clip_votes for select using (true);

create policy "Authenticated users can vote"
  on public.clip_votes for insert with check (auth.uid() = user_id);

create policy "Users can change their own vote"
  on public.clip_votes for update using (auth.uid() = user_id);

create policy "Users can remove their own vote"
  on public.clip_votes for delete using (auth.uid() = user_id);

-- ===== STORAGE BUCKET =====
insert into storage.buckets (id, name, public)
values ('clips', 'clips', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload clips
create policy "Authenticated users can upload clips"
  on storage.objects for insert
  with check (bucket_id = 'clips' and auth.role() = 'authenticated');

-- Allow public read access to clips
create policy "Public read access to clips"
  on storage.objects for select
  using (bucket_id = 'clips');
