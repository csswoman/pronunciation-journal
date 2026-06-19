-- reader_passages: comprehensible-input reader output, recycling recent vocab.
create table public.reader_passages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_items text[] not null,
  target_hash text not null,
  topic text not null default '',
  passage text not null,
  questions jsonb not null default '[]'::jsonb,
  level text not null default 'b1',
  created_at timestamptz not null default now()
);

-- Cache query: most recent passage per user, and per (user, target_hash).
create index reader_passages_user_created_idx
  on public.reader_passages (user_id, created_at desc);
create index reader_passages_user_hash_idx
  on public.reader_passages (user_id, target_hash);

alter table public.reader_passages enable row level security;

create policy "reader_passages_select_own"
  on public.reader_passages for select
  using (auth.uid() = user_id);

create policy "reader_passages_insert_own"
  on public.reader_passages for insert
  with check (auth.uid() = user_id);
