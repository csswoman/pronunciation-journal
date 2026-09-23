-- Immutable evidence for locally evaluated -ed perception/linking choices.
-- It deliberately does not claim acoustic pronunciation or mastery.
create table if not exists public.ed_cluster_attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  cluster text not null,
  phase smallint not null check (phase in (1, 2)),
  environment_level smallint not null check (environment_level in (1, 2, 3)),
  is_correct boolean not null,
  suspected_epenthesis boolean not null default false,
  occurred_at timestamptz not null
);

create index if not exists ed_cluster_attempts_user_cluster_occurred_idx
  on public.ed_cluster_attempts (user_id, cluster, occurred_at desc);

alter table public.ed_cluster_attempts enable row level security;

create policy "ed_cluster_attempts_select_own"
  on public.ed_cluster_attempts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "ed_cluster_attempts_insert_own"
  on public.ed_cluster_attempts for insert to authenticated
  with check ((select auth.uid()) = user_id);
