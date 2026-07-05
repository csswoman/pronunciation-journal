# Plan 034: Fail word creation when deck linking fails

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm expected results. If a STOP condition
> occurs, stop and report.
>
> **Drift check (run first)**: `git diff --stat 51515e0..HEAD -- app/api/words/route.ts app/api/words/__tests__/route.test.ts lib/word-bank/jobs.ts`
> If in-scope files changed, compare the excerpts below against the live code.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `51515e0`, 2026-07-04

## Why this matters

`POST /api/words` can create a word and return `201` even if linking the word
to the requested deck fails. That leaves users with a word outside the deck
they selected, and the API response gives the client no way to recover. The
route should either confirm the full requested operation or return a controlled
error.

## Current state

- `app/api/words/route.ts` — authenticated word creation and retry endpoint.
- `app/api/words/__tests__/route.test.ts` — existing route tests with mocked guards and Supabase client.
- `lib/word-bank/jobs.ts` — enqueues the enrichment job after the word exists.

Relevant excerpt:

```ts
// app/api/words/route.ts:87
if (deckId) {
  const { data: deck } = await userClient
    .from("decks")
    .select("id")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .single();

  if (deck) {
    await userClient.from("word_bank_decks").insert({ word_id: word.id, deck_id: deckId });
  }
}
```

Repo convention: route inputs use `validateBody`, mutations return public
errors via `publicErrorResponse`, and internal errors are logged with
`redactError`. Keep that pattern.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm test -- app/api/words/__tests__/route.test.ts` | all tests pass |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `app/api/words/route.ts`
- `app/api/words/__tests__/route.test.ts`

**Out of scope**:
- Schema changes.
- Changing the API response shape for successful requests.
- Refactoring all word-bank routes.

## Git workflow

- Branch: `codex/034-harden-word-create-deck-linking`
- Commit message style: `fix(words): surface deck linking failures`
- Do not push unless instructed.

## Steps

### Step 1: Treat deck lookup and link insert failures explicitly

In `app/api/words/route.ts`, inspect both the deck lookup error and the
`word_bank_decks` insert error.

Recommended behavior:

- If a provided `deckId` does not resolve to a user-owned deck, return `404`
  with `publicErrorResponse(404, "Deck not found")`.
- If the deck exists but the link insert fails, log
  `[POST /api/words] deck link failed:` with `redactError(linkErr)` and return
  `publicErrorResponse(500, "Failed to add word to deck")`.

Do not enqueue the enrichment job after a failed requested deck link.

**Verify**: `pnpm type-check` -> exit 0.

### Step 2: Add regression tests

Extend `app/api/words/__tests__/route.test.ts` with cases for:

- Provided `deckId` does not belong to the user -> status `404`.
- `word_bank_decks.insert` returns an error -> status `500`.
- Successful `deckId` path still returns `201` and includes `jobId`.

Model the mock shape after the existing `returns 201 when a new word is created successfully` test, but make the chained `.from()` calls distinguish `word_bank`, `decks`, and `word_bank_decks`.

**Verify**: `pnpm test -- app/api/words/__tests__/route.test.ts` -> all tests pass.

### Step 3: Review partial-write behavior

This plan does not require rollback of the already-created word if linking
fails. If product semantics require all-or-nothing creation, stop and report
because that needs an RPC or transaction instead of route-side best effort.

**Verify**: no extra files changed except scope and `plans/README.md` if updated.

## Test plan

- Add tests for deck missing, deck link insert failure, and deck link success.
- Keep existing unauthorized, invalid input, and base creation tests passing.

## Done criteria

- [ ] `POST /api/words` does not return success when a requested deck link fails.
- [ ] Enrichment job is not enqueued after a failed deck link.
- [ ] Focused route tests pass.
- [ ] `pnpm type-check` exits 0.

## STOP conditions

Stop and report if:

- Supabase mocks become too brittle to express the route behavior cleanly.
- A transaction/RPC is required to satisfy product expectations.
- Existing clients rely on silent deck-link failure.

## Maintenance notes

If this endpoint later supports multiple deck links, keep the same contract:
requested links are part of the operation and must be confirmed or surfaced as
errors.
