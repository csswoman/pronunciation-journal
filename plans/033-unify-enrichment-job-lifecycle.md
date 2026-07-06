# Plan 033: Unify enrichment job lifecycle updates

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> STOP condition occurs, stop and report instead of widening the change.
>
> **Drift check (run first)**: `git diff --stat 51515e0..HEAD -- app/api/jobs/drain-enrichment/route.ts lib/word-bank/job-runner.ts lib/word-bank/__tests__/job-runner.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `51515e0`, 2026-07-04

## Why this matters

The app has two paths that finish `word_enrichment_jobs`: the cron route and
the shared job runner. The cron route marks jobs as `succeeded` without clearing
`locked_at` and `locked_by`, while the runner clears those fields. That creates
confusing "successful but still locked" rows and makes future retry or
observability logic depend on which worker processed the job.

## Current state

- `app/api/jobs/drain-enrichment/route.ts` — Vercel cron endpoint that claims and processes a small batch.
- `lib/word-bank/job-runner.ts` — shared durable job processor with cleaner lifecycle semantics.
- `lib/word-bank/__tests__/job-runner.test.ts` — existing test file for retry planning logic.

Relevant excerpts:

```ts
// app/api/jobs/drain-enrichment/route.ts:70
await supabase
  .from("word_enrichment_jobs")
  .update({ status: "succeeded", updated_at: new Date().toISOString() })
  .eq("id", job.id);
```

```ts
// lib/word-bank/job-runner.ts:127
await supabase
  .from("word_enrichment_jobs")
  .update({ status: "succeeded", locked_at: null, locked_by: null, last_error: null })
  .eq("id", job.id);
```

Repo convention: keep Supabase route errors public and log redacted internal
details. For examples, see `app/api/jobs/drain-enrichment/route.ts` and
`lib/api/guards.ts`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Tests | `pnpm test -- lib/word-bank/__tests__/job-runner.test.ts` | all tests pass |
| Route tests | `pnpm test -- app/api/jobs` | all matching tests pass, or no matching files if none exist |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `app/api/jobs/drain-enrichment/route.ts`
- `lib/word-bank/job-runner.ts`
- `lib/word-bank/__tests__/job-runner.test.ts`
- Optional new test file under `app/api/jobs/drain-enrichment/__tests__/`

**Out of scope**:
- Database migrations.
- Changing the `claim_enrichment_jobs` RPC contract.
- Changing retry limits unless required by an existing test.

## Git workflow

- Branch: `codex/033-unify-enrichment-job-lifecycle`
- Commit message style: match recent imperative/conventional style, e.g. `fix(jobs): clear locks on successful enrichment`
- Do not push unless instructed.

## Steps

### Step 1: Make successful cron completion clear lock fields

Update `app/api/jobs/drain-enrichment/route.ts` so the success update mirrors
the runner's completed state:

- `status: "succeeded"`
- `locked_at: null`
- `locked_by: null`
- `last_error: null`
- `updated_at: new Date().toISOString()`

Keep the response shape unchanged.

**Verify**: `pnpm type-check` -> exit 0.

### Step 2: Add a regression test for completed-job cleanup

Prefer a small unit test around a pure helper if you extract one. If you keep
the route inline, add a route-level test under
`app/api/jobs/drain-enrichment/__tests__/route.test.ts` that mocks Supabase and
asserts the success update includes `locked_at: null` and `locked_by: null`.

Use existing route-test style from `app/api/health/ready/__tests__/route.test.ts`.

**Verify**: `pnpm test -- app/api/jobs/drain-enrichment` -> new test passes.

### Step 3: Check for lifecycle divergence

Search for other `word_enrichment_jobs` success updates and confirm each clears
locks or delegates to the same helper.

**Verify**: `Get-ChildItem app,lib -Recurse -File | Select-String -Pattern 'status: "succeeded"'` -> every `word_enrichment_jobs` success path has lock cleanup.

## Test plan

- Add a regression test for the cron success path.
- Keep existing `buildEnrichmentFailurePlan` tests passing.
- Run `pnpm test -- lib/word-bank/__tests__/job-runner.test.ts`.

## Done criteria

- [ ] Cron success updates clear `locked_at`, `locked_by`, and `last_error`.
- [ ] A test fails on the old behavior and passes on the new behavior.
- [ ] `pnpm type-check` exits 0.
- [ ] Relevant tests exit 0.
- [ ] No files outside scope are modified except `plans/README.md` status if the executor updates it.

## STOP conditions

Stop and report if:

- `claim_enrichment_jobs` does not return `locked_at` / `locked_by` compatible rows anymore.
- The fix requires changing database functions or migrations.
- Tests reveal a different consumer intentionally relies on succeeded jobs retaining lock fields.

## Maintenance notes

Future job workers should share one lifecycle helper if this code grows again.
Reviewers should look specifically for divergent state transitions between the
cron route and `processWordEnrichmentJobs`.
