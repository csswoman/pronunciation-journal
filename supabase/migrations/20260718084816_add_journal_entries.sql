create table public.journal_entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  prompt text not null default '',
  prompt_topic text,
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'corrected')),
  corrected_content text,
  feedback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);
create index journal_entries_user_date_idx on public.journal_entries(user_id, entry_date desc);
alter table public.journal_entries enable row level security;
create policy "journal_entries_select_own" on public.journal_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "journal_entries_insert_own" on public.journal_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "journal_entries_update_own" on public.journal_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "journal_entries_delete_own" on public.journal_entries for delete to authenticated using ((select auth.uid()) = user_id);
