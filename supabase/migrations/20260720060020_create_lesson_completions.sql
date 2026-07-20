create table if not exists public.lesson_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_slug text not null,
  lesson_slug text not null,
  completed_at timestamptz not null default now(),
  source text not null default 'lesson_completion',
  updated_at timestamptz not null default now(),
  unique (user_id, course_slug, lesson_slug)
);

create index if not exists lesson_completions_user_completed_at_idx
  on public.lesson_completions (user_id, completed_at desc);

alter table public.lesson_completions enable row level security;

grant select, insert, update, delete on public.lesson_completions to authenticated;

create policy "lesson_completions_select_own"
  on public.lesson_completions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "lesson_completions_insert_own"
  on public.lesson_completions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "lesson_completions_update_own"
  on public.lesson_completions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "lesson_completions_delete_own"
  on public.lesson_completions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
