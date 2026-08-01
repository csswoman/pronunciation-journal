-- Lightweight readiness probe that doesn't require reading user data.
-- Avoids exercising RLS-protected tables (e.g. user_profiles) with the anon key.
create or replace function public.health_check()
returns boolean
language sql
security definer
set search_path = public
as $$
  select true;
$$;

revoke all on function public.health_check() from public;
grant execute on function public.health_check() to anon, authenticated;
