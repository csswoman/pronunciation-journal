-- Per-user FSRS schedules for canonical chunks and system text fragments.
-- Content remains system-owned; this table only contains a learner's schedule.
create table if not exists public.content_srs (
  user_id uuid not null references auth.users (id) on delete cascade,
  content_id text not null,
  namespace text not null check (namespace in ('chunks', 'text_fragments')),
  stability double precision not null,
  difficulty double precision not null,
  state text not null,
  interval double precision not null,
  repetitions integer not null,
  next_review_at timestamptz not null,
  last_review_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, namespace, content_id)
);

create index if not exists content_srs_user_next_review_idx
  on public.content_srs (user_id, next_review_at);

drop trigger if exists content_srs_updated_at on public.content_srs;
create trigger content_srs_updated_at
  before update on public.content_srs
  for each row execute function public.update_updated_at();

alter table public.content_srs enable row level security;

drop policy if exists "Select own content SRS" on public.content_srs;
create policy "Select own content SRS"
  on public.content_srs for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Insert own content SRS" on public.content_srs;
create policy "Insert own content SRS"
  on public.content_srs for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Update own content SRS" on public.content_srs;
create policy "Update own content SRS"
  on public.content_srs for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Delete own content SRS" on public.content_srs;
create policy "Delete own content SRS"
  on public.content_srs for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.content_srs to authenticated;
