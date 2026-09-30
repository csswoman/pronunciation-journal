-- Plan 042: Tabla de reportes de correcciones de IA erróneas.
-- Privada por usuario: cada alumno solo puede ver e insertar sus propios reportes.

create table if not exists public.ai_feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('coach_correction', 'production_grade', 'journal_correction')),
  prompt_version text not null default 'v1',
  input_snapshot jsonb not null,
  output_snapshot jsonb not null,
  error_pattern text null,
  comment text null check (comment is null or length(comment) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists ai_feedback_reports_user_created_idx
  on public.ai_feedback_reports (user_id, created_at desc);

alter table public.ai_feedback_reports enable row level security;

drop policy if exists "ai_feedback_reports_select_own" on public.ai_feedback_reports;
create policy "ai_feedback_reports_select_own"
  on public.ai_feedback_reports for select
  using ((select auth.uid()) = user_id);

drop policy if exists "ai_feedback_reports_insert_own" on public.ai_feedback_reports;
create policy "ai_feedback_reports_insert_own"
  on public.ai_feedback_reports for insert
  with check ((select auth.uid()) = user_id);
