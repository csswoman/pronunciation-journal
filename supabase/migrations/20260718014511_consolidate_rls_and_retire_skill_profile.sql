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

-- user_sound_progress was dropped in 20260602100000_contrast_progress.sql, so its
-- policies no longer exist and are not dropped here (they went with the table).

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
-- deck_suggestions_cache is not created by any migration (it exists only on the
-- remote project), so guard on its presence to keep a from-scratch build working.
do $$
begin
  if to_regclass('public.deck_suggestions_cache') is not null then
    execute 'drop policy if exists "authenticated can insert cache" on public.deck_suggestions_cache';
    execute 'revoke insert, update, delete on table public.deck_suggestions_cache from anon, authenticated';
    execute 'grant select on table public.deck_suggestions_cache to authenticated';
  end if;
end $$;
