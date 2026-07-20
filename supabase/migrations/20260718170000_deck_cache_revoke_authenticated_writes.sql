-- Final drift cleanup for deck_suggestions_cache grants.
--
-- On a from-scratch build, `create table` inherits Supabase's default table
-- privileges (all DML granted to `authenticated`). Production only grants SELECT
-- to `authenticated` — deck-suggestion writes happen via service_role (see
-- setCached() in app/api/gemini/deck-suggest/route.ts) and the table's only RLS
-- policy is the read-only "authenticated can read cache". Revoke the write
-- privileges so local matches production. No-op on remote (already revoked).

revoke insert, update, delete on table public.deck_suggestions_cache from authenticated;
