# Plan 006: Route fire-and-forget SRS updates through the existing outbox

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b543c9a..HEAD -- lib/practice/queries.ts lib/sync/types.ts lib/word-bank/srs-queries.ts`
> If any of those files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (001 recommended first to establish green baseline)
- **Category**: bug
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

When a user answers a word-bank exercise, `savePracticeAnswer` in
`lib/practice/queries.ts` deliberately fires `reviewWordBankEntry(...)` without
awaiting it. If the Supabase write fails (network blip, expired token, RLS
denial), the error is only logged; the user's next review date and ease factor
silently roll back. Over time this corrupts the SM-2 schedule: words graded
hard resurface too soon; mastered words resurface unexpectedly.

A second fire-and-forget exists in `app/lexicon/[id]/practice/page.tsx` where
`applyPhase2Penalty` is called via `void Promise.allSettled(penalties)` with
no retry.

The fix routes both call sites through the existing Dexie outbox
(`lib/sync/sync-manager.ts`) so failed writes are retried on reconnection —
consistent with how `user_contrast_progress` updates are already handled.

## Current state

### Fire-and-forget site 1 — `lib/practice/queries.ts` (around line 65–71)

```ts
// Fire-and-forget SRS update for word_bank entries. Never blocks the caller.
if (answer.sourceRef?.source === 'word_bank') {
  const wordId = answer.sourceRef.id
  reviewWordBankEntry(userId, wordId, grade).catch((err: unknown) => {
    console.error('[practice/queries] reviewWordBankEntry failed', { wordId, grade, err })
  })
}
```

`reviewWordBankEntry` (in `lib/word-bank/srs-queries.ts`) fetches the current
row, computes SM-2, then updates the `word_bank` row. The function throws on
Supabase errors, which the `.catch` swallows.

### Fire-and-forget site 2 — `app/lexicon/[id]/practice/page.tsx` (around line 47–52)

```ts
const penalties = Array.from(forgotEntryMap.values()).map((entry) =>
  applyPhase2Penalty(user.id, entry.id, entry.ease_factor ?? 2.5)
)
void Promise.allSettled(penalties)
```

`applyPhase2Penalty` (in `lib/word-bank/srs-queries.ts`) issues a direct
`supabase.from('word_bank').update(...)` and throws on error. The
`void Promise.allSettled` discards all errors.

Before writing any code in this plan, read both files to verify the excerpts
above match the live code. If they don't match, STOP and report.

### Existing outbox pattern

- `lib/sync/types.ts` — defines `SyncTable` union. Currently does NOT include `'word_bank'`.
- `lib/sync/sync-manager.ts` — exports `enqueue(table, operation, payload, matchKey?)`.
  The outbox retries up to `MAX_RETRIES = 3`; permanent errors are marked
  `failed` and not retried.
- `lib/db/index.ts` — `db.syncOutbox` is the Dexie table (already exists).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Type-check | `pnpm type-check` | exit 0, no errors |
| Tests | `pnpm test` | all pass |
| Lint | `pnpm lint` | exit 0 |
| Design tokens | `pnpm lint:design-tokens` | exit 0 |

## Scope

**In scope**:
- `lib/sync/types.ts` — add `'word_bank'` to `SyncTable`
- `lib/word-bank/srs-queries.ts` — add new exported function `enqueueWordBankSRSUpdate`
- `lib/practice/queries.ts` — replace fire-and-forget block
- `app/lexicon/[id]/practice/page.tsx` — replace `void Promise.allSettled`

**Out of scope**:
- `lib/sync/sync-manager.ts` — the flush logic handles any table in `SyncTable`; no changes needed
- `lib/db/index.ts` — `syncOutbox` already exists
- `reviewWordBankEntry` and `applyPhase2Penalty` — keep them; they may have other callers

## Git workflow

- Branch: `advisor/006-srs-update-retry`
- Commit style: `fix(srs): route word_bank SRS updates through outbox for retry`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 0: Verify call-site scope

Before touching any file, run:
```bash
grep -rn "reviewWordBankEntry\|applyPhase2Penalty" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules
```

Note all callers. Only the two call sites listed in "Current state" are in
scope for this plan. If additional callers exist in other files, note them in
your report but do NOT change them — that is out of scope.

### Step 1: Add `word_bank` to `SyncTable`

In `lib/sync/types.ts`, extend the `SyncTable` union to include `'word_bank'`.

**Verify**: `pnpm type-check` → exit 0.

### Step 2: Add `enqueueWordBankSRSUpdate` to `lib/word-bank/srs-queries.ts`

Add the following exported function at the bottom of the file. Add
`import { enqueue } from '@/lib/sync/sync-manager'` at the top if not already
present.

```ts
/**
 * Fetch the current SRS state for a word_bank entry, compute SM-2, and enqueue
 * the update to the sync outbox. The write will be retried on reconnection if it
 * fails. Throws if the initial Supabase read fails.
 */
export async function enqueueWordBankSRSUpdate(
  userId: string,
  wordId: string,
  grade: number,
): Promise<void> {
  const db = supabase()  // use the same supabase() helper already in this file

  const { data, error: fetchError } = await db
    .from('word_bank')
    .select('ease_factor, interval_days, repetitions, next_review_at, srs_status, last_reviewed_at, review_count')
    .eq('id', wordId)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError

  // Use the same computeSM2 call pattern as reviewWordBankEntry
  const current = data.next_review_at || data.srs_status !== 'new'
    ? {
        ease_factor: data.ease_factor,
        interval_days: data.interval_days,
        repetitions: data.repetitions,
        next_review_at: data.next_review_at,
        status: data.srs_status,
        last_reviewed_at: data.last_reviewed_at,
      }
    : null

  const next = computeSM2(current, grade)

  await enqueue(
    'word_bank',
    'update',
    {
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      next_review_at: next.next_review_at,
      srs_status: next.status,
      last_reviewed_at: next.last_reviewed_at,
      review_count: (data.review_count ?? 0) + 1,
    },
    { id: wordId, user_id: userId },
  )
}
```

Note: check the actual function/type names in `lib/word-bank/srs-queries.ts`
(e.g. `supabase()` helper, `computeSM2` import, `SM2Progress` type) and adjust
to match. Do not invent names — use what already exists in the file.

**Verify**: `pnpm type-check` → exit 0.

### Step 3: Fix `lib/practice/queries.ts`

Replace the fire-and-forget block:

```ts
// Before:
// Fire-and-forget SRS update for word_bank entries. Never blocks the caller.
if (answer.sourceRef?.source === 'word_bank') {
  const wordId = answer.sourceRef.id
  reviewWordBankEntry(userId, wordId, grade).catch((err: unknown) => {
    console.error('[practice/queries] reviewWordBankEntry failed', { wordId, grade, err })
  })
}

// After:
if (answer.sourceRef?.source === 'word_bank') {
  const wordId = answer.sourceRef.id
  await enqueueWordBankSRSUpdate(userId, wordId, grade)
}
```

Add `import { enqueueWordBankSRSUpdate } from '@/lib/word-bank/srs-queries'`
at the top.

If `reviewWordBankEntry` is no longer used in this file, remove its import.

**Verify**: `pnpm type-check` → exit 0.

### Step 4: Fix `app/lexicon/[id]/practice/page.tsx`

Replace:
```ts
// Before:
const penalties = Array.from(forgotEntryMap.values()).map((entry) =>
  applyPhase2Penalty(user.id, entry.id, entry.ease_factor ?? 2.5)
)
void Promise.allSettled(penalties)

// After:
await Promise.all(
  Array.from(forgotEntryMap.values()).map((entry) =>
    enqueueWordBankSRSUpdate(user.id, entry.id, 1)  // grade 1 = lapse, equivalent to phase-2 penalty
  )
)
```

Add the import. Remove `applyPhase2Penalty` import if it is no longer used.

**Verify**: `pnpm type-check` → exit 0.

### Step 5: Full verification

```bash
pnpm type-check
pnpm test
pnpm lint:design-tokens
pnpm lint
```

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `grep "fire-and-forget\|void Promise.allSettled" lib/practice/queries.ts app/lexicon` returns 0 matches
- [ ] `grep "'word_bank'" lib/sync/types.ts` returns a match
- [ ] Only the four in-scope files are modified (`git diff --name-only`)

## STOP conditions

- Code excerpts in "Current state" don't match the live files — STOP and report the actual code.
- `pnpm type-check` fails after Step 1 due to unexpected typing constraints on `enqueue`.
- The grade value `1` for `applyPhase2Penalty` replacement causes a type-check error or materially wrong SM-2 result — check `lib/srs/compute.ts` and report.
- `reviewWordBankEntry` or `applyPhase2Penalty` has additional callers that also need migration — note them and STOP.

## Maintenance notes

- The outbox flush trigger already covers the new `word_bank` entries — no new wiring needed.
- `applyPhase2Penalty` and `reviewWordBankEntry` are kept; a future plan can audit remaining callers and decide whether to deprecate them.
- If RLS policies on `word_bank` are tightened to reject client-side updates, outbox entries will be permanently marked `failed` after 3 retries — this is correct behavior and will surface in monitoring.
