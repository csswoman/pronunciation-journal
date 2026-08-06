-- Essential Words skill model. One programmable item, one pedagogical
-- attempt, and zero or more SRS effects per attempt.

create table if not exists public.learning_items (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id text not null,
  skill text not null
    check (skill in ('meaning', 'listening', 'production', 'usage')),
  content_origin text not null
    check (content_origin in ('authored', 'generated', 'journal')),
  generator_provider text check (generator_provider in ('gemini')),
  payload jsonb,
  placement_inference jsonb,
  schedule jsonb not null,
  schedule_kind text not null
    check (schedule_kind in ('none', 'provisional', 'fsrs')),
  due_at timestamptz,
  last_review timestamptz,
  repetitions integer not null default 0,
  lapses integer not null default 0,
  suspended boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint learning_items_inference_base_only
    check (placement_inference is null or skill <> 'usage'),
  constraint learning_items_payload_usage_only
    check (payload is null or skill = 'usage'),
  constraint learning_items_due_matches_schedule
    check (
      (schedule_kind = 'none' and due_at is null)
      or (schedule_kind <> 'none' and due_at is not null)
    )
);

create index if not exists learning_items_user_due_idx
  on public.learning_items (user_id, due_at)
  where schedule_kind <> 'none';

create index if not exists learning_items_user_word_idx
  on public.learning_items (user_id, word_id);

create table if not exists public.attempt_logs (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  word_id text not null,
  assessment jsonb not null,
  observations jsonb not null default '[]'::jsonb,
  event_type text not null check (
    event_type in ('practice', 'verification', 'scheduled-review', 'learning-step')
  ),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists attempt_logs_user_session_idx
  on public.attempt_logs (user_id, session_id, occurred_at);

create index if not exists attempt_logs_user_word_idx
  on public.attempt_logs (user_id, word_id, occurred_at desc);

create table if not exists public.srs_review_events (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_log_id text not null,
  learning_item_id text not null,
  grade text not null check (grade in ('Again', 'Hard', 'Good', 'Easy')),
  assessment jsonb not null,
  prior_schedule jsonb not null,
  resulting_schedule jsonb not null,
  fsrs_audit jsonb not null,
  affects_schedule boolean not null default true
    check (affects_schedule = true),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint srs_review_events_attempt_fk
    foreign key (user_id, attempt_log_id)
    references public.attempt_logs (user_id, id)
    on delete restrict,
  constraint srs_review_events_item_fk
    foreign key (user_id, learning_item_id)
    references public.learning_items (user_id, id)
    on delete restrict
);

create index if not exists srs_review_events_user_item_idx
  on public.srs_review_events (user_id, learning_item_id, occurred_at);

create index if not exists srs_review_events_user_attempt_idx
  on public.srs_review_events (user_id, attempt_log_id);

alter table public.learning_items enable row level security;
alter table public.attempt_logs enable row level security;
alter table public.srs_review_events enable row level security;

grant select, insert, update, delete on public.learning_items to authenticated;
grant select, insert on public.attempt_logs to authenticated;
grant select, insert on public.srs_review_events to authenticated;

create policy "learning_items_select_own"
  on public.learning_items for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "learning_items_insert_own"
  on public.learning_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "learning_items_update_own"
  on public.learning_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "learning_items_delete_own"
  on public.learning_items for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "attempt_logs_select_own"
  on public.attempt_logs for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "attempt_logs_insert_own"
  on public.attempt_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "srs_review_events_select_own"
  on public.srs_review_events for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "srs_review_events_insert_own"
  on public.srs_review_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
