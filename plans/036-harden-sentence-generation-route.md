# Plan 036: Harden sentence generation configuration and cache writes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and stop on any STOP condition.
>
> **Drift check (run first)**: `git diff --stat 51515e0..HEAD -- app/api/sentences/generate/route.ts`
> If this file changed, compare the excerpts below against live code first.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `51515e0`, 2026-07-04

## Why this matters

`POST /api/sentences/generate` validates the service-role key but uses a
non-null assertion for `NEXT_PUBLIC_SUPABASE_URL`. A missing URL can crash the
route instead of returning a controlled configuration error. The route also
intentionally returns generated rows when cache upsert fails; that degradation
should be tested so future changes do not accidentally turn cache failure into
user-visible failure.

## Current state

- `app/api/sentences/generate/route.ts` — generates sentence fragments via Gemini and caches them in `text_fragments`.

Relevant excerpts:

```ts
// app/api/sentences/generate/route.ts:105
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!serviceKey) {
  return publicErrorResponse(500, "Server misconfiguration");
}
const db = createClient<Database>(supabaseUrl, serviceKey);
```

```ts
// app/api/sentences/generate/route.ts:151
if (insertErr) {
  console.error("[sentences/generate] DB insert error:", insertErr);
  return NextResponse.json(
    { fragments: rows.map(({ id, content, source, title }) => ({ id, content, source, title })), fromCache: false },
    { headers: SECURE_HEADERS }
  );
}
```

Repo convention: configuration failures return `publicErrorResponse(500,
"Server misconfiguration")`, as seen in `app/api/words/[id]/enrich/route.ts`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm test -- app/api/sentences/generate` | all matching tests pass, or add focused tests and pass |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `app/api/sentences/generate/route.ts`
- Optional new test file under `app/api/sentences/generate/__tests__/route.test.ts`

**Out of scope**:
- Changing Gemini model selection.
- Moving prompts; prompt centralization is covered by roadmap 032/T44.
- Changing `text_fragments` schema or RLS.

## Git workflow

- Branch: `codex/036-harden-sentence-generation-route`
- Commit message style: `fix(sentences): validate generation route config`
- Do not push unless instructed.

## Steps

### Step 1: Validate all required server config before creating Supabase client

Replace the non-null assertions with explicit checks:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

If either is missing, return `publicErrorResponse(500, "Server misconfiguration")`.

Keep `GEMINI_API_KEY` validation inside `generateSentencesWithGemini` unless
you decide to move it to the route for clearer behavior.

**Verify**: `pnpm type-check` -> exit 0.

### Step 2: Add tests for config failure and cache-write degradation

Create focused route tests covering:

- Missing `NEXT_PUBLIC_SUPABASE_URL` -> `500` public error before `createClient` is called.
- Missing `SUPABASE_SERVICE_ROLE_KEY` -> `500` public error.
- Cache `upsert` failure after successful Gemini generation still returns generated fragments with `fromCache: false`.

Use mock patterns from `app/api/gemini/generate-reader/__tests__/route.test.ts`
and `app/api/gemini/transcribe/__tests__/route.test.ts`.

**Verify**: `pnpm test -- app/api/sentences/generate` -> tests pass.

### Step 3: Keep cache failure semantics intentional

Add a short code comment only if needed to explain that cache insert failure is
non-fatal because the generated fragments can still satisfy the request. Do not
hide generation failures; those should remain `502`.

**Verify**: `pnpm type-check` -> exit 0.

## Test plan

- Add route tests for missing Supabase URL, missing service role key, and cache
  upsert failure.
- Run focused route tests and `pnpm type-check`.

## Done criteria

- [ ] No non-null assertion remains for Supabase URL or service role key in this route.
- [ ] Missing config returns controlled `500`.
- [ ] Cache-write degradation is covered by a regression test.
- [ ] `pnpm type-check` exits 0.

## STOP conditions

Stop and report if:

- Existing callers require cache failures to be fatal.
- The test setup requires real network or real Supabase credentials.
- Fixing the config check reveals a broader env-validation module should be introduced.

## Maintenance notes

If more routes need the same config validation, extract a shared helper in a
separate plan. This plan should stay route-local.
