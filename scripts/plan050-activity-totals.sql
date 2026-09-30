-- Run only against disposable local Supabase; all fixtures are rolled back.
begin;
with owner as (insert into auth.users(id) values (gen_random_uuid()) returning id)
select set_config('request.jwt.claim.sub', id::text, true) from owner;
select set_config('plan050.owner', auth.uid()::text, true);
with other_user as (insert into auth.users(id) values (gen_random_uuid()) returning id)
select set_config('plan050.other', id::text, true) from other_user;

insert into public.activity_sessions(user_id, source, exercises_total, duration_ms, completed_at)
values
  (auth.uid(), 'practice', 2, 1000, '2026-09-27T04:30:00Z'),
  (auth.uid(), 'practice', 3, 2000, '2026-09-27T05:30:00Z'),
  (auth.uid(), 'daily_plan', 0, 0, '2026-09-28T06:00:00Z'),
  (current_setting('plan050.other')::uuid, 'practice', 99, 99000, '2026-09-27T05:30:00Z');

set local role authenticated;
do $$
declare totals record;
begin
  select * into totals from public.get_activity_totals();
  if totals.sessions <> 2 or totals.exercises <> 5 or totals.duration_ms <> 3000 or totals.active_days <> 2 then
    raise exception 'Owner totals, Lima boundary or manual-day exclusion failed: %', row_to_json(totals);
  end if;
end $$;
select set_config('request.jwt.claim.sub', current_setting('plan050.other'), true);
do $$
declare totals record;
begin
  select * into totals from public.get_activity_totals();
  if totals.sessions <> 1 or totals.exercises <> 99 or totals.active_days <> 1 then
    raise exception 'Second account isolation failed: %', row_to_json(totals);
  end if;
end $$;
select set_config('request.jwt.claim.sub', '', true);
do $$
declare totals record;
begin
  select * into totals from public.get_activity_totals();
  if totals.sessions <> 0 or totals.active_days <> 0 then
    raise exception 'Missing user identity leaked activity';
  end if;
end $$;
rollback;
