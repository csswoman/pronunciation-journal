# Plan 010: Lazy-load canvas-confetti to remove it from the main bundle

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b543c9a..HEAD -- components/interview/InterviewResults.tsx hooks/useDailyPlan.ts`
> If either file changed since this plan was written, compare the current
> import and usage against the excerpts below before proceeding.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: performance
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

`canvas-confetti` is a ~20 KB library used only on success screens and daily
plan completion. Both files use a static `import confetti from 'canvas-confetti'`
which forces it into the main bundle, adding payload to every page even though
confetti fires only occasionally. A dynamic import defers the download until
the moment confetti actually fires.

## Current state

### `components/interview/InterviewResults.tsx` line 6

```ts
import confetti from "canvas-confetti";
```

Used at lines 68 and 75 inside a `useEffect` that fires on mount when the
session has completed.

### `hooks/useDailyPlan.ts` line 4

```ts
import confetti from 'canvas-confetti'
```

Used at line 157 inside a callback when the daily plan is completed.

## Scope

**In scope**:
- `components/interview/InterviewResults.tsx`
- `hooks/useDailyPlan.ts`

**Out of scope**:
- Any other file
- No logic changes — only the import mechanism changes

## Git workflow

- Branch: `advisor/010-confetti-code-split`
- Commit: `perf(bundle): lazy-load canvas-confetti via dynamic import`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Fix `components/interview/InterviewResults.tsx`

Remove line 6:
```ts
import confetti from "canvas-confetti";
```

In the `useEffect` where `confetti(...)` is called (around line 68), replace
with a dynamic import:

```ts
// Before:
confetti({ ... })
confetti({ ... })

// After:
const { default: confetti } = await import('canvas-confetti')
confetti({ ... })
confetti({ ... })
```

The `useEffect` callback must become `async` (or wrap the calls in an IIFE
`void (async () => { ... })()`).

**Verify**: `pnpm type-check` → exit 0

### Step 2: Fix `hooks/useDailyPlan.ts`

Remove line 4:
```ts
import confetti from 'canvas-confetti'
```

At line 157 where `confetti(...)` is called, replace with:
```ts
const { default: confetti } = await import('canvas-confetti')
confetti({ ... })
```

The callback containing this call must be `async` or use a void IIFE.

**Verify**: `pnpm type-check` → exit 0

### Step 3: Full verification

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm lint:design-tokens
```

## Test plan

No new tests required. The existing test suite verifies nothing regressed.
The bundle improvement is verified by `pnpm build` output: `canvas-confetti`
should no longer appear in the main chunk.

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `grep "^import confetti" components/interview/InterviewResults.tsx hooks/useDailyPlan.ts` returns 0 matches
- [ ] Only the two in-scope files are modified

## STOP conditions

- The confetti call is inside a synchronous context that cannot be made async —
  STOP and report the exact constraint.
- TypeScript errors arise that require touching files outside the in-scope list.

## Maintenance notes

Any future use of `canvas-confetti` in new components should use
`const { default: confetti } = await import('canvas-confetti')` — never
a static import.
