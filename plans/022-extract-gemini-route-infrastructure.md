# Plan 022: Extract shared Gemini route infrastructure for fallback, validation, limits, and errors

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 0e25aca..HEAD -- app/api/gemini lib/api lib/ai-prompts.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/019-reconcile-ci-gates.md
- **Category**: tech-debt
- **Planned at**: commit `0e25aca`, 2026-06-21

## Why this matters

The app has several Gemini endpoints, and each endpoint currently owns pieces of
model fallback, error classification, rate limiting, schema validation, and
response shaping. That repetition makes future AI features risky because fixes
must be copied across routes. This plan extracts shared infrastructure without
changing endpoint behavior.

## Current state

- Main chat route handles auth, rate limit, body validation, prompt
  authorization, fallback, stream handling, and non-stream handling in one file:

```ts
# app/api/gemini/route.ts:268-280
export async function POST(request: NextRequest): Promise<Response> {
  // 1. Auth — reject before touching the body
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  // 2. Rate limit — 15 req/min per user, keyed per endpoint so routes are independent
  const { limited, error: rateLimitError } = rateLimit(`/api/gemini:${user.id}`, {
```

- Transcription route duplicates fallback/error logic:

```ts
# app/api/gemini/transcribe/route.ts:82-97
function shouldTryNextModel(err: unknown): boolean {
  const status = getErrorStatus(err);
  if (status === 400 || status === 401 || status === 403) return false;
  if (status === 404 || status === 408 || status === 409 || status === 425 || status === 429) return true;
```

- Transcription route builds inline prompt text:

```ts
# app/api/gemini/transcribe/route.ts:200-202
const prompt = targetWord
  ? `Transcribe this short English pronunciation attempt. Target word: "${targetWord}". Return ONLY the recognized words in plain text. If unintelligible, return an empty string.`
  : "Transcribe this short English pronunciation attempt. Return ONLY the recognized words in plain text. If unintelligible, return an empty string.";
```

- Repo rule from `CLAUDE.md`: all Gemini calls should go through `/api/gemini/*`
  and all prompt strings should live in `lib/ai-prompts.ts`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Gemini route tests | `pnpm test -- app/api/gemini lib/api` | relevant tests pass |
| Full tests | `pnpm test` | all tests pass |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:

- `app/api/gemini/route.ts`
- `app/api/gemini/transcribe/route.ts`
- Other `app/api/gemini/*/route.ts` only if they share the exact helper pattern
- New helper files under `lib/api/` or `lib/gemini/`
- `lib/ai-prompts.ts`
- Tests under existing `app/api/gemini/**/__tests__` or new focused helper tests
- `plans/README.md`

**Out of scope**:

- Do not change prompt behavior except moving inline prompt strings.
- Do not change model names or fallback order.
- Do not change rate-limit thresholds.
- Do not add new AI features.
- Do not modify Supabase schema.

## Git workflow

- Branch: `codex/022-extract-gemini-route-infrastructure`
- Commit message: `refactor(gemini): share route fallback helpers`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Extract model fallback constants and retry classifier

Create a helper such as `lib/gemini/fallback.ts` containing:

- `ENABLE_PREVIEW_MODELS`
- `BASE_MODELS`
- `PREVIEW_MODELS`
- `FALLBACK_MODELS`
- `getErrorStatus`
- `shouldTryNextModel`

Move code without changing behavior.

**Verify**: add `lib/gemini/__tests__/fallback.test.ts` covering 400/401/403 no
retry, 429 retry, 500 retry, and quota/rate message retry.

### Step 2: Extract route guard wrapper only where it reduces duplication

If at least two routes share the same pattern, add a small helper that performs:

- `requireUser`
- `rateLimit`
- `validateBody`
- missing `GEMINI_API_KEY` response

Keep it generic and typed; avoid a large framework. If extraction makes types
messier than the current code, skip this step and document why in the final
report.

**Verify**: existing route tests still pass.

### Step 3: Move inline transcription prompt to `lib/ai-prompts.ts`

Add a function such as:

```ts
export function buildTranscriptionPrompt(targetWord?: string): string
```

Use it from `app/api/gemini/transcribe/route.ts`.

**Verify**: add a small test for prompt output if `lib/ai-prompts.ts` already
has tests; otherwise rely on typecheck and route tests.

### Step 4: Apply helpers to two highest-value routes

Refactor only:

- `app/api/gemini/route.ts`
- `app/api/gemini/transcribe/route.ts`

Do not sweep every Gemini route in one pass unless the helper is trivial to
apply. Preserve response shapes and status codes.

**Verify**:

- `pnpm test -- app/api/gemini`
- `pnpm type-check`

### Step 5: Document the route pattern

Add a short section to `ENGINEERING_STANDARDS.md` or `docs/architecture/ai.md`
if it exists:

- new Gemini endpoints must use shared fallback helpers;
- prompt strings live in `lib/ai-prompts.ts`;
- endpoint-specific rate limits stay in the route unless promoted deliberately.

**Verify**: `pnpm lint` -> exit 0.

## Test plan

Add tests for the fallback helper. Run existing Gemini route tests, especially:

- `app/api/gemini/generate-reader/__tests__/route.test.ts`

If `app/api/gemini/route.ts` has no test, do not build a full route test in this
plan unless extraction changes behavior. Prefer helper tests.

## Done criteria

- [ ] Shared fallback model constants and retry classifier exist.
- [ ] At least main chat and transcription routes use the shared fallback
  helper.
- [ ] Transcription prompt text is no longer inline in the route.
- [ ] Route behavior and response shapes are unchanged.
- [ ] Tests cover retry classification.
- [ ] `pnpm type-check`, `pnpm test`, and `pnpm lint` exit 0.

## STOP conditions

Stop and report if:

- Refactoring changes public response JSON or status codes.
- The Google GenAI SDK types require broad `any` casts beyond what already
  exists.
- Existing route tests fail twice after reasonable fixes.
- The helper starts becoming a large custom framework.

## Maintenance notes

This is a consolidation plan, not an AI behavior plan. Reviewers should compare
before/after route behavior and reject unrelated prompt/model changes.
