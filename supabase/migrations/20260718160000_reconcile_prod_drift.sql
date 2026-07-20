-- Reconcile the remaining bidirectional drift between the migration history and
-- the remote (production) project, found via `supabase db diff --linked` on
-- 2026-07-18. Everything here is idempotent so it is a no-op on whichever side
-- already holds the object, and safe to run on both a from-scratch build and prod.
--
-- Direction A — objects the migrations create but PRODUCTION was missing
-- (their earlier migrations are recorded as applied yet the objects are gone,
-- same drift class as user_sound_progress). These back real features:
--   * word_enrichment_jobs + claim_enrichment_jobs -> /api/words enqueue + the
--     drain-enrichment cron. Without the table, POST /api/words throws 500 when
--     adding any word (manual, reader, or journal suggested word via quickAddWord).
--   * sentence_transcription_cache -> L2 cache for /api/gemini/transcribe-sentence
--     (degrades gracefully, but should exist so caching works).
--
-- Direction B — objects PRODUCTION has but the migrations never created
-- (created out-of-band), so a from-scratch local build was missing them:
--   * entries.image_url / entries.phrases -> word-image + phrases features
--   * idx_answer_history_user_date / idx_word_bank_user -> query performance
--   * consume_rate_limit body -> aligned to the live version
--   * "Update own deck entries" policy -> lets users update their deck entries

-- ============================================================================
-- Direction A: restore the enrichment + sentence-cache objects
-- ============================================================================

create table if not exists public.word_enrichment_jobs (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.word_bank(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed')),
  attempts integer not null default 0,
  last_error text,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.word_enrichment_jobs enable row level security;

create index if not exists word_enrichment_jobs_queue_idx
  on public.word_enrichment_jobs (status, run_after, created_at)
  where status in ('queued', 'failed');

create index if not exists word_enrichment_jobs_word_idx
  on public.word_enrichment_jobs (word_id, created_at desc);

drop trigger if exists word_enrichment_jobs_updated_at on public.word_enrichment_jobs;
create trigger word_enrichment_jobs_updated_at
  before update on public.word_enrichment_jobs
  for each row execute function public.update_updated_at();

drop policy if exists "word_enrichment_jobs_select_own" on public.word_enrichment_jobs;
create policy "word_enrichment_jobs_select_own"
  on public.word_enrichment_jobs
  for select
  using (user_id = auth.uid());

drop policy if exists "word_enrichment_jobs_insert_own" on public.word_enrichment_jobs;
create policy "word_enrichment_jobs_insert_own"
  on public.word_enrichment_jobs
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create or replace function public.claim_enrichment_jobs(
  p_batch_size int default 3,
  p_worker_id  text default 'cron'
)
returns setof public.word_enrichment_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.word_enrichment_jobs
  set
    status     = 'running',
    locked_at  = now(),
    locked_by  = p_worker_id,
    updated_at = now()
  where id in (
    select id
    from   public.word_enrichment_jobs
    where  status in ('queued', 'failed')
      and  attempts < 5
      and  run_after <= now()
    order by created_at asc
    limit  p_batch_size
    for update skip locked
  )
  returning *;
end;
$$;

revoke execute on function public.claim_enrichment_jobs from public, anon, authenticated;
grant  execute on function public.claim_enrichment_jobs to service_role;

create table if not exists public.sentence_transcription_cache (
  user_id uuid not null,
  cache_key text not null,
  mime_type text not null,
  transcript text not null,
  payload_size integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sentence_transcription_cache_pkey primary key (user_id, cache_key)
);

create index if not exists sentence_transcription_cache_user_updated_at_idx
  on public.sentence_transcription_cache (user_id, updated_at desc);

drop trigger if exists sentence_transcription_cache_updated_at on public.sentence_transcription_cache;
create trigger sentence_transcription_cache_updated_at
  before update on public.sentence_transcription_cache
  for each row execute function public.update_updated_at();

alter table public.sentence_transcription_cache enable row level security;

revoke all on table public.sentence_transcription_cache from anon, authenticated;
grant select, insert, update, delete on table public.sentence_transcription_cache to authenticated;
grant select, insert, update, delete on table public.sentence_transcription_cache to service_role;

drop policy if exists "users can read own sentence transcription cache" on public.sentence_transcription_cache;
create policy "users can read own sentence transcription cache"
  on public.sentence_transcription_cache
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users can insert own sentence transcription cache" on public.sentence_transcription_cache;
create policy "users can insert own sentence transcription cache"
  on public.sentence_transcription_cache
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can update own sentence transcription cache" on public.sentence_transcription_cache;
create policy "users can update own sentence transcription cache"
  on public.sentence_transcription_cache
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can delete own sentence transcription cache" on public.sentence_transcription_cache;
create policy "users can delete own sentence transcription cache"
  on public.sentence_transcription_cache
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- Direction B: capture the out-of-band production objects into the history
-- ============================================================================

alter table public.entries add column if not exists image_url text;
alter table public.entries add column if not exists phrases text[];

create index if not exists idx_answer_history_user_date
  on public.answer_history using btree (user_id, answered_at desc)
  where (is_correct is not null);

create index if not exists idx_word_bank_user
  on public.word_bank using btree (user_id);

drop policy if exists "Update own deck entries" on public.deck_entries;
create policy "Update own deck entries"
  on public.deck_entries
  as permissive
  for update
  to authenticated
  using (exists (
    select 1 from public.decks
    where decks.id = deck_entries.deck_id and decks.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.decks
    where decks.id = deck_entries.deck_id and decks.user_id = auth.uid()
  ));

-- Align consume_rate_limit to the live production body. The body is copied
-- verbatim (keyword casing included) from the remote definition so `supabase
-- db diff` reports no residual difference for this function.
set check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.consume_rate_limit(p_key text, p_max integer, p_window_ms integer)
 RETURNS TABLE(allowed boolean, retry_after_seconds integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_window interval := make_interval(secs => p_window_ms / 1000.0);
  v_count integer;
  v_window_start timestamptz;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE insufficient_privilege USING MESSAGE = 'service role required';
  END IF;

  IF p_key IS NULL OR length(p_key) = 0 OR p_max < 1 OR p_window_ms < 1000 THEN
    RAISE EXCEPTION 'invalid rate limit arguments';
  END IF;

  INSERT INTO public.rate_limits AS rl (key, count, window_start, updated_at)
  VALUES (p_key, 1, v_now, v_now)
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      WHEN rl.window_start + v_window <= v_now THEN 1
      ELSE rl.count + 1
    END,
    window_start = CASE
      WHEN rl.window_start + v_window <= v_now THEN v_now
      ELSE rl.window_start
    END,
    updated_at = v_now
  RETURNING rl.count, rl.window_start
  INTO v_count, v_window_start;

  allowed := v_count <= p_max;
  retry_after_seconds := GREATEST(
    1,
    CEIL(EXTRACT(EPOCH FROM (v_window_start + v_window - v_now)))::integer
  );

  RETURN NEXT;
END;
$function$
;
