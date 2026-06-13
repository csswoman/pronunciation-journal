# Plan 007: Fix STT transcription cache RLS so L2 cache reads and writes succeed

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b543c9a..HEAD -- supabase/migrations/20260409093000_add_stt_transcription_cache.sql app/api/gemini/transcribe/route.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug / perf
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

The `stt_transcription_cache` table has RLS enabled but zero RLS policies, and
the `authenticated` role grants were explicitly revoked in the original migration.
The route uses `createSupabaseServerClient()` (session/anon-key client, subject
to RLS) for both the L2 cache read and write. Every cache read returns `null`
silently (the error is swallowed at route line 149), and every write is a silent
no-op (swallowed in the `setL2Cache` catch). The result: every pronunciation
attempt re-calls Gemini even when the exact same audio was transcribed moments
ago, wasting API quota and adding roughly 500 ms latency per repeat attempt.

## Current state

**Migration that created the table** (`supabase/migrations/20260409093000_add_stt_transcription_cache.sql`, lines 20-23):

```sql
alter table public.stt_transcription_cache enable row level security;

revoke all on table public.stt_transcription_cache from anon, authenticated;
grant select, insert, update, delete on table public.stt_transcription_cache to service_role;
```

No `CREATE POLICY` statement anywhere in the file. RLS is on, zero policies,
`authenticated` grant revoked — authenticated clients cannot access the table.

**Table schema** (no `user_id` column; content-addressed by audio SHA-256):

```
cache_key    text primary key
target_word  text
mime_type    text not null
transcript   text not null
payload_size integer not null default 0
hit_count    integer not null default 0
created_at   timestamptz not null default now()
updated_at   timestamptz not null default now()
```

**Route that uses the cache** (`app/api/gemini/transcribe/route.ts`):

- `const SUPABASE_STT_CACHE_TABLE = "stt_transcription_cache";` (line 59)
- `getL2Cached` (lines 138-161): uses `createSupabaseServerClient()` (session client, RLS enforced). Error at line 149 is silently swallowed: `if (error || !data) return null;`
- `setL2Cache` (lines 163-187): also uses `createSupabaseServerClient()`. Entire catch block silently ignores write failures: `// Cache write is non-critical; ignore failures silently`

Both functions swallow errors, so RLS denials are invisible — the route appears
to work but always misses the L2 cache.

**RLS policy style convention**: see `supabase/migrations/20260610150000_user_learning_state.sql`.
For tables without a `user_id` column, use `auth.uid() is not null` to allow
any authenticated user.

## Commands you will need

| Purpose         | Command            | Expected on success |
|-----------------|--------------------|---------------------|
| Type-check      | `pnpm type-check`  | exit 0, no errors   |
| Lint            | `pnpm lint`        | exit 0              |
| Apply migration | `supabase db push` | exit 0              |

Verify-policies SQL (run via `supabase db execute` or Supabase Studio):
```sql
select policyname, cmd, qual
from pg_policies
where tablename = 'stt_transcription_cache';
```
Expected: 3 rows.

Verify-grants SQL:
```sql
select grantee, privilege_type
from information_schema.role_table_grants
where table_name = 'stt_transcription_cache'
  and grantee = 'authenticated';
```
Expected: rows covering SELECT, INSERT, UPDATE.

## Scope

**In scope** (only file to create):
- `supabase/migrations/20260611000000_fix_stt_cache_rls.sql` (new file)

**Out of scope** (do NOT touch):
- `app/api/gemini/transcribe/route.ts` — silent error-swallowing in `getL2Cached`/`setL2Cache` is intentional; cache failures must never break transcription.
- `supabase/migrations/20260409093000_add_stt_transcription_cache.sql` — never edit existing migrations; only add new ones.

## Git workflow

- Branch: `advisor/007-fix-stt-cache-rls`
- Commit message: `fix(db): add RLS policies and restore authenticated grants on stt_transcription_cache`
- Do NOT push or open a PR unless the operator instructs it.

## Steps

### Step 1: Create the remediation migration

Create `supabase/migrations/20260611000000_fix_stt_cache_rls.sql` with this content:

```sql
-- Restore SELECT / INSERT / UPDATE grants for the authenticated role.
-- The original migration revoked all grants; the transcribe route uses a
-- session client (authenticated role) so it could never read or write the cache.
grant select, insert, update on table public.stt_transcription_cache to authenticated;

-- Allow any authenticated user to read any cache row.
-- The cache is content-addressed (SHA-256 of audio payload); there is no
-- user_id column and no per-user isolation is needed.
create policy "stt_cache_select"
  on public.stt_transcription_cache for select
  to authenticated
  using (auth.uid() is not null);

-- Allow any authenticated user to insert new cache entries.
create policy "stt_cache_insert"
  on public.stt_transcription_cache for insert
  to authenticated
  with check (auth.uid() is not null);

-- Allow any authenticated user to update (upsert) existing cache entries.
create policy "stt_cache_update"
  on public.stt_transcription_cache for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
```

**Verify**: `ls supabase/migrations/20260611000000_fix_stt_cache_rls.sql` — file is present.

### Step 2: Apply the migration

Run `supabase db push`.

**Verify policies** (run SQL above): 3 rows — `stt_cache_select` (SELECT),
`stt_cache_insert` (INSERT), `stt_cache_update` (UPDATE).

**Verify grants** (run SQL above): at least 3 rows covering SELECT, INSERT, UPDATE
for `grantee = authenticated`.

### Step 3: Verify no TypeScript or lint regressions

**Verify**: `pnpm type-check` exits 0.
**Verify**: `pnpm lint` exits 0.

## Test plan

No automated test file required. Manual verification:

1. Log in as an authenticated user and trigger a pronunciation exercise that
   POSTs to `/api/gemini/transcribe`.
2. The first call should NOT have `"cached": true` (Gemini is called, no L1 or L2 hit).
3. Restart the Next.js dev server (clears L1 in-memory cache) and repeat with
   the exact same audio. The response should contain `"cached": true, "source": "supabase"`.
4. Confirm rows are written:
   ```sql
   select cache_key, transcript, created_at
   from public.stt_transcription_cache
   limit 5;
   ```
   Before this fix the table is always empty despite write attempts.

## Done criteria

- [ ] `supabase/migrations/20260611000000_fix_stt_cache_rls.sql` exists
- [ ] `select count(*) from pg_policies where tablename = 'stt_transcription_cache'` returns 3
- [ ] `select count(*) from information_schema.role_table_grants where table_name = 'stt_transcription_cache' and grantee = 'authenticated'` returns >= 3
- [ ] A repeat transcription of the same audio (after server restart to clear L1) returns `{ "cached": true, "source": "supabase" }`
- [ ] `pnpm type-check` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `plans/README.md` status row for 007 updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- The migration `20260409093000_add_stt_transcription_cache.sql` no longer contains the `revoke all ... from anon, authenticated` line — the grant may have already been restored elsewhere; verify via `information_schema.role_table_grants` before adding a duplicate.
- `supabase db push` fails with a policy-already-exists error — check `pg_policies` and report.
- A step verification fails twice after a reasonable fix attempt.
- The table now has a `user_id` column (schema drifted since this plan was written) — the policy predicate `auth.uid() is not null` would be wrong; use `auth.uid() = user_id` instead, or report back.

## Maintenance notes

- If a `user_id` column is later added to attribute cache entries to specific users, tighten the policies from `auth.uid() is not null` to `auth.uid() = user_id`.
- The `hit_count` column exists but is never incremented. A future improvement could track cache utilisation — out of scope here.
- The silent error-swallowing in `getL2Cached`/`setL2Cache` is intentional. After this fix the errors stop occurring, but the defensive pattern should remain in place.
