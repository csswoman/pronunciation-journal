create table if not exists assessment_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  mode text not null check (mode in ('placement', 'checkpoint')),
  evaluated_level text,
  assigned_level text not null,
  score integer not null,
  total integer not null,
  passed boolean not null,
  topic_scores jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now()
);

create index if not exists assessment_results_user_completed_idx
  on assessment_results (user_id, completed_at desc);

alter table assessment_results enable row level security;

create policy "assessment_results_select"
  on assessment_results for select
  using (auth.uid() = user_id);

create policy "assessment_results_insert"
  on assessment_results for insert
  with check (auth.uid() = user_id);
