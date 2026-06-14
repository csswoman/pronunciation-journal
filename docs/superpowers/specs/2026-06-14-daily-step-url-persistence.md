# Daily Step URL + Exercise Persistence

**Date:** 2026-06-14  
**Status:** Approved

## Problem

When a user taps a daily step from the home card, the session runs as a React
overlay with no URL change (`localhost:3000`). Reloading loses the active step
and the exercise index — two-click friction and zero resilience.

## Solution

`/daily?step=<stepId>` becomes the canonical URL for an active daily session.
`sessionStorage` holds the exercise index so a reload within the same browser
tab resumes at the exact exercise. One click from the home card starts the
session immediately at the right URL.

---

## Architecture

```
Home card  ──click──▶  router.push('/daily?step=phoneme_focus:42')
                        sessionStorage.set('daily:step', { stepId, exerciseIndex: 0 })

/daily mounts
  ├─ reads ?step from searchParams (passed server→client as prop)
  ├─ waits for useDailyPlan to reach 'ready'
  ├─ finds matching step in plan
  └─ renders DailyStepSession directly (skips checklist view)
       └─ on each exercise advance: sessionStorage.set('daily:step', { stepId, exerciseIndex: N })

Reload at /daily?step=phoneme_focus:42
  ├─ plan reloads from localStorage (same date key → same steps)
  ├─ sessionStorage has { stepId, exerciseIndex: N }
  └─ DailyStepSession starts at exercise N  ✓

Complete / Exit
  ├─ sessionStorage.delete('daily:step')
  └─ router.replace('/daily')  →  checklist shows step as done
```

---

## Changes

### 1. `hooks/usePracticeSession.ts`

Add optional `initialQueuePos?: number` to `buildInitialState`:

```ts
function buildInitialState(exercises: Exercise[], initialQueuePos = 0): SessionState {
  return {
    queue: exercises.map((exercise, id) => ({ exercise, id })),
    currentQueuePos: Math.min(initialQueuePos, Math.max(0, exercises.length - 1)),
    ...
  }
}
```

`usePracticeSession` accepts `initialQueuePos?: number` and passes it through.
The `useEffect` that resets on `exercises` change only fires when `exercises`
reference changes (already the case via `sessionKey`), so the initial pos is
set once and then the session drives itself forward.

### 2. `components/practice/PracticeSession.tsx`

Pass `initialQueuePos` down to `usePracticeSession`. New prop:

```ts
interface PracticeSessionProps {
  ...
  initialExerciseIndex?: number  // 0-based; undefined = start from beginning
}
```

### 3. `components/daily/DailyStepSession.tsx`

New props:

```ts
interface Props {
  step: DailyStep
  sessionKey: number
  initialExerciseIndex?: number   // restored from sessionStorage
  onComplete: () => void
  onExit: () => void
  onExerciseChange?: (index: number) => void  // called on each advance
}
```

- Pass `initialExerciseIndex` to `PracticeSession`.
- Call `onExerciseChange(index)` whenever the session advances. The index to
  report is `currentIndex` from `PracticeSession` (already exposed via the
  session state).

### 4. `components/daily/DailyChecklist.tsx`

New prop: `initialStepId?: string`

**On mount (after plan reaches 'ready'):**
- If `initialStepId` is set, find the matching step in `steps`.
- Read `sessionStorage.getItem('daily:step')` → parse `{ stepId, exerciseIndex }`.
- If `stepId` matches `initialStepId`, use `exerciseIndex`; else default to 0.
- Set `view` to `{ mode: 'step', step, exerciseIndex }` immediately — no
  checklist flash.

**View type update:**
```ts
type View =
  | { mode: 'checklist' }
  | { mode: 'step'; step: DailyStep; exerciseIndex: number }
  | { mode: 'done' }
```

**`handleStartStep`** (called from checklist tap):
- Write `sessionStorage.setItem('daily:step', JSON.stringify({ stepId: step.id, exerciseIndex: 0 }))`
- Set view to `{ mode: 'step', step, exerciseIndex: 0 }`
- `router.replace('/daily?step=' + step.id)` (replace, not push — avoids back-button loop)

**`handleExerciseChange(index)`**:
- `sessionStorage.setItem('daily:step', JSON.stringify({ stepId: step.id, exerciseIndex: index }))`

**`handleComplete` / `handleExit`**:
- `sessionStorage.removeItem('daily:step')`
- `router.replace('/daily')`
- Set view to `{ mode: 'checklist' }` (complete also calls `markDone`)

### 5. `app/daily/page.tsx`

Read `searchParams.step` and pass to `DailyChecklist`:

```tsx
export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const { step } = await searchParams
  ...
  return <DailyChecklist conceptLesson={conceptLesson} initialStepId={step} />
}
```

### 6. `components/home/HomeDailyCard.tsx`

`handleStartStep` writes sessionStorage and navigates:

```ts
const handleStartStep = useCallback((step: DailyStep) => {
  if (step.kind === 'concept') return
  sessionStorage.setItem('daily:step', JSON.stringify({ stepId: step.id, exerciseIndex: 0 }))
  router.push('/daily?step=' + step.id)
}, [router])
```

No overlay, no `DailyStepSession` import needed in the home card.

---

## sessionStorage Key

`'daily:step'` — shape: `{ stepId: string; exerciseIndex: number }`

Cleared on: complete, exit, or stale (stepId in storage doesn't match any step
in today's plan → ignore and start from 0).

---

## Edge Cases

| Case | Behavior |
|------|----------|
| User opens `/daily?step=X` directly (no sessionStorage) | Starts step from exercise 0 |
| stepId in sessionStorage doesn't match any step today | Ignored; checklist shown |
| Plan not yet loaded when URL is read | Wait for `status === 'ready'` before resolving step |
| Concept step clicked from home | `router.push('/daily')` without `?step` param (concept steps are Links in DailyStepList) |
| All steps done, user navigates to `/daily?step=X` | Checklist shows done state, step not re-opened |

---

## Files Modified

| File | Change |
|------|--------|
| `hooks/usePracticeSession.ts` | Add `initialQueuePos` param |
| `components/practice/PracticeSession.tsx` | Add `initialExerciseIndex` prop, pass through |
| `components/daily/DailyStepSession.tsx` | Add `initialExerciseIndex` + `onExerciseChange` props |
| `components/daily/DailyChecklist.tsx` | Add `initialStepId`, URL sync, sessionStorage read/write |
| `app/daily/page.tsx` | Read `searchParams.step`, pass to DailyChecklist |
| `components/home/HomeDailyCard.tsx` | Write sessionStorage + `router.push` on step click |

No new files. No new routes. No schema changes.

---

## Verification

1. Home: click a step → URL becomes `/daily?step=<id>`, session starts immediately (no checklist flash).
2. Reload mid-exercise → resumes at same exercise index.
3. Complete step → URL becomes `/daily`, checklist shows step as done.
4. Exit mid-step → URL becomes `/daily`, checklist shown, step not marked done.
5. Navigate to `/daily` with no `?step` → checklist shown normally.
6. Concept step from home → navigates to `/daily` (no `?step`), checklist shown.
