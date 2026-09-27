-- Plan 050 step 6: /progress projections must use the same day boundary and
-- session definition as the rest of the app.
--
-- 1. active_days buckets by America/Lima (STREAK_TIMEZONE in
--    lib/daily/streak-core.ts). The previous UTC bucket split a Lima evening
--    into the next day and disagreed with every streak.
-- 2. sessions excludes manual Daily checklist rows (source = 'daily_plan'
--    with no exercises). They stay in the table and still count as an active
--    day; they are not practice sessions. No rows are deleted or rewritten.
--
-- Signature, return type, security (invoker) and grants are unchanged.

create or replace function public.get_activity_totals()
returns table (
  sessions bigint,
  exercises bigint,
  duration_ms bigint,
  active_days bigint
)
language sql
stable
as $$
  select
    count(*) filter (
      where not (source = 'daily_plan' and coalesce(exercises_total, 0) = 0)
    )::bigint as sessions,
    coalesce(sum(exercises_total), 0)::bigint as exercises,
    coalesce(sum(duration_ms), 0)::bigint as duration_ms,
    count(distinct (completed_at at time zone 'America/Lima')::date)::bigint as active_days
  from public.activity_sessions
  where user_id = (select auth.uid())
$$;

comment on function public.get_activity_totals() is
  'Lifetime activity_sessions aggregate for the /progress projections panel. Days bucket by America/Lima; manual daily_plan checklist rows are not sessions (plan 050). See lib/progress/queries.ts getProgressProjections.';
