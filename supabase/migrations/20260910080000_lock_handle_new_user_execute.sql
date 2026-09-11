-- handle_new_user() is a SECURITY DEFINER function wired only to the
-- on_auth_user_created trigger on auth.users. An old migration
-- (20260329230234_remote_schema.sql) left `GRANT ALL ... TO anon, authenticated`
-- on it, so it was also callable directly via /rest/v1/rpc/handle_new_user by
-- unauthenticated clients. The trigger runs as the table owner regardless of
-- these grants, so revoking EXECUTE from the API roles closes the RPC surface
-- without affecting sign-up.

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
-- service_role keeps EXECUTE for administrative/maintenance use.
grant execute on function public.handle_new_user() to service_role;
