-- Reconcile the reader schema before reader_audio adds audio_url.
--
-- 20260718012728 retired reader_passages as dead, but the active Reader audio
-- flow and 20260908120000 depend on it. Production already has the table; this
-- idempotent migration repairs clean rebuilds without rewriting history.

create table if not exists public.reader_passages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_items text[] not null,
  target_hash text not null,
  topic text not null default '',
  passage text not null,
  questions jsonb not null default '[]'::jsonb,
  level text not null default 'b1',
  created_at timestamptz not null default now()
);

create index if not exists reader_passages_user_created_idx
  on public.reader_passages (user_id, created_at desc);

create index if not exists reader_passages_user_hash_idx
  on public.reader_passages (user_id, target_hash);

alter table public.reader_passages enable row level security;

drop policy if exists "reader_passages_select_own" on public.reader_passages;
create policy "reader_passages_select_own"
  on public.reader_passages
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "reader_passages_insert_own" on public.reader_passages;
create policy "reader_passages_insert_own"
  on public.reader_passages
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "reader_passages_update_own" on public.reader_passages;
create policy "reader_passages_update_own"
  on public.reader_passages
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
