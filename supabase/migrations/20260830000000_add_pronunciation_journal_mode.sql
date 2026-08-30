alter table public.journal_entries
  drop constraint if exists journal_entries_entry_mode_check,
  add constraint journal_entries_entry_mode_check
  check (entry_mode in ('guided', 'blank', 'pronunciation'));
