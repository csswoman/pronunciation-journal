-- Plan 065: keep self-report, objective evidence and mastery distinct.
--
-- A flashcard rating expresses familiarity/intention. It is not proof that the
-- learner can recall or produce the target. Objective practice continues to
-- use the existing immutable SRS rating-event RPC; these columns preserve the
-- provenance needed by progress reports and verification queues.

alter table public.word_bank
  add column if not exists familiarity_status text not null default 'unknown'
    check (familiarity_status in ('unknown', 'familiar')),
  add column if not exists familiarity_confidence smallint not null default 0
    check (familiarity_confidence between 0 and 100),
  add column if not exists verification_due_at timestamptz,
  add column if not exists mastery_provenance text not null default 'none'
    check (mastery_provenance in ('none', 'legacy_self_report', 'objective')),
  add column if not exists mastery_version integer not null default 1
    check (mastery_version >= 1),
  add column if not exists objective_evidence_count integer not null default 0
    check (objective_evidence_count >= 0);

-- Existing `mastered` rows predate objective provenance. Keep their SRS state
-- intact, but make the report boundary explicit instead of silently calling
-- old self-ratings verified mastery.
update public.word_bank
set mastery_provenance = 'legacy_self_report',
    mastery_version = greatest(mastery_version, 1)
where srs_status = 'mastered'
  and mastery_provenance = 'none';

create index if not exists word_bank_verification_due_idx
  on public.word_bank (user_id, verification_due_at)
  where verification_due_at is not null;

-- Preserve the existing transactional/idempotent SRS contract while requiring
-- repeated objective evidence before a row can become objectively mastered.
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

  select * into v_next from public._sm2_schedule_next(
    v_row.ease_factor, v_row.interval_days, v_row.repetitions, p_grade, p_occurred_at
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
    last_reviewed_at = p_occurred_at,
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
