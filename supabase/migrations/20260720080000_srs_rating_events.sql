-- Immutable SRS rating-event ledger + transactional apply RPC (plan 061, step 2).
--
-- Problem: today the client reads the current word_bank/topic_srs row, computes
-- SM-2 client-side, then enqueues an ABSOLUTE update. Two overlapping ratings
-- (two tabs, a fast double-tap, or an offline retry) both read the same
-- pre-rating snapshot, so the second write silently clobbers the first (lost
-- update), and two first-time topic ratings both try to INSERT and collide on
-- topic_srs's UNIQUE (user_id, topic).
--
-- Fix: the client submits an IMMUTABLE RATING EVENT (grade + entity identity +
-- idempotency key) instead of a computed next-state. This RPC applies the
-- event to the materialized SRS row transactionally, computing SM-2
-- SERVER-SIDE under a row lock — concurrent events for the same entity are
-- serialized by Postgres's own locking (no lost update), and resubmitting the
-- same idempotency key is a no-op (safe outbox retry).
--
-- SM-2 algorithm here MUST match lib/srs/schedule.ts::scheduleNextReview
-- exactly (updateEaseOnLapse: false) and lib/srs/compute.ts::computeSM2's
-- status derivation. Do not tune constants here independently of that file.

-- ── Ledger table ────────────────────────────────────────────────────────────

create table if not exists public.srs_rating_events (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('word_bank', 'topic_srs')),
  -- word_bank: entity_id is the word_bank.id row being rated (must already exist).
  entity_id uuid,
  -- topic_srs: topic is the natural key; the row may not exist yet on first rating.
  topic text,
  grade integer not null check (grade >= 0 and grade <= 5),
  occurred_at timestamptz not null default now(),
  evaluator_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint srs_rating_events_idempotency_key_unique unique (idempotency_key),
  constraint srs_rating_events_entity_identity_check check (
    (entity_type = 'word_bank' and entity_id is not null and topic is null)
    or
    (entity_type = 'topic_srs' and topic is not null and entity_id is null)
  )
);

create index if not exists srs_rating_events_user_entity_idx
  on public.srs_rating_events (user_id, entity_type, entity_id, topic);

alter table public.srs_rating_events enable row level security;

grant select, insert on public.srs_rating_events to authenticated;

-- Events are immutable: only insert/select. No update/delete policies, so the
-- ledger can never be edited or pruned by clients — only appended to via the
-- RPC below (which runs as SECURITY DEFINER and bypasses these policies, but
-- direct client inserts are still allowed for symmetry/debuggability and are
-- scoped to the caller's own user_id).
create policy "srs_rating_events_select_own"
  on public.srs_rating_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "srs_rating_events_insert_own"
  on public.srs_rating_events
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- ── SM-2 helper (mirrors lib/srs/schedule.ts::scheduleNextReview) ──────────
--
-- updateEaseOnLapse is hardcoded to false here because both apply_* RPCs below
-- call this with that word-bank/topic-srs semantics. If a future caller needs
-- updateEaseOnLapse: true (lib/srs.ts's SRSData path), add a parameter rather
-- than branching inline — do not silently diverge from schedule.ts.

create or replace function public._sm2_schedule_next(
  p_ease double precision,
  p_interval integer,
  p_repetitions integer,
  p_grade integer,
  p_now timestamptz
)
returns table (
  next_ease double precision,
  next_interval integer,
  next_repetitions integer,
  next_review_at timestamptz
)
language plpgsql
immutable
as $$
declare
  -- word_bank.ease_factor / topic_srs.ease_factor are both `double precision`
  -- columns, not `numeric` — this function's ease parameter/return type must
  -- match exactly, or Postgres refuses to resolve the call (no implicit
  -- double precision -> numeric cast for function argument matching).
  v_min_ease constant double precision := 1.3;
  -- p_grade is already an integer (the RPC callers validate/clamp 0-5 before
  -- calling this), so no rounding is needed here — schedule.ts rounds a
  -- floating grade before this point in the JS equivalent.
  v_grade integer := greatest(0, least(5, p_grade));
  v_ease double precision := p_ease;
  v_interval integer := p_interval;
  v_repetitions integer := p_repetitions;
begin
  if v_grade >= 3 then
    if v_repetitions = 0 then
      v_interval := 1;
    elsif v_repetitions = 1 then
      v_interval := 6;
    else
      v_interval := greatest(1, round(v_interval * v_ease));
    end if;
    v_repetitions := v_repetitions + 1;
    v_ease := greatest(v_min_ease, v_ease + (0.1 - (5 - v_grade) * (0.08 + (5 - v_grade) * 0.02)));
  else
    v_repetitions := 0;
    v_interval := 1;
    -- updateEaseOnLapse = false: ease is left untouched on a lapse.
  end if;

  v_ease := round(v_ease * 100) / 100.0;

  return query select
    v_ease,
    v_interval,
    v_repetitions,
    -- schedule.ts advances by local calendar days via Date#setDate, preserving
    -- wall-clock time. Postgres `+ make_interval(days => n)` on a timestamptz
    -- adds calendar days in the session timezone, matching that semantics.
    p_now + make_interval(days => v_interval);
end;
$$;

revoke execute on function public._sm2_schedule_next from public, anon, authenticated;

-- ── SM-2 status derivation (shared by both apply_* RPCs below) ─────────────
--
-- Single-sources the srs_status classification so it can't drift between the
-- word_bank and topic_srs RPCs. Must match lib/srs/compute.ts::computeSM2's
-- status derivation — do not tune the thresholds here independently of that
-- file.

create or replace function public._sm2_derive_status(
  p_interval integer,
  p_repetitions integer
)
returns text
language sql
immutable
as $$
  select case
    when p_interval > 21 then 'mastered'
    when p_repetitions > 0 then 'review'
    else 'learning'
  end
$$;

revoke execute on function public._sm2_derive_status from public, anon, authenticated;

-- ── word_bank rating RPC ────────────────────────────────────────────────────
--
-- Applies one immutable rating event to a word_bank row. Idempotent on
-- p_idempotency_key: a second call with the same key is a silent no-op that
-- returns the row's current (unchanged) state — never an error — so outbox
-- retries never need special-casing.

create or replace function public.apply_word_bank_rating_event(
  p_idempotency_key uuid,
  p_user_id uuid,
  p_word_id uuid,
  p_grade integer,
  p_occurred_at timestamptz default now(),
  p_evaluator_metadata jsonb default '{}'::jsonb
)
returns public.word_bank
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
  v_row public.word_bank;
  v_next record;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise insufficient_privilege using message = 'p_user_id must match the authenticated caller';
  end if;

  if p_grade < 0 or p_grade > 5 then
    raise exception 'grade must be between 0 and 5';
  end if;

  -- Record the event first. ON CONFLICT DO NOTHING makes a duplicate
  -- idempotency key a true no-op: nothing new is inserted, so we must not
  -- reapply the SM-2 transition below.
  insert into public.srs_rating_events (
    idempotency_key, user_id, entity_type, entity_id, grade, occurred_at, evaluator_metadata
  )
  values (
    p_idempotency_key, p_user_id, 'word_bank', p_word_id, p_grade, p_occurred_at, p_evaluator_metadata
  )
  on conflict (idempotency_key) do nothing;

  get diagnostics v_inserted = row_count;

  -- Lock the target row for the duration of the transaction. Concurrent
  -- ratings for the same word therefore serialize here instead of both
  -- reading the same pre-rating snapshot.
  select * into v_row
  from public.word_bank
  where id = p_word_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'word_bank row % not found for user', p_word_id;
  end if;

  if v_inserted = 0 or v_inserted is null then
    -- Duplicate submission (same idempotency key already applied). No-op:
    -- return the row's current, unchanged state.
    return v_row;
  end if;

  select * into v_next from public._sm2_schedule_next(
    v_row.ease_factor, v_row.interval_days, v_row.repetitions, p_grade, p_occurred_at
  );

  update public.word_bank
  set
    ease_factor = v_next.next_ease,
    interval_days = v_next.next_interval,
    repetitions = v_next.next_repetitions,
    next_review_at = v_next.next_review_at,
    srs_status = public._sm2_derive_status(v_next.next_interval, v_next.next_repetitions),
    last_reviewed_at = p_occurred_at,
    review_count = v_row.review_count + 1
  where id = p_word_id and user_id = p_user_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.apply_word_bank_rating_event from public, anon;
grant execute on function public.apply_word_bank_rating_event to authenticated;

-- ── topic_srs rating RPC ────────────────────────────────────────────────────
--
-- topic_srs's natural key is (user_id, topic) — a brand-new topic has no row
-- (and thus no id) until the first rating creates one. We key the rating
-- event and the row lock by (user_id, topic) rather than an id. A plain
-- SELECT ... FOR UPDATE locks the row when it already exists (the common
-- case); only when no row is found yet do we fall back to
-- INSERT ... ON CONFLICT (user_id, topic) DO UPDATE as a per-entity
-- upsert-lock, so two concurrent first-time ratings for the same new topic
-- still serialize into one insert + one update, never two competing inserts.

create or replace function public.apply_topic_srs_rating_event(
  p_idempotency_key uuid,
  p_user_id uuid,
  p_topic text,
  p_grade integer,
  p_occurred_at timestamptz default now(),
  p_evaluator_metadata jsonb default '{}'::jsonb
)
returns public.topic_srs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
  v_row public.topic_srs;
  v_next record;
  v_default_ease constant numeric := 2.5;
  v_default_interval constant integer := 1;
  v_default_repetitions constant integer := 0;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise insufficient_privilege using message = 'p_user_id must match the authenticated caller';
  end if;

  if p_topic is null or length(trim(p_topic)) = 0 then
    raise exception 'topic must not be empty';
  end if;

  if p_grade < 0 or p_grade > 5 then
    raise exception 'grade must be between 0 and 5';
  end if;

  insert into public.srs_rating_events (
    idempotency_key, user_id, entity_type, topic, grade, occurred_at, evaluator_metadata
  )
  values (
    p_idempotency_key, p_user_id, 'topic_srs', p_topic, p_grade, p_occurred_at, p_evaluator_metadata
  )
  on conflict (idempotency_key) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 or v_inserted is null then
    -- Duplicate submission. Return current row state if it exists; if the
    -- original application somehow never created the row (shouldn't happen —
    -- insert+update below are in the same transaction as the event insert),
    -- fall through and let the caller see "not found" via a null return.
    select * into v_row from public.topic_srs where user_id = p_user_id and topic = p_topic;
    return v_row; -- may be NULL row if truly never applied; caller treats as no-op
  end if;

  -- Lock the target row first, mirroring apply_word_bank_rating_event's plain
  -- row lock. Most calls are ratings on a topic that already has a row, so
  -- this avoids firing topic_srs's BEFORE UPDATE update_updated_at() trigger
  -- twice per call (once via the upsert-as-lock below, once via the real
  -- UPDATE further down) for the common case.
  select * into v_row
  from public.topic_srs
  where user_id = p_user_id and topic = p_topic
  for update;

  if not found then
    -- First-ever rating for this topic: no row to lock yet. Insert one
    -- seeded with SM-2 defaults, using ON CONFLICT DO UPDATE purely as a
    -- row-locking primitive — Postgres takes a row-level lock on the
    -- conflicting row for the duration of the ON CONFLICT DO UPDATE, so two
    -- concurrent first-time ratings for the same new topic serialize into
    -- one insert + one update, never two competing inserts. This does mean
    -- the BEFORE UPDATE trigger fires twice in that one-time race case
    -- (harmless: nothing depends on topic_srs.updated_at precision).
    insert into public.topic_srs as t (
      user_id, topic, ease_factor, interval_days, repetitions, srs_status,
      next_review_at, review_count, last_reviewed_at
    )
    values (
      p_user_id, p_topic, v_default_ease, v_default_interval, v_default_repetitions, 'new',
      null, 0, null
    )
    on conflict (user_id, topic) do update set topic = excluded.topic
    returning * into v_row;
  end if;

  select * into v_next from public._sm2_schedule_next(
    v_row.ease_factor, v_row.interval_days, v_row.repetitions, p_grade, p_occurred_at
  );

  update public.topic_srs
  set
    ease_factor = v_next.next_ease,
    interval_days = v_next.next_interval,
    repetitions = v_next.next_repetitions,
    next_review_at = v_next.next_review_at,
    srs_status = public._sm2_derive_status(v_next.next_interval, v_next.next_repetitions),
    last_reviewed_at = p_occurred_at,
    review_count = v_row.review_count + 1
  where user_id = p_user_id and topic = p_topic
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.apply_topic_srs_rating_event from public, anon;
grant execute on function public.apply_topic_srs_rating_event to authenticated;
