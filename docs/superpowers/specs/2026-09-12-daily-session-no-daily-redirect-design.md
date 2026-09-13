# Daily session: no more forced redirect to /daily

## Problem

Starting the daily session from Home currently does two wrong things:

1. **On start**: `HomeDailyCard.handleStartStep` calls `router.push('/daily?step=${step.id}')` — clicking a step on Home immediately navigates away to the `/daily` route, even though the user never asked to go there. `/daily` is a distinct, optional surface (today's mini-lesson, immersion log, extra practice) — not the same thing as "the daily session from Home."
2. **On step complete**: `DailyChecklist.handleComplete` (mounted at `/daily`) always does `router.replace('/daily')` after marking a step done, dropping the user back to the `/daily` hub view instead of advancing to the next pending step in place. This is wrong regardless of entry point, and doubly wrong when the session started from Home, since it forces a navigation to `/daily` that Home never intended.

Net effect: doing the daily session from Home always ends up on `/daily`, a page with different content and framing than "the daily session," confusing session continuity with the `/daily` route's own concerns.

## Goal

- Starting a step from Home never navigates to `/daily`. The session runs full-bleed over Home itself (same visual takeover `DailyStepSession` already does today), exactly like `/daily` does it.
- Completing a step — from either entry point — advances to the next pending step in place. No route change.
- Completing the last step shows the existing done/recap state in place (Home shows it inline in Home; `/daily` keeps showing `SessionRecapCard` as today).
- `/daily` keeps working exactly as it does today when the user navigates there directly (checklist hub, mini-lesson, immersion log, extra practice link).
- No duplicated state machine: the "run steps in order, advance on complete" logic lives in one hook, consumed by both surfaces.

## Non-goals

- No change to `/daily`'s own checklist/hub content (mini-lesson card, immersion log, extra practice card).
- No change to how individual steps render internally (`DailyStepSession` internals untouched).
- No change to the daily plan generation, SRS logic, or step completion recording (`useDailyPlan`).
- No new route (e.g. no `/session`). Confirmed: session runs as component state on whichever page started it.

## Design

### `useDailySessionRunner` (new hook, `hooks/useDailySessionRunner.ts`)

Extracts the `view` state machine currently inlined in `DailyChecklist`:

```ts
type SessionView =
  | { mode: 'idle' }                                         // no active step
  | { mode: 'step'; step: DailyStep; exerciseIndex: number }
  | { mode: 'done' }
```

Inputs: the `steps`, `markDone`, `allDone` from `useDailyPlan` (caller already owns a `useDailyPlan` instance — the runner does not call it itself, to avoid a second plan load).

Returns:
- `view: SessionView`
- `startStep(step: DailyStep, exerciseIndex?: number)` — sets `view` to `{ mode: 'step', ... }`, writes `sessionStorage` (same `daily:step` key/shape as today, unchanged — used for exercise-index resume within a step).
- `completeStep(stepId: string)` — clears `sessionStorage`, awaits `markDone(stepId)`, then:
  - finds the next pending step (first `steps` entry whose status isn't done/resolved)
  - if found → `view = { mode: 'step', step: nextStep, exerciseIndex: 0 }`
  - else → `view = { mode: 'done' }`
- `exitStep()` — clears `sessionStorage`, `view = { mode: 'idle' }` (same as today's `handleExit`, just no `router.replace`).
- `resumeFromUrlStep(stepId: string | undefined)` — the existing `/daily?step=` deep-link behavior (autoStartedRef guard included), kept as-is for `/daily`'s own use; Home does not use this since Home never puts `step` in Home's URL.

No `router` dependency at all inside the hook — callers decide what "idle" and "done" render as.

### `DailyChecklist` (mounted at `/daily`)

- Replaces its inline `view` state + `handleComplete`/`handleExit` with `useDailySessionRunner`.
- `handleComplete`/`handleExit` no longer call `router.replace('/daily')` — the URL simply stops carrying `?step=` naturally once the user isn't deep-linking; no explicit navigation needed since we're already on `/daily`. (Optional cleanup: still call `router.replace('/daily')` with no query only from *this* page, purely to drop a stale `?step=` param from the URL bar — not to force a page transition. This is safe here because we're already on `/daily`; Home must never do this.)
- `mode: 'idle'` renders the existing checklist hub JSX (unchanged).
- `mode: 'step'` renders `DailyStepSession` (unchanged).
- `mode: 'done'` renders `SessionRecapCard` (unchanged).

### `HomeDailyCard` / `HomeLayout`

- `HomeDailyCard.handleStartStep` no longer does `router.push('/daily?step=...')`. Instead it calls the runner's `startStep(step)`.
- When the runner's `view.mode === 'step'` or `'done'`, `HomeDailyCard` (or its parent, whichever already owns full-page layout control — see below) renders full-bleed: `<DailyStepSession />` / a Home-side done state, replacing the normal Home content, matching `/daily`'s existing takeover pattern (`useHideMobileNavDuringSession` already fires from inside `DailyStepSession`, so nav hiding is automatic).
- **Placement of the full-bleed swap**: `HomeDailyCard` today renders as one card inside `HomeLayout`'s grid. A step session must not render squeezed inside that grid slot — it needs to replace the whole page content the way `/daily`'s `PageLayout` swap does. So the `view.mode !== 'idle'` branch is lifted one level up: `HomeLayout` receives the runner's `view` (or a boolean "session active") from `HomeDailyCard`'s hook instance — simplest is for `HomeLayout` itself to own the `useDailySessionRunner` call (it already receives `conceptLesson` etc. and passes them down) and pass `startStep`/`view` down to `HomeDailyCard`, while `HomeLayout` itself does the full-bleed conditional render at its top level.
- **Done state on Home**: reuse `SessionRecapCard` (same component `/daily` uses) rather than inventing a second recap UI. After showing it, a "Volver a inicio" action resets the runner to `idle` (no navigation — we're already on Home).

### State ownership recap

| Concern | Owner |
|---|---|
| Daily plan (steps, doneIds, markDone) | `useDailyPlan` (unchanged, one instance per surface as today) |
| Step sequencing / view state | `useDailySessionRunner` (new, one instance per surface) |
| Full-bleed takeover rendering | `DailyChecklist` (for /daily), `HomeLayout` (for Home) |
| `/daily?step=` deep link resume | Stays in `DailyChecklist` only, via `resumeFromUrlStep` |

### Edge cases

- **Deep link `/daily?step=X` while mid-session on Home**: unaffected — these are two separate `useDailyPlan`/`useDailySessionRunner` instances (Home's and `/daily`'s), each reading the same `sessionStorage`/Dexie-backed done state but not sharing React state. Opening `/daily` in a new tab/nav while a Home session is active shows `/daily`'s own idle checklist (or resumes if `?step=` matches an in-progress step) — this matches today's behavior for the `/daily`-native path and is out of scope to change.
- **Browser back button during a Home-driven step**: since Home never pushes a history entry for step start, back leaves the step (same as any in-place state change) — acceptable, matches how `/daily`'s own step view already behaves when reached via the checklist (not deep-linked).
- **`sessionStorage` key stays `daily:step`, shared shape**: both surfaces use it identically, so refreshing mid-step keeps working from either origin.

## Testing

- Update `DailyChecklist.test.tsx` / add `DailyStepList`/`HomeDailyCard` tests: completing a step advances `view` to the next pending step without any router call; completing the last step shows the done view.
- New `useDailySessionRunner` unit tests: start → complete → complete (next) → complete (done); exit clears storage and returns to idle without touching router.
- `HomeDailyCard`/`HomeCommandGrid` existing tests updated to assert no `router.push('/daily...')` call on step start.
