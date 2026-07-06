# Plan 035: Confirm word image database updates

> **Executor instructions**: Follow this plan step by step and run each
> verification command. Stop on any STOP condition.
>
> **Drift check (run first)**: `git diff --stat 51515e0..HEAD -- app/api/gemini/word-image/route.ts`
> If this file changed, compare the excerpts below against live code first.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `51515e0`, 2026-07-04

## Why this matters

The word-image route uploads or removes a Storage object and then updates the
`entries` row. Today it ignores errors from the database update, so clients can
receive `200` while the database still points at the old image or no image.
That is a user-visible consistency bug.

## Current state

- `app/api/gemini/word-image/route.ts` — handles image upload and deletion for entries.

Relevant excerpts:

```ts
// app/api/gemini/word-image/route.ts:59
await supabase
  .from("entries")
  .update({ image_url: imageUrl })
  .eq("id", entryId)
  .eq("user_id", user.id);
```

```ts
// app/api/gemini/word-image/route.ts:103
await supabase.from("entries").update({ image_url: null }).eq("id", entryId).eq("user_id", user.id);
```

Repo convention: use `publicErrorResponse` for public failures and
`redactError` when logging Supabase or provider errors.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm test -- app/api/gemini/word-image` | all matching tests pass, or add focused tests and pass |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `app/api/gemini/word-image/route.ts`
- Optional new test file under `app/api/gemini/word-image/__tests__/route.test.ts`

**Out of scope**:
- Changing bucket permissions.
- Moving images between buckets.
- Changing the public response shape for successful requests.

## Git workflow

- Branch: `codex/035-harden-word-image-persistence`
- Commit message style: `fix(gemini): check word image persistence errors`
- Do not push unless instructed.

## Steps

### Step 1: Check upload metadata update errors

Capture the result of the `entries.update({ image_url: imageUrl })` call.
If it returns an error, log it with `redactError` and return
`publicErrorResponse(500, "Failed to save image metadata")`.

Do not return `{ imageUrl }` unless the row update succeeded.

**Verify**: `pnpm type-check` -> exit 0.

### Step 2: Check delete metadata update errors

Capture the result of the `entries.update({ image_url: null })` call. If it
fails, log it with `redactError` and return
`publicErrorResponse(500, "Failed to remove image metadata")`.

Keep Storage removal best-effort unless a product owner says deletion must be
atomic. The route cannot make Storage and Postgres transactional.

**Verify**: `pnpm type-check` -> exit 0.

### Step 3: Add route tests for metadata failures

Create focused tests for:

- Upload succeeds but `entries.update` fails -> status `500`.
- Delete Storage removal succeeds but `entries.update` fails -> status `500`.
- Existing happy paths still return `200`.

Mock `createSupabaseServerClient`, `requireUser`, `requireSameOrigin`, and
`rateLimit` following the style in `app/api/gemini/transcribe/__tests__/route.test.ts`.

**Verify**: `pnpm test -- app/api/gemini/word-image` -> tests pass.

## Test plan

- Add route-level tests for upload metadata failure and delete metadata failure.
- Run `pnpm type-check`.

## Done criteria

- [ ] Upload path checks the `entries` update result.
- [ ] Delete path checks the `entries` update result.
- [ ] Failure responses are public and do not expose raw Supabase details.
- [ ] Focused tests cover both regressions.

## STOP conditions

Stop and report if:

- Storage cleanup after metadata failure must be all-or-nothing; that needs a broader design.
- Existing tests reveal clients depend on `200` despite metadata failure.
- The bucket path parsing in DELETE proves incorrect and fixing it expands scope.

## Maintenance notes

Reviewers should check that this route does not claim success until the source
of truth (`entries.image_url`) changed. Future image workflows should document
which side, Storage or database, owns rollback behavior.
