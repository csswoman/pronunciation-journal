# Plan 044: Retire the inactive legacy audio-retention system without losing the remaining recording

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. This plan contains a production-data checkpoint that requires an
> explicit operator decision. Never delete a Storage object or discard its
> database reference without that decision. If anything in "STOP conditions"
> occurs, stop and report; do not improvise. When done, update this plan's row
> in `plans/README.md` unless a reviewer says they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 5cfb8dad..HEAD -- supabase/functions/cleanup-audio supabase/migrations lib/decks/queries.ts lib/decks/__tests__/queries.test.ts lib/supabase/types.ts scripts/audit-rls.mjs`
> If any in-scope file changed, compare the current-state facts below with the
> live code. Treat a material mismatch as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: none
- **Category**: migration / security / tech-debt
- **Planned at**: commit `5cfb8dad`, 2026-07-17

## Why this matters

The repository promises weekly deletion of persistent pronunciation audio, but
the production project does not deploy `cleanup-audio`, has neither `pg_cron`
nor `pg_net` enabled, and has no `cron.job` table. The dormant function also
uses obsolete `premium`-role logic and makes its shared secret optional while
creating a service-role client. Retiring the abandoned contract removes a
misleading privileged function and stale schema, but one production row still
contains an audio reference, so the cleanup must preserve or delete that
recording only after an explicit owner decision.

## Current state

- `supabase/functions/cleanup-audio/index.ts:23-40` exposes an Edge Function,
  optionally checks `CLEANUP_SECRET`, and then creates a service-role client.
- `supabase/functions/cleanup-audio/index.ts:49-63` selects old `entries` rows
  through `user_profiles`; lines 80-84 exempt `role = 'premium'` even though
  `supabase/migrations/20260623000000_remove_premium_set_admin_and_a1.sql`
  removed premium from app logic.
- `supabase/functions/cleanup-audio/index.ts:154-189` documents a cron only in
  comments. No migration contains `cron.schedule` for this function.
- `supabase/migrations/20260410120000_add_keep_permanent_to_entries.sql` added
  `keep_permanent` exclusively for this cleanup contract.
- `lib/decks/queries.ts:6-23` still projects both `keep_permanent` and
  `user_audio_url`; callers treat the returned object as `Tables<'entries'>`.
- `lib/decks/__tests__/queries.test.ts` asserts those obsolete columns in two
  explicit projections.
- `lib/supabase/types.ts` contains `keep_permanent` and `user_audio_url` in the
  generated `entries` Row/Insert/Update types.
- Production read-only verification on 2026-07-17 found: 62 `entries` rows,
  one non-null `user_audio_url`, that reference older than 30 days, no deployed
  `cleanup-audio` function, no `pg_cron`, no `pg_net`, and no cron schema.
- There are no tracked writers of `user_audio_url`. Current microphone flows
  use transient `MediaRecorder` data and do not persist it into `entries`.

Do not encode the remaining row ID, URL, user identity, or object path in this
plan, a migration, logs, tests, or a commit.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| CLI version | `pnpm exec supabase --version` | `2.107.0` or a newer compatible version |
| Create migration | `pnpm exec supabase migration new retire_legacy_audio_retention` | creates one timestamped SQL file |
| Migration safety | `pnpm check:migrations` | exit 0, no high-risk patterns |
| RLS audit | `pnpm audit:rls` | exit 0 |
| Focused tests | `pnpm test -- lib/decks/__tests__/queries.test.ts` | all tests pass |
| Typecheck | `pnpm type-check` | exit 0, no errors |
| Search | `git grep -n -I -E 'cleanup-audio|keep_permanent|user_audio_url' -- app components hooks lib supabase/functions` | no live-code matches after completion |

## Suggested executor toolkit

- Invoke the `supabase` skill if available. Follow its requirement to discover
  CLI commands with `--help`, generate migrations with `supabase migration new`,
  and verify live changes with read-only SQL.
- Current references: [Supabase Cron](https://supabase.com/docs/guides/cron)
  and [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions).
- Use Supabase MCP read-only tools for inventory. Do not use `apply_migration`
  while iterating and do not deploy an Edge Function in this plan.

## Scope

**In scope**:

- `supabase/functions/cleanup-audio/index.ts` — delete.
- One migration created by `pnpm exec supabase migration new retire_legacy_audio_retention`.
- `lib/decks/queries.ts`.
- `lib/decks/__tests__/queries.test.ts`.
- `lib/supabase/types.ts`, regenerated after the linked schema is updated or
  minimally edited to match the migration while preparing the change.
- `scripts/audit-rls.mjs` only if its legacy allowlist is intentionally cleaned
  up; do not rewrite historical migrations.
- Production read-only verification and the explicit operator checkpoint below.

**Out of scope**:

- Dropping or emptying the `audio` Storage bucket.
- Deleting `entries`, `decks`, `deck_entries`, or the normal `audio_url` field.
- Recreating `cleanup-audio`, enabling Cron, enabling `pg_net`, or adding Vault
  secrets.
- Editing historical migration files.
- Changing current transient speech-recognition or pronunciation-recording UI.
- Any work on `/api/words`, redirects, `/test`, or Reader.

## Git workflow

- Branch: `codex/044-retire-legacy-audio-retention`.
- Use conventional commits, for example
  `chore(storage): retire legacy persistent audio cleanup`.
- Do not push, deploy, apply the migration to production, or open a PR unless
  the operator explicitly requests it.

## Steps

### Step 1: Reconfirm production state without exposing user data

Use read-only Supabase queries/tools against the linked English Journal project:

```sql
select
  count(*)::int as total_entries,
  count(*) filter (where user_audio_url is not null)::int as audio_references,
  count(*) filter (
    where user_audio_url is not null
      and coalesce(updated_at, created_at) <= now() - interval '30 days'
  )::int as old_audio_references
from public.entries;

select
  to_regclass('cron.job') as cron_job_table,
  exists(select 1 from pg_extension where extname = 'pg_cron') as pg_cron_enabled,
  exists(select 1 from pg_extension where extname = 'pg_net') as pg_net_enabled;
```

Also list deployed Edge Functions and confirm `cleanup-audio` is absent. Record
only aggregate counts in the execution report.

**Verify**: results still show exactly one audio reference, no cron table, both
extensions disabled, and no deployed `cleanup-audio`. If any result differs,
STOP and report the drift.

### Step 2: Resolve the remaining recording through an operator checkpoint

Ask the operator to choose exactly one outcome after inspecting the recording
privately in Supabase Dashboard:

1. **Preserve**: download/export the object to an owner-approved location, verify
   the downloaded file opens, then remove the Storage object and clear the DB
   reference; or
2. **Delete**: remove the exact referenced Storage object and clear the exact
   row's `user_audio_url`.

The operator, not the executor, owns this destructive decision. Never infer
consent from the age of the file. Never delete the bucket. After the operator
has completed the action, rerun the aggregate query from Step 1.

**Verify**: `audio_references = 0`. If it remains nonzero, STOP; schema removal
must not proceed because it would destroy the last pointer to stored data.

### Step 3: Add the schema retirement migration

Run:

```powershell
pnpm exec supabase migration new retire_legacy_audio_retention
```

In the generated file, drop only the two obsolete `entries` columns:

```sql
alter table public.entries
  drop column if exists keep_permanent,
  drop column if exists user_audio_url;
```

Do not delete or rewrite the original migration that introduced
`keep_permanent`; migration history must remain append-only.

**Verify**: `pnpm check:migrations` and `pnpm audit:rls` both exit 0.

### Step 4: Remove obsolete application projections and types

- Remove `keep_permanent` and `user_audio_url` from `ENTRY_COLUMNS` in
  `lib/decks/queries.ts`.
- Update both projection expectations and fixtures in
  `lib/decks/__tests__/queries.test.ts`.
- Regenerate types from the schema after it is applied to the intended linked
  environment, or update only the `entries` Row/Insert/Update definitions to
  match the migration during code review. Do not modify unrelated generated
  type sections.
- Remove `supabase/functions/cleanup-audio/index.ts`.
- Leave the old migration in `scripts/audit-rls.mjs`'s legacy allowlist unless
  the script's documented purpose requires otherwise; historical presence is
  not a live dependency.

**Verify**:

```powershell
pnpm test -- lib/decks/__tests__/queries.test.ts
pnpm type-check
git grep -n -I -E 'cleanup-audio|keep_permanent|user_audio_url' -- app components hooks lib supabase/functions
```

Expected: focused tests and typecheck pass; the search returns no live-code
matches.

### Step 5: Apply and verify only when explicitly authorized

Do not apply production schema changes as an implicit implementation step.
When the operator explicitly authorizes deployment, apply the committed
migration through the project's normal Supabase workflow, regenerate
`lib/supabase/types.ts`, and run:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'entries'
  and column_name in ('keep_permanent', 'user_audio_url');
```

**Verify**: zero rows returned; deployed Edge Functions still do not include
`cleanup-audio`; `pg_cron` and `pg_net` remain unchanged.

## Test plan

- Update the two existing explicit-projection tests in
  `lib/decks/__tests__/queries.test.ts`; they must prove the retired columns are
  absent while all fields used by deck UI remain present.
- Run migration safety and RLS audits even though the migration drops columns
  rather than adding a table.
- Run the live aggregate query before and after the operator checkpoint.
- Do not add a destructive automated test against production Storage.

## Done criteria

- [ ] The owner explicitly chose preserve or delete for the remaining recording.
- [ ] Production has zero non-null `entries.user_audio_url` references before the column is dropped.
- [ ] `supabase/functions/cleanup-audio/index.ts` is deleted.
- [ ] A CLI-generated append-only migration drops only `keep_permanent` and `user_audio_url`.
- [ ] Deck projections, fixtures, and generated types no longer contain those columns.
- [ ] `pnpm check:migrations`, `pnpm audit:rls`, focused tests, and `pnpm type-check` all exit 0.
- [ ] No Storage bucket was dropped or bulk-deleted.
- [ ] No files outside the in-scope list changed, except `plans/README.md` status.

## STOP conditions

Stop and report instead of improvising if:

- The live project now deploys `cleanup-audio`, enables Cron/pg_net, or contains
  a matching scheduled job.
- More than one audio reference exists or a tracked writer of `user_audio_url`
  appears.
- The operator has not explicitly chosen preserve or delete.
- The referenced object cannot be downloaded when preservation was selected.
- Clearing the DB reference fails after Storage deletion.
- Dropping the columns breaks a consumer outside the two deck-query call sites.
- The migration appears to require deleting the `audio` bucket or unrelated data.
- A verification fails twice after a reasonable correction.

## Maintenance notes

- Future persistent recording work must define retention as a new product
  contract with explicit Storage ownership, deletion semantics, authorization,
  and observability; do not revive this function by copying it.
- Reviewers should scrutinize the production-data checkpoint and ensure no
  object path or user data leaked into git history.
- The historical add-column migration remains valid history even after a later
  migration drops the columns.
