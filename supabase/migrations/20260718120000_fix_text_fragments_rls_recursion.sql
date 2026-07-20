-- Fix infinite recursion in the text_fragments RLS policy.
--
-- "Manage own fragments" was a single FOR ALL policy whose WITH CHECK counted
-- rows in public.text_fragments itself. On INSERT, evaluating that self-referential
-- subquery re-entered the same policy, so Postgres aborted with
-- "infinite recursion detected in policy for relation text_fragments".
--
-- The per-user cap (max 10 fragments, admins exempt) is preserved, but the count
-- now runs inside a SECURITY DEFINER function that executes as the table owner and
-- therefore bypasses RLS, breaking the recursion. Ownership isolation stays in the
-- policy itself (user_id = auth.uid()).

create or replace function public.text_fragments_within_limit()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    coalesce(
      (select up.role = 'admin' from public.user_profiles up where up.id = auth.uid()),
      false
    )
    or (select count(*) from public.text_fragments tf where tf.user_id = auth.uid()) < 10;
$$;

revoke all on function public.text_fragments_within_limit() from public;
grant execute on function public.text_fragments_within_limit() to authenticated;

drop policy if exists "Manage own fragments" on public.text_fragments;

create policy "Manage own fragments"
on public.text_fragments
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and public.text_fragments_within_limit()
);
