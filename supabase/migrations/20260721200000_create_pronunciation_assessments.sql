-- Plan 067 Step 6: persist pronunciation diagnostic results, user-scoped.
--
-- Each completed diagnostic run is a new immutable row (see plan's
-- "Maintenance notes": assessment versions must stay immutable — later
-- schema versions never reinterpret historical results). The row `id` is
-- generated client-side (uuid) so the offline-first outbox can retry a
-- failed submission safely: a retry resubmits the same `id`, and the
-- primary-key uniqueness constraint makes a duplicate insert a no-op at the
-- application layer (see lib/pronunciation/assessment/persistence.ts).
--
-- No `update` policy is defined on purpose: rows are append-only from the
-- app's perspective (a new diagnostic run always inserts a new row, never
-- mutates a prior one). A `delete` policy is still provided for account
-- data-deletion flows and guest-transfer cleanup, mirroring other
-- user-scoped tables in this codebase (e.g. lesson_completions).
create table if not exists public.pronunciation_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schema_version integer not null,
  result jsonb not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pronunciation_assessments_user_completed_at_idx
  on public.pronunciation_assessments (user_id, completed_at desc);

alter table public.pronunciation_assessments enable row level security;

grant select, insert, delete on public.pronunciation_assessments to authenticated;

create policy "pronunciation_assessments_select_own"
  on public.pronunciation_assessments for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "pronunciation_assessments_insert_own"
  on public.pronunciation_assessments for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "pronunciation_assessments_delete_own"
  on public.pronunciation_assessments for delete to authenticated
  using ((select auth.uid()) = user_id);
