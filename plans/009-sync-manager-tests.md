# Plan 009: Add pure-logic unit tests for the sync-manager outbox

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b543c9a..HEAD -- lib/sync/`
> If any sync file changed since this plan was written, read the current state
> before proceeding; treat significant structural changes as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-ci-gate-on-failures.md (green baseline)
- **Category**: tests
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

`lib/sync/sync-manager.ts` is the offline-first outbox: it guards all local
Dexie writes making it to Supabase. A regression in `isPermanentError`,
`enqueue`, or the retry-count logic would silently swallow user data.
Currently zero tests exist for this module. Adding a pure-logic suite (no
real DB, no real network) gives a regression net that any contributor can
run locally in milliseconds.

## Current state

Relevant files (read them before writing tests):
- `lib/sync/sync-manager.ts` — public exports `enqueue` and `flushOutbox`;
  internal helpers `isPermanentError` and `now`; constants `MAX_RETRIES = 3`,
  `FLUSH_BATCH_SIZE = 30`.
- `lib/sync/types.ts` — `SyncOutboxEntry`, `SyncFlushResult`, `SyncTable`,
  `SyncOperation`.
- No test file exists under `lib/sync/`.

Read `lib/sync/sync-manager.ts` fully before writing tests to understand what
is exportable/testable and what requires Dexie mocking.

## Test style model

Follow the style of `lib/daily/__tests__/streak.test.ts`:
- `import { describe, it, expect } from 'vitest'`
- No test framework setup beyond vitest
- Pure logic tests: no network, no real Dexie, mock with `vi.mock` where needed

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Type-check | `pnpm type-check` | exit 0, no errors |
| Tests | `pnpm test` | all pass, new tests included |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `lib/sync/__tests__/sync-manager.test.ts` — create this file

**Out of scope**:
- `lib/sync/sync-manager.ts` — read-only; do not modify
- `lib/sync/types.ts` — read-only
- Any other file

## Git workflow

- Branch: `advisor/009-sync-manager-tests`
- Commit: `test(sync): add unit tests for sync-manager outbox logic`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Read sync-manager source

Read `lib/sync/sync-manager.ts` in full. Identify:
1. Which functions are exported (public API to test)
2. Which internal helpers could be tested if exported or extracted
3. What Dexie tables the manager reads/writes (to know what to mock)

### Step 2: Write tests for `isPermanentError`

If `isPermanentError` is not exported, add `export` to it in `sync-manager.ts`
(this is an in-scope exception since it's a pure function that needs testing).

Test cases:
- RLS violation code → returns `true`
- `PGRST` constraint violation → returns `true`
- Network timeout / transient error → returns `false`
- `null` / `undefined` error → returns `false`

### Step 3: Write tests for `enqueue`

`enqueue` writes to `db.syncOutbox` (Dexie). Mock `db` from `@/lib/db` using
`vi.mock('@/lib/db', ...)`.

Test cases:
- Calling `enqueue('user_contrast_progress', 'upsert', { contrast_id: 'x' })` → calls `db.syncOutbox.add` with `status: 'pending'` and `retryCount: 0`
- The created entry has `createdAt` as a valid ISO string

### Step 4: Write tests for `flushOutbox` (happy path)

Mock both `db.syncOutbox` and the Supabase client from `@/lib/supabase/client`.

Test cases:
- Pending entries are fetched, sent, and marked `done`
- An entry that Supabase rejects with a transient error has `retryCount` incremented and stays `pending`
- An entry that Supabase rejects with a permanent error (RLS) is marked `failed`
- An entry with `retryCount >= MAX_RETRIES` is marked `failed` without sending

### Step 5: Run verification

```bash
pnpm type-check
pnpm test
pnpm lint
```

## Test plan

File to create: `lib/sync/__tests__/sync-manager.test.ts`

Minimum: at least 6 test cases covering the four areas above. The test count
in `pnpm test` output should increase by at least 6 vs. the pre-plan baseline.

## Done criteria

- [ ] `lib/sync/__tests__/sync-manager.test.ts` exists
- [ ] `pnpm test` passes with ≥ 6 new tests in the sync-manager suite
- [ ] `pnpm type-check` exits 0
- [ ] `pnpm lint` exits 0
- [ ] Only `lib/sync/__tests__/sync-manager.test.ts` (and optionally a one-line `export` change in `sync-manager.ts`) are modified

## STOP conditions

- `flushOutbox` is so deeply coupled to Dexie internals that mocking it without
  invasive changes would require refactoring beyond the scope of adding tests —
  STOP and describe the coupling in your report.
- `pnpm type-check` fails on the new test file with errors in Dexie mock types —
  STOP and report the exact error.
- The sync-manager has been substantially refactored since `b543c9a` and the
  current state differs significantly from the description above — STOP.

## Maintenance notes

- Any new sync-manager feature (new `SyncTable` value, new operation type) should
  be accompanied by a test in this file.
- The `isPermanentError` function is the most likely to need updates if
  Supabase error codes change — keep its tests exhaustive.
