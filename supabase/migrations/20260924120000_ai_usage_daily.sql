create table if not exists public.ai_usage_daily (
  day date not null,
  model text not null,
  feature text not null,
  requests integer not null default 0 check (requests >= 0),
  failures integer not null default 0 check (failures >= 0),
  cache_hits integer not null default 0 check (cache_hits >= 0),
  primary key (day, model, feature)
);

alter table public.ai_usage_daily enable row level security;
alter table public.ai_usage_daily force row level security;
revoke all on public.ai_usage_daily from public, anon, authenticated;
grant select, insert, update on public.ai_usage_daily to service_role;
create policy "ai_usage_daily_service_role_only"
  on public.ai_usage_daily for all to service_role
  using (true) with check (true);

create or replace function public.ai_usage_try_reserve(
  p_model text,
  p_feature text,
  p_limit integer
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_day date := (clock_timestamp() at time zone 'America/Los_Angeles')::date;
  v_used integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise insufficient_privilege using message = 'service role required';
  end if;
  if p_model is null or length(p_model) = 0 or p_feature is null or length(p_feature) = 0 or p_limit < 1 then
    raise exception 'invalid AI usage reservation arguments';
  end if;

  -- Serialize reservations for this model/day so concurrent features cannot
  -- each observe the same remaining capacity and oversubscribe it.
  perform pg_advisory_xact_lock(hashtextextended(v_day::text || ':' || p_model, 0));
  select coalesce(sum(requests), 0)::integer into v_used
  from public.ai_usage_daily
  where day = v_day and model = p_model;

  if v_used >= p_limit then
    return false;
  end if;

  insert into public.ai_usage_daily (day, model, feature, requests)
  values (v_day, p_model, p_feature, 1)
  on conflict (day, model, feature)
  do update set requests = public.ai_usage_daily.requests + 1;
  return true;
end;
$$;

create or replace function public.ai_usage_record(
  p_model text,
  p_feature text,
  p_failure_delta integer default 0,
  p_cache_hit_delta integer default 0
) returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_day date := (clock_timestamp() at time zone 'America/Los_Angeles')::date;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise insufficient_privilege using message = 'service role required';
  end if;
  if p_model is null or length(p_model) = 0 or p_feature is null or length(p_feature) = 0
     or p_failure_delta < 0 or p_cache_hit_delta < 0 then
    raise exception 'invalid AI usage telemetry arguments';
  end if;

  insert into public.ai_usage_daily (day, model, feature, failures, cache_hits)
  values (v_day, p_model, p_feature, p_failure_delta, p_cache_hit_delta)
  on conflict (day, model, feature) do update
    set failures = public.ai_usage_daily.failures + excluded.failures,
        cache_hits = public.ai_usage_daily.cache_hits + excluded.cache_hits;
end;
$$;

revoke all on function public.ai_usage_try_reserve(text, text, integer) from public, anon, authenticated;
revoke all on function public.ai_usage_record(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.ai_usage_try_reserve(text, text, integer) to service_role;
grant execute on function public.ai_usage_record(text, text, integer, integer) to service_role;
