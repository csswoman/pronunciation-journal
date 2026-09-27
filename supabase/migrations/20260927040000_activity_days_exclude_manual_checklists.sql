-- Plan 050: a manual Daily checkbox does not constitute a learning session.
-- Keep historical rows intact; only the projection changes. No backfill.
create or replace function public.get_activity_totals()
returns table (sessions bigint, exercises bigint, duration_ms bigint, active_days bigint)
language sql stable security invoker
set search_path = public
as $$
  select
    count(*)::bigint,
    coalesce(sum(exercises_total), 0)::bigint,
    coalesce(sum(duration_ms), 0)::bigint,
    count(distinct (completed_at at time zone 'America/Lima')::date)::bigint
  from public.activity_sessions
  where user_id = (select auth.uid())
    and not (source = 'daily_plan' and coalesce(exercises_total, 0) = 0)
$$;

comment on function public.get_activity_totals() is
  'Learning activity totals in America/Lima; manual empty Daily checklists contribute neither sessions nor active days (Plan 050). Historical rows are retained.';
