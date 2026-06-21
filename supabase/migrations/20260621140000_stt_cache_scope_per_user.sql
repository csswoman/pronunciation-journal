-- Scope STT cache entries to the authenticated user that created them.
--
-- Shared caching by raw audio hash makes transcripts and pronunciation targets
-- reusable across accounts. That is a privacy tradeoff, so the cache should be
-- isolated per user instead of globally content-addressed.

drop policy if exists "authenticated users can read stt cache"
  on public.stt_transcription_cache;
drop policy if exists "authenticated users can insert stt cache"
  on public.stt_transcription_cache;
drop policy if exists "authenticated users can update stt cache"
  on public.stt_transcription_cache;
drop policy if exists "authenticated users can delete stt cache"
  on public.stt_transcription_cache;

alter table public.stt_transcription_cache
  add column if not exists user_id uuid;

-- Existing shared cache entries are disposable; drop them instead of assigning
-- them to an arbitrary account during the privacy boundary change.
delete from public.stt_transcription_cache
where user_id is null;

alter table public.stt_transcription_cache
  alter column user_id set not null;

alter table public.stt_transcription_cache
  drop constraint if exists stt_transcription_cache_pkey;

alter table public.stt_transcription_cache
  add constraint stt_transcription_cache_pkey primary key (user_id, cache_key);

create index if not exists stt_transcription_cache_user_updated_at_idx
  on public.stt_transcription_cache (user_id, updated_at desc);

grant select, insert, update, delete on table public.stt_transcription_cache to authenticated;

create policy "users can read own stt cache"
  on public.stt_transcription_cache
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert own stt cache"
  on public.stt_transcription_cache
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update own stt cache"
  on public.stt_transcription_cache
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own stt cache"
  on public.stt_transcription_cache
  for delete
  to authenticated
  using (auth.uid() = user_id);
