-- Audit the UI exercise independently from the modality used for accreditation.
alter table public.attempt_logs
  add column if not exists rendered_mode text;
