create table if not exists public.assessment_oral_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  level text not null check (level in ('a1', 'a2')),
  answers jsonb not null,
  self_ratings jsonb not null default '{}'::jsonb,
  status text not null default 'oral_pending'
    check (status in ('oral_pending', 'oral_processing', 'oral_passed', 'completed', 'expired')),
  challenge_id uuid,
  item_id text,
  used_item_ids text[] not null default '{}',
  challenge_expires_at timestamptz,
  expires_at timestamptz not null,
  oral_audio_sha256 text check (oral_audio_sha256 is null or oral_audio_sha256 ~ '^[0-9a-f]{64}$'),
  rubric_version text check (rubric_version is null or rubric_version = 'a1-a2-pilot-v1'),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists assessment_oral_attempts_pending_idx
  on public.assessment_oral_attempts (user_id, level, created_at desc)
  where status = 'oral_pending';

create unique index if not exists assessment_oral_attempts_audio_replay_idx
  on public.assessment_oral_attempts (user_id, oral_audio_sha256)
  where oral_audio_sha256 is not null;

alter table public.assessment_oral_attempts enable row level security;

create policy "assessment_oral_attempts_select_own"
  on public.assessment_oral_attempts for select
  using (auth.uid() = user_id);
