-- Progreso de inmersión por usuario: qué lecciones ya se vieron, para que el
-- plan diario no repita una lección hasta agotar el nivel del alumno.
create table if not exists public.immersion_lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.immersion_lessons(id) on delete cascade,
  watched boolean not null default false,
  watched_at timestamptz,
  quiz_score numeric(4, 3),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists immersion_lesson_progress_user_watched_idx
  on public.immersion_lesson_progress (user_id, watched);

alter table public.immersion_lesson_progress enable row level security;

drop policy if exists "immersion_lesson_progress_select_own" on public.immersion_lesson_progress;
create policy "immersion_lesson_progress_select_own"
  on public.immersion_lesson_progress for select
  using ((select auth.uid()) = user_id);

drop policy if exists "immersion_lesson_progress_upsert_own" on public.immersion_lesson_progress;
create policy "immersion_lesson_progress_upsert_own"
  on public.immersion_lesson_progress for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "immersion_lesson_progress_update_own" on public.immersion_lesson_progress;
create policy "immersion_lesson_progress_update_own"
  on public.immersion_lesson_progress for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
