-- User learning state: persists AI Coach profile across devices.
-- The client syncs via the outbox pattern (lib/sync/sync-manager.ts).

create table if not exists user_learning_state (
  user_id     uuid primary key references auth.users on delete cascade,
  state       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- RLS: each user can only read and write their own row.
alter table user_learning_state enable row level security;

create policy "user_learning_state_select"
  on user_learning_state for select
  using (auth.uid() = user_id);

create policy "user_learning_state_insert"
  on user_learning_state for insert
  with check (auth.uid() = user_id);

create policy "user_learning_state_update"
  on user_learning_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
