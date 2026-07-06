# Plan 041: Stabilize hot client re-renders in practice and words flows

> **Executor instructions**: Profile or characterize before optimizing. Stop on
> STOP conditions. Update `plans/README.md` when complete.
>
> **Drift check (run first)**:
> `git diff --stat f47f5a13..HEAD -- hooks components/practice components/words components/vocabulary components/ai-coach`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `f47f5a13`, 2026-07-05

## Why this matters

Several client hooks and session components update arrays and callbacks during
interactive practice, words, recording, and AI coach flows. Some callbacks
depend on large arrays (`words`, queues, messages), which recreates handlers
and can cascade re-renders. Vercel rules: `rerender-functional-setstate`,
`rerender-defer-reads`, `rerender-dependencies`, and `rerender-memo`.

## Current state

- `hooks/useWords.ts` has callbacks depending on the full `words` array.
- Practice/session components manage queues, selected ids, progress, and
  keyboard handlers in Client Components.
- AI coach components manage message lists and panel state across many child
  components.
- No broad memoization pass should be done without a measured or clearly
  characterized hotspot.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Focused tests | `pnpm test -- hooks components/practice components/words components/ai-coach` | pass |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `hooks/useWords.ts`
- `hooks/useDeckData.ts`
- `components/practice/session/*`
- `components/practice/core-1000/*`
- `components/ai-coach/*` only where profiler/characterization points
- Focused tests around stale closures and callback stability

**Out of scope**:
- Blanket `React.memo` additions
- Visual redesign
- Server-side data fetching changes
- Store architecture rewrites

## Git workflow

- Branch: `codex/041-stabilize-hot-client-rerenders`
- Commit: `perf(client): stabilize hot interaction callbacks`

## Steps

### Step 1: Identify top candidates

Search for `useCallback` dependencies containing arrays/objects such as
`words`, `queue`, `messages`, `selected*`, and `decks`. Also inspect effects
that depend on non-primitive objects.

Prioritize functions passed to many children or registered as event listeners.

**Verify**: record the candidate list before changing code.

### Step 2: Convert stale-prone state updates

Where a callback reads state only to derive next state, use functional
`setState` and remove the state dependency. Example: deletes, toggles,
selection changes, queue advancement.

Do not change behavior for optimistic rollback without preserving the snapshot
needed for rollback.

**Verify**: focused tests pass after each batch.

### Step 3: Split callbacks that mix reads and writes

If a callback needs the latest value for async rollback, consider a ref for the
latest value or a reducer. Keep this targeted. Avoid hiding real data
dependencies just to quiet exhaustive-deps.

**Verify**: tests cover rollback or retry behavior.

### Step 4: Memoize only expensive children

Use `React.memo` only for children that:

- receive stable primitive props/callbacks after earlier steps;
- render many rows/cards; or
- are proven expensive by tests/profiler/manual inspection.

Avoid memoizing simple components.

### Step 5: Validate interaction flows

Run focused tests for changed flows and manually smoke the main interaction if
tests are thin: add/delete word, retry enrichment, practice session answer,
AI coach message send if touched.

## Test plan

- Existing hook and component tests.
- Add regression tests for stale closure cases when changing callbacks.
- Optional React Profiler note if manually measured.

## Done criteria

- [ ] At least three hot callbacks/effects are stabilized with functional updates or split dependencies.
- [ ] No stale closure or optimistic rollback regressions.
- [ ] Tests for touched flows pass.
- [ ] Typecheck and lint pass.

## STOP conditions

- Optimization requires changing persisted state shape.
- Callback stabilization makes rollback/error behavior ambiguous.
- No plausible hotspot can be identified without runtime profiling.

## Maintenance notes

Prefer functional state updates for event handlers and async callbacks. Add
memoization only after props are stable and the component is actually hot.

