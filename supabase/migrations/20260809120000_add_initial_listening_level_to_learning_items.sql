alter table public.learning_items
  add column if not exists initial_listening_level jsonb;
