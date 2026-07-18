-- Reconcile two long-standing drifts between the migration history and the remote
-- (production) project, discovered during RLS integration work on 2026-07-18:
--
--   1. public.deck_suggestions_cache exists on remote and is used by
--      /api/gemini/deck-suggest, but NO migration ever created it (created
--      out-of-band). A from-scratch build lacks it. This migration formalizes it
--      idempotently so local and remote converge.
--
--   2. public.user_sound_progress was meant to be dropped by
--      20260602100000_contrast_progress.sql, but that DROP never took effect on
--      remote: the table still exists there and handle_new_user() still seeds it on
--      signup. The app moved to the contrast-based model (user_contrast_progress),
--      so the table and its seeding are dead weight. This retires both.
--
-- Everything here is guarded (if exists / if not exists) so it is a no-op on the
-- side where the object is already in the target state.

-- 1. Formalize deck_suggestions_cache (schema mirrors the live remote table).
create table if not exists public.deck_suggestions_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  suggestions jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists deck_suggestions_cache_created_at_idx
  on public.deck_suggestions_cache (created_at);

alter table public.deck_suggestions_cache enable row level security;

-- Reads are open to any signed-in user; writes go through service_role only
-- (see setCached() in app/api/gemini/deck-suggest/route.ts), so no write policy.
drop policy if exists "authenticated can read cache" on public.deck_suggestions_cache;
create policy "authenticated can read cache"
  on public.deck_suggestions_cache
  for select
  to authenticated
  using (true);

grant select on public.deck_suggestions_cache to authenticated;

-- 2. Stop seeding user_sound_progress on signup. The remote copy of this function
--    still inserted into the table; replace it with the contrast-model version
--    (same as 20260623000000, restated so the fix actually reaches remote).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;

  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 3. Retire the legacy per-sound progress table (superseded by
--    user_contrast_progress). cascade removes its RLS policy and any grants.
drop table if exists public.user_sound_progress cascade;
