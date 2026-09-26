-- Plan 041: content_bank_items inherits Supabase's default table privileges
-- (all DML granted to `authenticated`) on create. Only SELECT is intended for
-- `authenticated` (see content_bank_items_select_authenticated policy); writes
-- happen via service_role only (lib/content-bank/generate.ts). Revoke the
-- write privileges so grants match the RLS intent (defense in depth).

revoke insert, update, delete on table public.content_bank_items from authenticated;
