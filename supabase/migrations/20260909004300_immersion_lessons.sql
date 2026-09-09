-- Immersion catalog: engVid lessons enriched with Gemini (vocab, phrases, quiz).
-- Shared system content — same rows for every learner, no per-user ownership.
-- Previously lived as a generated TypeScript file (lib/immersion/engvid-catalog.ts);
-- moved here so it can grow past a hand-maintained module and be queried by
-- level/topic for the daily plan instead of filtered client-side after a full load.

create table if not exists public.immersion_lessons (
  id text primary key,
  slug text not null unique,
  youtube_video_id text not null unique,
  title text not null,
  teacher text not null,
  teacher_channel_url text not null,
  level text not null check (level in ('A2', 'B1', 'C1')),
  topic text not null check (
    topic in ('speaking', 'pronunciation', 'connected-speech', 'conversation', 'intonation', 'vocabulary')
  ),
  duration_minutes integer not null check (duration_minutes > 0),
  summary text not null,
  timestamps jsonb not null default '[]'::jsonb,
  key_vocabulary jsonb not null default '[]'::jsonb,
  target_phrases jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists immersion_lessons_level_topic_idx
  on public.immersion_lessons (level, topic);

alter table public.immersion_lessons enable row level security;

-- Any authenticated learner can read the whole catalog. Writes only happen
-- from scripts/sync-engvid-lessons.ts using the service_role key, never from
-- the client — there is intentionally no insert/update/delete policy here.
drop policy if exists "immersion_lessons_select_authenticated" on public.immersion_lessons;
create policy "immersion_lessons_select_authenticated"
  on public.immersion_lessons for select
  to authenticated
  using (true);
