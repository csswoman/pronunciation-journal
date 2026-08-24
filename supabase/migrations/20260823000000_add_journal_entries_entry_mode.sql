alter table public.journal_entries
  add column entry_mode text not null default 'blank' check (entry_mode in ('guided', 'blank'));
