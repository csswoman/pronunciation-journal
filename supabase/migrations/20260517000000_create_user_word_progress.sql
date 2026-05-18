create table user_word_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  word_id text not null,
  category_id text not null,
  status text check (status in ('new', 'reviewing', 'learned')) default 'new',
  srs_level integer default 0 check (srs_level between 0 and 5),
  next_review_at timestamptz,
  last_seen_at timestamptz,
  added_to_word_bank boolean default false,
  created_at timestamptz default now(),
  unique(user_id, word_id)
);

alter table user_word_progress enable row level security;

create policy "Users can manage their own progress"
  on user_word_progress
  for all
  using (auth.uid() = user_id);

create index on user_word_progress(user_id, category_id);
create index on user_word_progress(user_id, status);
