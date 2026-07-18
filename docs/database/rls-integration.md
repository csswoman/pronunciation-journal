# RLS Integration Check

Last attempt: 2026-07-18 — **PASSED** against Supabase local.

## Command

```bash
pnpm test:rls:integration
```

The script creates two temporary Supabase Auth users, signs in with real
authenticated JWTs, writes private rows, verifies cross-user isolation, and
deletes the temporary users and rows in `finally`.

Required environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The script can run against Supabase local or an isolated staging project. Do
not run it against production. The runner creates temporary users and rows.

## 2026-07-18 Result — PASSED (local)

`pnpm test:rls:integration` passed against the local stack (`pnpm exec supabase start`)
using the local API URL, anon key and service-role key. Getting there surfaced and
fixed real bugs:

### Migration history could not rebuild from scratch

`20260602100000_contrast_progress.sql` drops `user_sound_progress` (replaced by
`user_contrast_progress`), but three later migrations still referenced the dropped
table, so a from-scratch build (local, CI, preview branches, this runner) failed:

- `20260610120000_general_american_accent.sql`: removed the dead
  `DELETE FROM public.user_sound_progress` statements (rows were already gone via the
  earlier `DROP ... CASCADE`).
- `20260623000000_remove_premium_set_admin_and_a1.sql`: `handle_new_user()` inserted
  into the dropped table on every signup (a latent production signup bug); it now only
  creates `user_profiles` (contrast progress is created lazily during practice).
- `20260718014511_consolidate_rls_and_retire_skill_profile.sql`: dropped policies on
  the dropped `user_sound_progress`, and dropped/altered `public.deck_suggestions_cache`
  which no migration creates (it exists only on remote). The former was removed; the
  latter is now guarded with `to_regclass(...)` so it runs on remote and no-ops locally.

### text_fragments RLS infinite recursion

The `FOR ALL` policy "Manage own fragments" counted rows in `public.text_fragments`
inside its own `WITH CHECK`, so INSERT aborted with
`infinite recursion detected in policy for relation "text_fragments"`.
`20260718120000_fix_text_fragments_rls_recursion.sql` keeps ownership in the policy
(`user_id = auth.uid()`) and moves the per-user cap (max 10, admins exempt) into a
`SECURITY DEFINER` function (`public.text_fragments_within_limit()`) that counts
without re-triggering RLS.

### Local environment notes (Docker Desktop on Windows/WSL2)

- Docker Desktop's **containerd image store** (`UseContainerdSnapshotter`) served
  arm64-behaving layers for several supabase images while reporting `amd64`, causing
  `exec /...: exec format error` on `realtime`, `edge_runtime`, `pg_meta`, etc. Fix:
  disable the containerd image store (revert to `overlay2`) and re-pull.
- After `supabase db reset`, restart Kong (`docker restart supabase_kong_...`) if the
  gateway returns `502` for `/auth/v1/*` — it can hold a stale IP for the restarted
  auth container.

## 2026-07-18 Drift cleanup (migration 20260718150000)

Applied `20260718150000_retire_user_sound_progress_formalize_deck_cache.sql` to
production (`supabase db push`), idempotent so it also rebuilds from scratch:

- **Formalized `deck_suggestions_cache`** — it existed only on remote (created
  out-of-band) yet is used by `/api/gemini/deck-suggest`. Now created via
  `create table if not exists` with the read-only `authenticated can read cache`
  policy (writes stay service_role-only). Remote push logged
  `relation already exists, skipping` (as expected).
- **Retired `user_sound_progress`** — dropped the legacy per-sound table (superseded
  by `user_contrast_progress`) and restated `handle_new_user()` so it no longer
  seeds it on signup. Verified on remote: table gone, function clean, cache intact.
- **Types:** `lib/supabase/types.ts` already had `deck_suggestions_cache` and never
  referenced `user_sound_progress`, so no regeneration was needed for this change.

## 2026-07-18 Remote reconciliation

Inspected the linked production project (read-only via MCP) and reconciled the
text_fragments fix:

- **Migration versions are aligned** local vs remote; only the new
  `20260718120000_fix_text_fragments_rls_recursion.sql` was pending. It was pushed
  to production (`supabase db push`) and verified: the policy now reads
  `((user_id = auth.uid()) AND text_fragments_within_limit())` with the
  `SECURITY DEFINER` helper present. The recursion is fixed in production too.
- **Content drift found (not broken, but worth cleaning up later):** on remote,
  `user_sound_progress` STILL exists (the `DROP ... CASCADE` in
  `20260602100000_contrast_progress.sql` never took effect there), and
  `handle_new_user()` still seeds it on signup. So signups are NOT broken on remote
  (unlike a from-scratch build). The local schema, by contrast, no longer has the
  table. `deck_suggestions_cache` also exists on remote but is created by no
  migration. Consider a future migration to retire `user_sound_progress` on remote
  (drop table + stop seeding it in `handle_new_user`) — destructive, needs sign-off.
- **Security advisors (mostly pre-existing / by design):** anonymous-access policies
  on ~25 tables (app supports anonymous sign-in), `set_updated_at` /
  `update_updated_at` without a fixed `search_path`, public buckets allowing listing,
  and leaked-password protection disabled. `text_fragments_within_limit()` is flagged
  as an authenticated-callable `SECURITY DEFINER` RPC; it only returns the caller's
  own limit boolean (low risk). Moving RLS helpers to a non-exposed schema would clear
  that specific lint.

## 2026-07-17 Environment Check

The linked remote migration history is aligned, but the integration runner was
not pointed at that database because it is the production project. The local
check could not start because Docker Desktop/the Docker daemon was unavailable,
and no isolated staging credentials are configured on this workstation.

This is an environment blocker, not a passing RLS result.

## Historical 2026-07-05 Result

The check failed against the currently linked remote project:

```text
RLS integration checks failed: user B can read user A STT cache
```

At that time, `supabase migration list` showed the linked remote database had not applied
many local migrations from `20260610120000` onward, including
`20260621140000_stt_cache_scope_per_user.sql`, which scopes
`stt_transcription_cache` by `user_id` and adds authenticated-user policies.

## Next Step

Start Docker Desktop and run `pnpm exec supabase start`, then export the local
API URL, anon key and service-role key before running
`pnpm test:rls:integration`. An isolated staging project is also valid. Never
fall back to the linked production project when the local stack is unavailable.
