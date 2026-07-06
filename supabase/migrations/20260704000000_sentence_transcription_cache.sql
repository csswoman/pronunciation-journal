create table if not exists public.sentence_transcription_cache (
  user_id uuid not null,
  cache_key text not null,
  mime_type text not null,
  transcript text not null,
  payload_size integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sentence_transcription_cache_pkey primary key (user_id, cache_key)
);

create index if not exists sentence_transcription_cache_user_updated_at_idx
  on public.sentence_transcription_cache (user_id, updated_at desc);

drop trigger if exists sentence_transcription_cache_updated_at on public.sentence_transcription_cache;
create trigger sentence_transcription_cache_updated_at
before update on public.sentence_transcription_cache
for each row execute function public.update_updated_at();

alter table public.sentence_transcription_cache enable row level security;

revoke all on table public.sentence_transcription_cache from anon, authenticated;
grant select, insert, update, delete on table public.sentence_transcription_cache to authenticated;
grant select, insert, update, delete on table public.sentence_transcription_cache to service_role;

create policy "users can read own sentence transcription cache"
  on public.sentence_transcription_cache
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert own sentence transcription cache"
  on public.sentence_transcription_cache
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update own sentence transcription cache"
  on public.sentence_transcription_cache
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own sentence transcription cache"
  on public.sentence_transcription_cache
  for delete
  to authenticated
  using (auth.uid() = user_id);
