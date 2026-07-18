-- The legacy aggregate was not called by the application and exposed arbitrary
-- user progress through a SECURITY DEFINER function.
drop function if exists public.get_skill_profile(uuid);

-- Keep the authenticated, ownership-scoped ALL policies and remove equivalent
-- policies inherited from the initial schema dump.
drop policy if exists "Users can insert own history" on public.answer_history;
drop policy if exists "Users can view own history" on public.answer_history;

drop policy if exists "entries_delete_own" on public.entries;
drop policy if exists "entries_insert_own" on public.entries;
drop policy if exists "entries_select_own" on public.entries;
drop policy if exists "entries_update_own" on public.entries;

drop policy if exists "Users can insert own progress" on public.user_sound_progress;
drop policy if exists "Users can view own progress" on public.user_sound_progress;
drop policy if exists "Users can update own progress" on public.user_sound_progress;

-- user_profiles has separate operation policies. Retain the stricter
-- authenticated SELECT/UPDATE policies and recreate INSERT with an explicit role.
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "Users can view own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;

create policy "Users can insert own profile"
on public.user_profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

-- The current per-user STT policies supersede two generations of global cache
-- policies that allowed every authenticated user to read or mutate every row.
drop policy if exists "authenticated users can delete stt cache" on public.stt_transcription_cache;
drop policy if exists "authenticated users can insert stt cache" on public.stt_transcription_cache;
drop policy if exists "authenticated users can read stt cache" on public.stt_transcription_cache;
drop policy if exists "authenticated users can update stt cache" on public.stt_transcription_cache;
drop policy if exists "stt_cache_delete" on public.stt_transcription_cache;
drop policy if exists "stt_cache_insert" on public.stt_transcription_cache;
drop policy if exists "stt_cache_select" on public.stt_transcription_cache;
drop policy if exists "stt_cache_update" on public.stt_transcription_cache;

-- Deck suggestions are shared cache data. Reads remain available to signed-in
-- users, but writes are restricted to the server-side service-role client.
drop policy if exists "authenticated can insert cache" on public.deck_suggestions_cache;
revoke insert, update, delete on table public.deck_suggestions_cache from anon, authenticated;
grant select on table public.deck_suggestions_cache to authenticated;
