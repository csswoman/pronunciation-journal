create table if not exists public.journal_error_pattern_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  pattern_id text not null check (pattern_id in (
    'tense_present_for_past', 'present_perfect_vs_past', 'missing_auxiliary',
    'subject_verb_agreement', 'word_order', 'preposition_choice', 'article_use',
    'plural_countable', 'modal_form', 'conditional_form', 'gerund_infinitive',
    'comparative_form', 'negation_form', 'question_form', 'vocabulary_choice', 'spelling'
  )),
  created_at timestamptz not null default now(),
  primary key (user_id, entry_id, pattern_id)
);

alter table public.journal_error_pattern_events enable row level security;
revoke all on public.journal_error_pattern_events from anon, authenticated;
grant select on public.journal_error_pattern_events to authenticated;
create policy "journal_error_pattern_events_select_own"
  on public.journal_error_pattern_events for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.keep_journal_correction_monotonic()
returns trigger
language plpgsql
set search_path = pg_catalog, public, auth
as $$
begin
  if old.status = 'corrected' and new.status <> 'corrected' then
    new.status := old.status;
    new.content := old.content;
    new.corrected_content := old.corrected_content;
    new.feedback := old.feedback;
    new.updated_at := greatest(old.updated_at, new.updated_at);
  end if;
  return new;
end;
$$;

create trigger journal_entries_keep_correction_monotonic
before update on public.journal_entries
for each row execute function public.keep_journal_correction_monotonic();

create or replace function public.apply_journal_correction(
  p_user_id uuid,
  p_entry_id uuid,
  p_corrected_content text,
  p_feedback jsonb,
  p_pattern_ids text[],
  p_initial_state jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_updated integer;
  v_state jsonb;
  v_queue jsonb;
  v_pattern text;
  v_existing jsonb;
  v_tombstones jsonb;
  v_new_patterns text[];
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000);
  v_due_at bigint;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'journal correction user mismatch' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  update public.journal_entries
  set status = 'corrected', corrected_content = p_corrected_content,
      feedback = p_feedback, updated_at = clock_timestamp()
  where id = p_entry_id and user_id = p_user_id and status = 'submitted';
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return jsonb_build_object('applied', false, 'state', null);
  end if;

  with inserted as (
    insert into public.journal_error_pattern_events (user_id, entry_id, pattern_id)
    select p_user_id, p_entry_id, distinct_pattern
    from (select distinct unnest(coalesce(p_pattern_ids, array[]::text[])) as distinct_pattern) patterns
    where distinct_pattern in (
      'tense_present_for_past', 'present_perfect_vs_past', 'missing_auxiliary',
      'subject_verb_agreement', 'word_order', 'preposition_choice', 'article_use',
      'plural_countable', 'modal_form', 'conditional_form', 'gerund_infinitive',
      'comparative_form', 'negation_form', 'question_form', 'vocabulary_choice', 'spelling'
    )
    on conflict (user_id, entry_id, pattern_id) do nothing
    returning pattern_id
  )
  select coalesce(array_agg(pattern_id), array[]::text[]) into v_new_patterns from inserted;

  if cardinality(v_new_patterns) = 0 then
    return jsonb_build_object('applied', true, 'state', null);
  end if;

  select state into v_state
  from public.user_learning_state
  where user_id = p_user_id
  for update;

  if not found then
    v_state := p_initial_state;
    if v_state is null or v_state->>'userId' <> p_user_id::text then
      raise exception 'invalid initial learning state';
    end if;
  end if;

  v_queue := coalesce(v_state->'errorRecurrence', '{"entries":[]}'::jsonb);
  v_due_at := v_now_ms + 86400000;

  for v_pattern in
    select unnest(v_new_patterns)
  loop
    select item into v_existing
    from jsonb_array_elements(coalesce(v_queue->'entries', '[]'::jsonb)) as entries(item)
    where item->>'patternId' = v_pattern
    limit 1;

    v_queue := jsonb_set(
      v_queue,
      '{entries}',
      coalesce((
        select jsonb_agg(item)
        from jsonb_array_elements(coalesce(v_queue->'entries', '[]'::jsonb)) as entries(item)
        where item->>'patternId' <> v_pattern
      ), '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'patternId', v_pattern,
        'stage', 0,
        'dueAt', v_due_at,
        'failCount', coalesce((v_existing->>'failCount')::integer, 0) + 1,
        'lastFailedAt', v_now_ms
      ))
    );
    v_tombstones := coalesce(v_queue->'removedAtByPattern', '{}'::jsonb) - v_pattern;
    v_queue := jsonb_set(v_queue, '{removedAtByPattern}', v_tombstones, true);
  end loop;

  v_state := jsonb_set(v_state, '{errorRecurrence}', v_queue, true);
  v_state := jsonb_set(v_state, '{updatedAt}', to_jsonb(clock_timestamp()), true);

  insert into public.user_learning_state (user_id, state, updated_at)
  values (p_user_id, v_state, clock_timestamp())
  on conflict (user_id) do update
  set state = excluded.state, updated_at = excluded.updated_at;

  return jsonb_build_object('applied', true, 'state', v_state);
end;
$$;

revoke execute on function public.apply_journal_correction(uuid, uuid, text, jsonb, text[], jsonb) from public, anon;
grant execute on function public.apply_journal_correction(uuid, uuid, text, jsonb, text[], jsonb) to authenticated;

create or replace function public.merge_user_learning_state_snapshot(
  p_user_id uuid,
  p_state jsonb,
  p_updated_at timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, auth
as $$
declare
  v_current jsonb;
  v_merged jsonb;
  v_recurrence jsonb;
  v_tombstones jsonb;
  v_prefer_incoming boolean;
begin
  if auth.uid() is null or auth.uid() <> p_user_id or p_state->>'userId' <> p_user_id::text then
    raise exception 'learning state user mismatch' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select state into v_current from public.user_learning_state where user_id = p_user_id for update;
  if not found then
    v_merged := p_state;
  elsif coalesce((p_state->>'updatedAt')::timestamptz, p_updated_at) > coalesce((v_current->>'updatedAt')::timestamptz, '-infinity'::timestamptz) then
    v_merged := p_state;
  else
    v_merged := v_current;
  end if;
  v_prefer_incoming := v_merged = p_state;

  select coalesce(jsonb_object_agg(pattern_id, removed_at), '{}'::jsonb)
  into v_tombstones
  from (
    select key as pattern_id, max(value::bigint) as removed_at
    from (
      select key, value from jsonb_each_text(coalesce(v_current->'errorRecurrence'->'removedAtByPattern', '{}'::jsonb))
      union all
      select key, value from jsonb_each_text(coalesce(p_state->'errorRecurrence'->'removedAtByPattern', '{}'::jsonb))
    ) tombstone_candidates
    group by key
  ) merged_tombstones;

  -- Recurrence is a union by pattern. Omission from an older device snapshot
  -- is not a deletion, so a server-scheduled pattern cannot be erased by outbox replay.
  select jsonb_build_object(
    'entries', coalesce(jsonb_agg(chosen), '[]'::jsonb),
    'removedAtByPattern', v_tombstones
  )
  into v_recurrence
  from (
    select distinct on (entry->>'patternId') entry as chosen
    from (
      select item as entry, 1 as source_rank from jsonb_array_elements(coalesce(v_current->'errorRecurrence'->'entries', '[]'::jsonb)) as current_entries(item)
      union all
      select item as entry, case when v_prefer_incoming then 0 else 2 end as source_rank
      from jsonb_array_elements(coalesce(p_state->'errorRecurrence'->'entries', '[]'::jsonb)) as incoming_entries(item)
    ) candidates
    where coalesce((v_tombstones->>(entry->>'patternId'))::bigint, -1) < coalesce((entry->>'lastFailedAt')::bigint, 0)
    order by entry->>'patternId', (entry->>'lastFailedAt')::bigint desc nulls last, source_rank
  ) deduped;

  v_merged := jsonb_set(v_merged, '{errorRecurrence}', coalesce(v_recurrence, '{"entries":[]}'::jsonb), true);
  insert into public.user_learning_state (user_id, state, updated_at)
  values (p_user_id, v_merged, greatest(p_updated_at, clock_timestamp()))
  on conflict (user_id) do update set state = excluded.state, updated_at = excluded.updated_at;
  return v_merged;
end;
$$;

revoke execute on function public.merge_user_learning_state_snapshot(uuid, jsonb, timestamptz) from public, anon;
grant execute on function public.merge_user_learning_state_snapshot(uuid, jsonb, timestamptz) to authenticated;
