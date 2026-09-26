-- Preserve queue corrections such as retractErrorPattern(2 -> 1) when a
-- newer device snapshot still carries the same failure timestamp and count 2.
-- Legacy entries fall back to lastFailedAt until they receive a new revisionAt.
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

  select jsonb_build_object(
    'entries', coalesce(jsonb_agg(chosen), '[]'::jsonb),
    'removedAtByPattern', v_tombstones
  )
  into v_recurrence
  from (
    select distinct on (entry->>'patternId') entry as chosen
    from (
      select item as entry, 1 as source_rank
      from jsonb_array_elements(coalesce(v_current->'errorRecurrence'->'entries', '[]'::jsonb)) as current_entries(item)
      union all
      select item as entry, case when v_prefer_incoming then 0 else 2 end as source_rank
      from jsonb_array_elements(coalesce(p_state->'errorRecurrence'->'entries', '[]'::jsonb)) as incoming_entries(item)
    ) candidates
    where coalesce((v_tombstones->>(entry->>'patternId'))::bigint, -1)
      < coalesce((entry->>'revisionAt')::bigint, (entry->>'lastFailedAt')::bigint, 0)
    order by entry->>'patternId',
      coalesce((entry->>'revisionAt')::bigint, (entry->>'lastFailedAt')::bigint) desc nulls last,
      source_rank
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
