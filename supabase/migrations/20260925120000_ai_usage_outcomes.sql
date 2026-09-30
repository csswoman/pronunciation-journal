alter table public.ai_usage_daily
  add column if not exists successes integer not null default 0 check (successes >= 0),
  add column if not exists latency_ms_total bigint not null default 0 check (latency_ms_total >= 0),
  add column if not exists last_status integer,
  add column if not exists last_error_code text,
  add column if not exists last_attempt_at timestamptz;

create or replace function public.ai_usage_record_outcome(
  p_model text,
  p_feature text,
  p_success boolean,
  p_latency_ms integer,
  p_status integer default null,
  p_error_code text default null
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
     or p_latency_ms < 0 then
    raise exception 'invalid AI outcome telemetry arguments';
  end if;

  insert into public.ai_usage_daily (
    day, model, feature, successes, latency_ms_total, last_status, last_error_code, last_attempt_at
  ) values (
    v_day, p_model, p_feature, case when p_success then 1 else 0 end,
    p_latency_ms, p_status, left(p_error_code, 80), clock_timestamp()
  )
  on conflict (day, model, feature) do update
    set successes = public.ai_usage_daily.successes + excluded.successes,
        latency_ms_total = public.ai_usage_daily.latency_ms_total + excluded.latency_ms_total,
        last_status = excluded.last_status,
        last_error_code = excluded.last_error_code,
        last_attempt_at = excluded.last_attempt_at;
end;
$$;

revoke all on function public.ai_usage_record_outcome(text, text, boolean, integer, integer, text)
  from public, anon, authenticated;
grant execute on function public.ai_usage_record_outcome(text, text, boolean, integer, integer, text)
  to service_role;
