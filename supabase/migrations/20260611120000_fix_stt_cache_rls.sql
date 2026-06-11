-- Fix RLS policies for stt_transcription_cache.
--
-- The table was created with RLS enabled but only service_role access granted.
-- The transcribe route uses the user session client (authenticated role), so
-- both L2 cache reads and writes were silently blocked, causing every request
-- to fall through to the live Gemini API even when a cached result existed.
--
-- The cache has no user_id column — it is a shared, content-addressed store
-- (cache_key is a SHA-256 of the audio payload). Any authenticated user should
-- be able to read and write cache entries.

-- Grant table-level permissions to the authenticated role.
grant select, insert, update, delete on table public.stt_transcription_cache to authenticated;

-- RLS policy: any authenticated user can read any cache entry.
create policy "authenticated users can read stt cache"
  on public.stt_transcription_cache
  for select
  to authenticated
  using (true);

-- RLS policy: any authenticated user can insert new cache entries.
create policy "authenticated users can insert stt cache"
  on public.stt_transcription_cache
  for insert
  to authenticated
  with check (true);

-- RLS policy: any authenticated user can update existing cache entries (upsert).
create policy "authenticated users can update stt cache"
  on public.stt_transcription_cache
  for update
  to authenticated
  using (true)
  with check (true);

-- RLS policy: any authenticated user can delete stale cache entries.
-- (The route deletes expired entries it encounters during reads.)
create policy "authenticated users can delete stt cache"
  on public.stt_transcription_cache
  for delete
  to authenticated
  using (true);
