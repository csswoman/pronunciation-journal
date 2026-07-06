# Plan 038: Slim the authenticated shell client bundle

> **Executor instructions**: Execute every step in order. Stop on STOP
> conditions. Update `plans/README.md` when complete.
>
> **Drift check (run first)**:
> `git diff --stat f47f5a13..HEAD -- components/layout components/auth lib/stores components/theme`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/037-dedupe-server-auth-and-supabase-clients.md`
- **Category**: perf
- **Planned at**: commit `f47f5a13`, 2026-07-05

## Why this matters

Every authenticated route pays for `AuthenticatedAppLayout`, `AuthProvider`,
`ThemeProvider`, `AppShell`, navigation, AI coach trigger state, global
shortcuts, and stores. The previous commit deferred Dexie learning-state work
inside `AuthProvider`, but the shell still remains a large always-on client
surface. Vercel rules: `bundle-dynamic-imports`, `bundle-conditional`,
`server-serialization`, and `client-event-listeners`.

## Current state

- `components/layout/AuthenticatedAppLayout.tsx` is a Client Component wrapping
  all authenticated pages.
- `components/layout/AppShell.tsx` always imports sidebar, bottom nav, AI coach
  trigger, word-bank quick-add query, auth context, and AI coach store.
- `AICoachPanel` and `QuickAddModal` are dynamic, but their triggers and global
  state still load everywhere.
- The shell uses a global keyboard listener for quick add.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Shell tests | `pnpm test -- components/layout components/auth` | all pass |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm exec next build` | exit 0 |
| Bundle summary | `pnpm analyze:bundle` | writes `bundle-summary.json` |

## Scope

**In scope**:
- `components/layout/AuthenticatedAppLayout.tsx`
- `components/layout/AppShell.tsx`
- `components/layout/Sidebar*.tsx`
- `components/layout/BottomNav*.tsx`
- `components/ai-coach/AICoachTrigger.tsx`
- Shell-focused tests

**Out of scope**:
- AI coach panel internals
- Route-specific page content
- Auth provider behavior beyond shell composition
- Visual redesign

## Git workflow

- Branch: `codex/038-slim-authenticated-shell-client-bundle`
- Commit: `perf(shell): reduce always-on authenticated client code`

## Steps

### Step 1: Measure current shell cost

Run `pnpm exec next build` and inspect `.next/server/app/(authenticated)/page/react-loadable-manifest.json`
and static chunks. Record current shell-related chunk names and gzip sizes.

**Verify**: measurement exists before edits.

### Step 2: Split desktop and mobile navigation

Evaluate whether `Sidebar` and `BottomNav` can be dynamically imported or
split by media/viewport without causing layout shift. Keep the small layout
frame eager, defer menu-heavy config/rendering where possible.

Do not hide a mounted desktop nav with CSS if its hooks and icons still load on
mobile.

**Verify**: shell tests pass and navigation remains accessible.

### Step 3: Defer AI coach trigger internals

Keep a lightweight button/control visible if required, but defer heavy icon,
store, and launch payload logic until interaction if feasible. If the trigger
must subscribe to Zustand to show state, keep the subscription narrow.

**Verify**: opening AI coach still loads the panel and preserves launch flows.

### Step 4: Scope global keyboard listener

Confirm the quick-add shortcut listener only exists for signed-in users and
does not capture while the feature is unavailable. If possible, move the
listener into a small isolated component so the rest of quick-add logic stays
deferred.

**Verify**: tests cover shortcut behavior and no duplicate listener is added.

### Step 5: Re-measure bundle

Run `pnpm exec next build` and `pnpm analyze:bundle`. Record delta in the plan
or performance docs. Expected result: authenticated route initial JS drops or
optional navigation/AI code moves to async chunks.

## Test plan

- Shell mount behavior tests.
- Keyboard shortcut test.
- AI coach trigger open test.
- Mobile and desktop nav smoke tests if existing test utilities support them.

## Done criteria

- [ ] Authenticated shell ships less always-on JS or proves why not.
- [ ] Navigation and AI coach triggers still work.
- [ ] Optional shell code appears in async chunks.
- [ ] Typecheck, lint, shell tests, and direct Next build pass.

## STOP conditions

- Deferring navigation creates visible layout shift or hydration mismatch.
- AI coach launch paths require trigger internals to be eager.
- Bundle manifests cannot attribute movement clearly.

## Maintenance notes

Global authenticated features should expose a tiny trigger and defer their
implementation. New stores should not be subscribed to by the shell unless the
shell visibly depends on their state.

