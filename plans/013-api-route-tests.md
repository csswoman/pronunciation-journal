# Plan 013: Add unit tests to the three highest-value API routes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b543c9a..HEAD -- app/api/`
> If API route files changed since this plan was written, read the current
> route handlers before writing tests.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-ci-gate-on-failures.md
- **Category**: tests
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

The API routes under `app/api/` handle user data writes and AI calls with zero
automated test coverage. A regression in auth gating or response shape is only
caught in production. Three routes are the highest-value targets: the health
check (trivial baseline), the words route (user data write), and the lexicon
route (user data read/write). Adding tests for the happy path and the
auth-missing case costs little and prevents the most common regressions.

## Current state

API routes found at `b543c9a`:
- `app/api/health/route.ts` — simple health check
- `app/api/words/route.ts` — word-bank CRUD
- `app/api/lexicon/route.ts` — lexicon reads
- `app/api/sentences/generate/route.ts` — Gemini call
- `app/api/gemini/` — multiple Gemini sub-routes

Read each of the three target routes before writing tests.

## Test pattern for Next.js App Router route handlers in Vitest

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock auth guard
vi.mock('@/lib/api/guards', () => ({
  requireUser: vi.fn(),
  SECURE_HEADERS: {},
}))

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

import { GET } from './route'  // or POST, PUT, DELETE
import { requireUser } from '@/lib/api/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'

describe('GET /api/example', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(requireUser).mockResolvedValue({
      user: null,
      error: new Response(null, { status: 401 }),
    })
    const req = new NextRequest('http://localhost/api/example')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with data for authenticated user', async () => {
    vi.mocked(requireUser).mockResolvedValue({
      user: { id: 'user-123' },
      error: null,
    })
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
        }),
      }),
    }
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as never)

    const req = new NextRequest('http://localhost/api/example')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })
})
```

## Scope

**In scope** (only these new files):
- `app/api/health/route.test.ts`
- `app/api/words/route.test.ts`
- `app/api/lexicon/route.test.ts`

**Out of scope**:
- Any route handler source files — do not modify them
- `app/api/gemini/` — complex; deferred to a follow-up
- `app/api/sentences/` — involves Gemini mocking complexity; deferred

## Git workflow

- Branch: `advisor/013-api-route-tests`
- Commit: `test(api): add unit tests for health, words, and lexicon routes`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Read the three route handlers

Read `app/api/health/route.ts`, `app/api/words/route.ts`, and
`app/api/lexicon/route.ts` in full. For each, note:
- HTTP methods exported (`GET`, `POST`, etc.)
- Auth requirements (does it call `requireUser`?)
- What it returns on success
- What mocks are needed

### Step 2: Write `app/api/health/route.test.ts`

A health route typically returns 200 unconditionally. Write at minimum:
- `GET /api/health` → 200

### Step 3: Write `app/api/words/route.test.ts`

Write at minimum:
- `GET` or `POST` (whichever the route exports) → 401 when `requireUser` returns an error response
- `GET` or `POST` → 200/201 for an authenticated user with mocked Supabase data

### Step 4: Write `app/api/lexicon/route.test.ts`

Same two cases as Step 3 for the lexicon route.

### Step 5: Run verification

```bash
pnpm type-check
pnpm test
pnpm lint
```

Expected: all pass; `pnpm test` output shows the new test files.

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm test` exits 0; at least 5 new test cases across the three files
- [ ] `pnpm lint` exits 0
- [ ] Only the three new test files are created (no source file changes)

## STOP conditions

- A route handler has no `requireUser` call and auth logic is embedded in a
  way that makes mocking infeasible without refactoring — STOP and note which
  route and what the obstacle is.
- The `requireUser` return type in `lib/api/guards.ts` doesn't match the mock
  pattern above — adjust the mock to match the actual type.
- `pnpm type-check` fails on the test files with errors that can't be resolved
  without changing source files — STOP and report.

## Maintenance notes

- Use this file as the pattern for any new API route test going forward.
- The `vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as never)`
  cast is necessary because Supabase's client type is a complex generic. This
  is the accepted pattern — the `as never` is intentional and documented.
- Gemini routes require additional mocking of the `@google/genai` SDK; plan
  those separately when the AI SDK mock story is clearer.
