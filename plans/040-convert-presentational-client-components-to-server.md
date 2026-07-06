# Plan 040: Convert presentational Client Components to Server Components

> **Executor instructions**: Execute incrementally. Stop on STOP conditions.
> Update `plans/README.md` when complete.
>
> **Drift check (run first)**:
> `git diff --stat f47f5a13..HEAD -- components app`

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/038-slim-authenticated-shell-client-bundle.md`
- **Category**: perf
- **Planned at**: commit `f47f5a13`, 2026-07-05

## Execution notes

- `safe`: `components/home/HomeLayout.tsx`,
  `components/layout/stats/NeedsAttention.tsx`,
  `components/layout/stats/StatTiles.tsx`.
- `split later`: `components/words/WordsHero.tsx`, but only after moving the
  words tab state boundary out of `WordsClient`; it currently receives button
  callbacks from a client parent.
- `keep`: `components/words/WordsTopbar.tsx`, `components/words/WordsClient.tsx`,
  words tab runtimes, `HomeMobileView`, `HomeStatusHero`, `ReviewProgressCard`,
  `Core1000ProgressCard`, and layout navigation components because they use
  hooks, browser data, router callbacks, or are imported from client parents.

## Why this matters

The repo has many files marked `"use client"`. Some likely need browser APIs,
state, or event handlers, but others appear presentational and could render as
Server Components. Removing unnecessary client boundaries reduces shipped JS,
hydration work, and prop serialization. Vercel rules: `server-serialization`,
`rendering-hoist-jsx`, and `bundle-barrel-imports`.

## Current state

- A scan found many Client Components across `components/home`, `components/layout`,
  `components/ipa`, `components/lesson`, `components/vocabulary`, and
  `components/words`.
- Some presentational files import icons only and receive callbacks from a
  parent; these may need to stay client if they attach events.
- Current code has mixed server/client route boundaries, so conversion must be
  incremental.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Focused tests | `pnpm test -- components/home components/layout components/words components/vocabulary` | pass |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm exec next build` | exit 0 |

## Scope

**In scope**:
- Presentational components with no hooks, browser APIs, event handlers, refs,
  or client-only imports
- Small parent/child splits where a tiny client wrapper can own interactivity
  and a larger child can become server-rendered
- Tests affected by converted components

**Out of scope**:
- Full feature rewrites
- Components using Web Speech, media APIs, IndexedDB, localStorage, Zustand, or
  Supabase browser client
- Visual redesign

## Git workflow

- Branch: `codex/040-serverize-presentational-components`
- Commit: `perf(rsc): remove unnecessary client component boundaries`

## Steps

### Step 1: Build an inventory

List all files with `"use client"`. Classify candidates:

- `safe`: no hooks/events/browser imports
- `split`: mostly presentational but mixed with small interaction
- `keep`: requires client runtime

Focus first on authenticated home and words surfaces because they affect
frequent navigation.

**Verify**: inventory is documented in the commit notes or this plan.

### Step 2: Remove safe client directives

For `safe` candidates, remove `"use client"` and confirm no parent passes
function props from a Server Component into a Server Component incorrectly.
Keep icon imports direct from `lucide-react` unless the build shows bundle
issues.

**Verify**: `pnpm type-check` passes after each small batch.

### Step 3: Split mixed components

Where a component has a small button/event area and a large static body, create:

- a Server Component for static rendering;
- a small Client Component for event handling.

Avoid adding abstractions unless they reduce shipped JS meaningfully.

**Verify**: focused component tests pass.

### Step 4: Check serialization

Make sure server-rendered components do not receive large objects only to pass
them into client children. If a large object is required by a client child,
trim props to the fields actually needed.

**Verify**: typecheck and tests pass.

### Step 5: Build and measure

Run `pnpm exec next build`. Compare route manifests for at least `/`,
`/words`, and `/practice`.

## Test plan

- Existing component tests for converted areas.
- Add smoke tests when removing a client boundary changes rendering behavior.
- Build is required because RSC boundary mistakes often surface there.

## Done criteria

- [ ] At least one high-traffic surface has fewer unnecessary Client Components.
- [ ] No server component passes invalid function props.
- [ ] Route client chunks shrink or hydration boundaries decrease.
- [ ] Typecheck, lint, focused tests, and direct build pass.

## STOP conditions

- Candidate components depend on client-only context through undocumented paths.
- Conversion requires broad prop API rewrites across unrelated features.
- Build reports RSC boundary errors that cannot be resolved locally.

## Maintenance notes

Default new components to Server Components. Add `"use client"` only at the
smallest boundary that needs state, effects, browser APIs, refs, or event
handlers.
