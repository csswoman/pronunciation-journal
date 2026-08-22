-- Aggregate RPCs for /progress projections: avoid pulling full row-level
-- activity_sessions and lesson_completions history into the app for what
-- are ultimately just counts and sums. Both run as the calling user
-- (security invoker, the Postgres default) and read auth.uid() directly —
-- never trust a client-supplied user id.

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
    count(*)::bigint as sessions,
    coalesce(sum(exercises_total), 0)::bigint as exercises,
    coalesce(sum(duration_ms), 0)::bigint as duration_ms,
    count(distinct (completed_at at time zone 'utc')::date)::bigint as active_days
  from public.activity_sessions
  where user_id = (select auth.uid())
$$;

comment on function public.get_activity_totals() is
  'Lifetime activity_sessions aggregate for the /progress projections panel. Replaces an unbounded row fetch — see lib/progress/queries.ts getProgressProjections.';

create or replace function public.get_lesson_completion_total()
returns bigint
language sql
stable
as $$
  select count(*)::bigint
  from public.lesson_completions
  where user_id = (select auth.uid())
$$;

comment on function public.get_lesson_completion_total() is
  'Lifetime lesson_completions count for the /progress projections panel. Replaces an unbounded row fetch — see lib/progress/queries.ts getProgressProjections.';

grant execute on function public.get_activity_totals() to authenticated;
grant execute on function public.get_lesson_completion_total() to authenticated;
