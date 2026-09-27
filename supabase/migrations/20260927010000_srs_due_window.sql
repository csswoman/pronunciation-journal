-- Plan 046, phase B: only a due review may advance spaced SRS.
--
-- Every distinct evaluated event is still appended to srs_rating_events, but
-- an early successful repetition does not mutate the materialized schedule.
-- A lapse remains effective when it is current, and the first rating for a
-- new card is allowed because next_review_at is NULL.
--
-- Offline ordering policy:
--   * occurred_at, not delivery time, decides whether a review was due;
--   * future client clocks are clamped to the transaction's server time;
--   * an event older than last_reviewed_at remains in the ledger but cannot
--     rewind a newer materialized state.

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
  v_objective_count integer;
  v_next_status text;
  v_next_provenance text;
  v_effective_at timestamptz := least(p_occurred_at, now());
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise insufficient_privilege using message = 'p_user_id must match the authenticated caller';
  end if;

  if p_grade < 0 or p_grade > 5 then
    raise exception 'grade must be between 0 and 5';
  end if;

  insert into public.srs_rating_events (
    idempotency_key, user_id, entity_type, entity_id, grade, occurred_at, evaluator_metadata
  )
  values (
    p_idempotency_key, p_user_id, 'word_bank', p_word_id, p_grade, p_occurred_at, p_evaluator_metadata
  )
  on conflict (idempotency_key) do nothing;

  get diagnostics v_inserted = row_count;

  select * into v_row
  from public.word_bank
  where id = p_word_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'word_bank row % not found for user', p_word_id;
  end if;

  if v_inserted = 0 or v_inserted is null then
    return v_row;
  end if;

  -- A delayed offline event may be observed after a newer event. Keep the
  -- immutable ledger row, but never project older knowledge over newer state.
  if v_row.last_reviewed_at is not null and v_effective_at < v_row.last_reviewed_at then
    return v_row;
  end if;

  -- Correct repetitions before the due boundary are practice, not spaced
  -- evidence. The event is already recorded above; leave every projection
  -- field unchanged, including review_count and objective_evidence_count.
  if p_grade >= 3
    and v_row.next_review_at is not null
    and v_effective_at < v_row.next_review_at
  then
    return v_row;
  end if;

  select * into v_next from public._sm2_schedule_next(
    v_row.ease_factor, v_row.interval_days, v_row.repetitions, p_grade, v_effective_at
  );

  v_next_status := public._sm2_derive_status(v_next.next_interval, v_next.next_repetitions);
  v_objective_count := case
    when p_grade >= 3 then coalesce(v_row.objective_evidence_count, 0) + 1
    else 0
  end;
  v_next_provenance := case
    when p_grade < 3 then 'none'
    when v_next_status = 'mastered' and v_objective_count >= 2 then 'objective'
    when v_row.mastery_provenance = 'objective' then 'objective'
    else v_row.mastery_provenance
  end;

  update public.word_bank
  set
    ease_factor = v_next.next_ease,
    interval_days = v_next.next_interval,
    repetitions = v_next.next_repetitions,
    next_review_at = v_next.next_review_at,
    srs_status = v_next_status,
    last_reviewed_at = v_effective_at,
    review_count = v_row.review_count + 1,
    familiarity_status = 'unknown',
    familiarity_confidence = 0,
    verification_due_at = null,
    objective_evidence_count = v_objective_count,
    mastery_provenance = v_next_provenance,
    mastery_version = greatest(v_row.mastery_version, 2)
  where id = p_word_id and user_id = p_user_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.apply_word_bank_rating_event from public, anon;
grant execute on function public.apply_word_bank_rating_event to authenticated;

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
  v_effective_at timestamptz := least(p_occurred_at, now());
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
    select * into v_row
    from public.topic_srs
    where user_id = p_user_id and topic = p_topic;
    return v_row;
  end if;

  select * into v_row
  from public.topic_srs
  where user_id = p_user_id and topic = p_topic
  for update;

  if not found then
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

  if v_row.last_reviewed_at is not null and v_effective_at < v_row.last_reviewed_at then
    return v_row;
  end if;

  if p_grade >= 3
    and v_row.next_review_at is not null
    and v_effective_at < v_row.next_review_at
  then
    return v_row;
  end if;

  select * into v_next from public._sm2_schedule_next(
    v_row.ease_factor, v_row.interval_days, v_row.repetitions, p_grade, v_effective_at
  );

  update public.topic_srs
  set
    ease_factor = v_next.next_ease,
    interval_days = v_next.next_interval,
    repetitions = v_next.next_repetitions,
    next_review_at = v_next.next_review_at,
    srs_status = public._sm2_derive_status(v_next.next_interval, v_next.next_repetitions),
    last_reviewed_at = v_effective_at,
    review_count = v_row.review_count + 1
  where user_id = p_user_id and topic = p_topic
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.apply_topic_srs_rating_event from public, anon;
grant execute on function public.apply_topic_srs_rating_event to authenticated;
