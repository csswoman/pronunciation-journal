-- Allow anon and authenticated users to read public immersion lessons catalog.
-- system catalog data (same rows for every learner, no per-user ownership).
grant select on table public.immersion_lessons to anon, authenticated;

drop policy if exists "immersion_lessons_select_authenticated" on public.immersion_lessons;
drop policy if exists "immersion_lessons_select_public" on public.immersion_lessons;
create policy "immersion_lessons_select_public"
  on public.immersion_lessons for select
  to anon, authenticated
  using (true);
