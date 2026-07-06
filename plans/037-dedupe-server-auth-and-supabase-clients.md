# Plan 037: Deduplicate server auth and Supabase clients per request

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and stop on any STOP condition. Update `plans/README.md`
> when complete.
>
> **Drift check (run first)**:
> `git diff --stat f47f5a13..HEAD -- app lib components/auth components/layout`
> If authenticated layouts, Supabase helpers, or server query modules changed,
> inspect the live code before implementing.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `f47f5a13`, 2026-07-05

## Why this matters

Several server-rendered routes call `createSupabaseServerClient()` and
`supabase.auth.getUser()` through separate helpers. In App Router rendering this
can create duplicated cookie reads, auth round trips, and repeated Supabase
client setup within the same request. Vercel rule: `async-parallel`,
`server-cache-react`, and `server-parallel-fetching`.

## Current state

- `app/(authenticated)/layout.tsx` authenticates the user before rendering the
  shell.
- Pages such as `app/(authenticated)/page.tsx` and
  `app/(authenticated)/words/page.tsx` call `getSupabaseServerUserId()` again.
- Many server query helpers create their own Supabase server client internally.
- The last optimization commit parallelized `/words` after `userId` is known,
  but it did not remove duplicate request-level auth/client setup.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Focused tests | `pnpm test -- lib/supabase app/(authenticated)` | matching tests pass |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm exec next build` | exit 0 |

## Scope

**In scope**:
- `lib/supabase/server.ts`
- `lib/supabase/session.ts`
- Authenticated server pages/layouts that duplicate auth lookup
- Server query helpers where passing a client is low-risk
- Focused tests for request-level dedupe

**Out of scope**:
- Browser Supabase client behavior
- Auth UI redesign
- Database schema/RLS changes
- Large-scale rewrite of every query module

## Git workflow

- Branch: `codex/037-dedupe-server-auth-and-supabase-clients`
- Commit: `perf(server): dedupe authenticated request lookups`
- Do not push unless instructed.

## Steps

### Step 1: Inventory duplicated auth/client creation

Search server-only code for:

- `getSupabaseServerUserId(`
- `createSupabaseServerClient(`
- `.auth.getUser(`

Classify each call as layout auth, page auth, or query helper client creation.
Identify the highest-traffic authenticated pages first: `/`, `/words`,
`/practice`, `/daily`, `/progress`.

**Verify**: record a short inventory in the PR/commit notes or this plan.

### Step 2: Add request-scoped cached helpers

Use React `cache()` for request-scoped helpers in server-only modules:

- `getCachedSupabaseServerClient()`
- `getCachedSupabaseServerUser()`
- `getCachedSupabaseServerUserId()`

Keep the existing exports as compatibility wrappers if many call sites remain.
Do not cache mutable user-specific results across requests; React cache is
request-scoped when used in Server Components.

**Verify**: `pnpm type-check` exits 0.

### Step 3: Convert high-traffic pages first

Update authenticated home and `/words` to consume the cached user id or pass
the layout-known user where feasible. For query helpers that are called
multiple times in one page, allow an optional Supabase client parameter rather
than creating a new client every call.

Prioritize reducing duplicated auth calls over touching every module.

**Verify**: focused tests and `pnpm type-check` pass.

### Step 4: Add characterization tests

Mock `@supabase/ssr` or the local server client helper and prove multiple
server helper calls within one render/request path reuse the cached user/client
contract where practical.

If React request cache is hard to assert directly in unit tests, add tests for
the wrapper behavior and document manual build/runtime verification.

**Verify**: `pnpm test -- lib/supabase` passes.

### Step 5: Build and inspect server output

Run `pnpm exec next build`. Confirm no route becomes static accidentally and no
server-only module leaks into the client graph.

**Verify**: build exits 0.

## Test plan

- Unit tests for cached server auth helper behavior.
- Focused tests for affected server query helpers if their signatures change.
- `pnpm type-check`, `pnpm lint`, and `pnpm exec next build`.

## Done criteria

- [ ] High-traffic authenticated pages no longer perform redundant auth lookups.
- [ ] Server query helpers avoid avoidable duplicate client construction in the same page render.
- [ ] No browser bundle imports `server-only` modules.
- [ ] Typecheck, lint, focused tests, and direct Next build pass.

## STOP conditions

- Cached helpers accidentally share auth state across users or requests.
- Supabase cookie mutation semantics require a fresh client for a specific path.
- The change requires broad query-layer rewrites beyond the high-traffic pages.

## Maintenance notes

New Server Components should prefer cached request helpers and pass known
`userId`/client into query functions instead of re-reading auth state.

