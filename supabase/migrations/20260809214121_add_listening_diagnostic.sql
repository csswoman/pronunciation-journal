alter table public.attempt_logs
  add column if not exists diagnostic jsonb;
