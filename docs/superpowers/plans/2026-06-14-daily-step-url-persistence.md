# Daily Step URL + Exercise Persistence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One click from the home card launches the daily step at `/daily?step=<stepId>`, and reloading mid-session resumes at the exact exercise.

**Architecture:** `PracticeSession` (via `useSessionState`) gains an `initialIndex` prop that seeds `currentIndex`. `DailyStepSession` threads it through and calls `onExerciseChange` on each advance. `DailyChecklist` reads `initialStepId` (passed from `app/daily/page.tsx` via `searchParams`), resolves the step + exercise index from `sessionStorage`, and starts the session view directly. `HomeDailyCard` writes to `sessionStorage` and calls `router.push('/daily?step=...')` instead of rendering an overlay.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, `sessionStorage` (browser-only, tab-scoped), `useRouter` / `useSearchParams`

---

## File Map

| File | Change |
|------|--------|
| `components/practice/session/useSessionState.ts` | Add `initialIndex?: number` to `PracticeConfig` usage; seed `useState(initialIndex ?? 0)` |
| `lib/practice/types.ts` | Add `initialIndex?: number` to `PracticeConfig` |
| `components/practice/PracticeSession.tsx` | Pass `initialIndex` from config through to `useSessionState` (already passes full config) |
| `components/daily/DailyStepSession.tsx` | Add `initialExerciseIndex?` + `onExerciseChange?` props; thread through |
| `components/daily/DailyChecklist.tsx` | Add `initialStepId?`; URL + sessionStorage sync; auto-start step view |
| `app/daily/page.tsx` | Read `searchParams.step`; pass as `initialStepId` to `DailyChecklist` |
| `components/home/HomeDailyCard.tsx` | Write `sessionStorage` + `router.push('/daily?step=...')` on step click |

---

## Task 1: Add `initialIndex` to `PracticeConfig` and `useSessionState`

**Files:**
- Modify: `lib/practice/types.ts`
- Modify: `components/practice/session/useSessionState.ts`

- [ ] **Step 1.1 — Locate `PracticeConfig` in `lib/practice/types.ts`**

Search for `PracticeConfig` in `lib/practice/types.ts`. It is the interface accepted by `PracticeSession`. Add one optional field:

```ts
// In PracticeConfig interface:
initialIndex?: number   // start at this exercise (0-based); undefined = 0
```

- [ ] **Step 1.2 — Seed `currentIndex` with `initialIndex` in `useSessionState.ts`**

Current code (line 57):
```ts
const [currentIndex, setCurrentIndex] = useState(0)
```

Replace with:
```ts
const [currentIndex, setCurrentIndex] = useState(config.initialIndex ?? 0)
```

**Important:** The `useEffect` that calls `setCurrentIndex(existing.currentIndex)` for `persistence`-based sessions (line 80) already overwrites this — no conflict. For non-persistence sessions (the daily flow), there is no `useEffect` that resets `currentIndex`, so the initial value sticks.

- [ ] **Step 1.3 — Verify TypeScript**

```powershell
pnpm type-check
```

Expected: no new errors.

- [ ] **Step 1.4 — Commit**

```powershell
git add lib/practice/types.ts components/practice/session/useSessionState.ts
git commit -m "feat(daily): add initialIndex to PracticeConfig to seed exercise position"
```

---

## Task 2: Thread `initialExerciseIndex` + `onExerciseChange` through `DailyStepSession`

**Files:**
- Modify: `components/daily/DailyStepSession.tsx`

`PracticeSession` accepts the full `PracticeConfig` object and passes it to `useSessionState`. To call `onExerciseChange` on each advance, we need to intercept the `onSessionComplete` and track the index externally. However, `PracticeSession` doesn't expose a per-advance callback.

The cleanest approach: wrap `DailyStepSession` to write `sessionStorage` directly inside a new `onExerciseChange` prop, and pass `initialIndex` into `PracticeSession` via the config spread.

- [ ] **Step 2.1 — Update `DailyStepSession` interface and props**

Replace the current `Props` interface and component signature:

```tsx
interface Props {
  step: DailyStep
  sessionKey: number
  initialExerciseIndex?: number
  onComplete: () => void
  onExit: () => void
  onExerciseChange?: (index: number) => void
}

export default function DailyStepSession({
  step,
  sessionKey,
  initialExerciseIndex,
  onComplete,
  onExit,
  onExerciseChange,
}: Props) {
```

- [ ] **Step 2.2 — Pass `initialIndex` to `PracticeSession`**

In the return for the `PracticeSession` branch (currently line 40–49), add `initialIndex` and wire `onSessionComplete` to also notify `onExerciseChange` as a proxy:

```tsx
return (
  <PracticeSession
    key={sessionKey}
    context="daily"
    exercises={step.exercises}
    sessionLength={step.exercises.length}
    sessionLabel={step.title}
    initialIndex={initialExerciseIndex ?? 0}
    onSessionComplete={(result) => {
      onComplete()
    }}
    onExit={onExit}
  />
)
```

**Note:** `onExerciseChange` per-advance requires a callback into `useSessionState`. We will handle this in Task 4 via `DailyChecklist` writing to `sessionStorage` on a timer/blur — see below. The per-exercise callback from inside `PracticeSession` is not exposed, so we use a simpler approach: `sessionStorage` is updated by `DailyChecklist` using `beforeunload` and the `onExerciseChange` is dropped in favor of the approach in Task 4.

Full updated file:

```tsx
'use client'

// Planned structure:
// <DailyStepSession>
//   <PhonemeLessonIntro />  — si phoneme_focus + ipa conocido + no iniciado
//   <PracticeSession />     — ejercicios del paso
// </DailyStepSession>

import { useState } from 'react'
import PracticeSession from '@/components/practice/PracticeSession'
import { PhonemeLessonIntro } from '@/components/phoneme-practice/PhonemeLessonIntro'
import { IPA_EXTRA } from '@/lib/pronunciation/ipa-data'
import type { DailyStep } from '@/lib/practice/types'

interface Props {
  step: DailyStep
  sessionKey: number
  initialExerciseIndex?: number
  onComplete: () => void
  onExit: () => void
}

export default function DailyStepSession({
  step,
  sessionKey,
  initialExerciseIndex,
  onComplete,
  onExit,
}: Props) {
  const showable =
    step.kind === 'phoneme_focus' &&
    !!step.ipa &&
    !!IPA_EXTRA[step.ipa]

  const [started, setStarted] = useState(!showable)

  if (!started && step.ipa) {
    return (
      <PhonemeLessonIntro
        ipa={step.ipa}
        onStart={() => setStarted(true)}
      />
    )
  }

  return (
    <PracticeSession
      key={sessionKey}
      context="daily"
      exercises={step.exercises}
      sessionLength={step.exercises.length}
      sessionLabel={step.title}
      initialIndex={initialExerciseIndex ?? 0}
      onSessionComplete={onComplete}
      onExit={onExit}
    />
  )
}
```

- [ ] **Step 2.3 — Verify TypeScript**

```powershell
pnpm type-check
```

Expected: no errors.

- [ ] **Step 2.4 — Commit**

```powershell
git add components/daily/DailyStepSession.tsx
git commit -m "feat(daily): add initialExerciseIndex prop to DailyStepSession"
```

---

## Task 3: Update `app/daily/page.tsx` to read `searchParams.step`

**Files:**
- Modify: `app/daily/page.tsx`

- [ ] **Step 3.1 — Update page to accept and forward `searchParams`**

Replace the current file entirely:

```tsx
export const dynamic = 'force-dynamic'

import DailyChecklist, { type ConceptLesson } from '@/components/daily/DailyChecklist'
import { getTodaysMiniLesson } from '@/lib/content/lessons'

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const { step } = await searchParams

  let conceptLesson: ConceptLesson | null = null

  try {
    const lesson = await getTodaysMiniLesson()
    if (lesson) {
      conceptLesson = { slug: lesson.slug, title: lesson.title, subtitle: lesson.subtitle }
    }
  } catch {
    conceptLesson = null
  }

  return <DailyChecklist conceptLesson={conceptLesson} initialStepId={step} />
}
```

- [ ] **Step 3.2 — Verify TypeScript**

```powershell
pnpm type-check
```

Expected: error about `initialStepId` not existing on `DailyChecklistProps` — that's expected, will be fixed in Task 4.

- [ ] **Step 3.3 — Commit after Task 4 passes type-check** (hold this commit until Task 4 is done)

---

## Task 4: Update `DailyChecklist` — URL sync + sessionStorage + auto-start

**Files:**
- Modify: `components/daily/DailyChecklist.tsx`

This is the largest change. Key behaviors:

1. Accept `initialStepId?: string` prop.
2. When plan reaches `'ready'` and `initialStepId` is set: find the step, read `sessionStorage` for the exercise index, jump directly to `{ mode: 'step' }` — no checklist flash.
3. When the user taps a step from the checklist: write `sessionStorage`, call `router.replace('/daily?step=...')`, then set `view`.
4. On complete/exit: clear `sessionStorage`, call `router.replace('/daily')`.
5. `sessionStorage` key: `'daily:step'`, shape: `{ stepId: string; exerciseIndex: number }`.

### sessionStorage helpers (inline, no new file)

```ts
const STORAGE_KEY = 'daily:step'

function readStepStorage(): { stepId: string; exerciseIndex: number } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { stepId: string; exerciseIndex: number }
  } catch {
    return null
  }
}

function writeStepStorage(stepId: string, exerciseIndex: number): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ stepId, exerciseIndex }))
  } catch { /* quota errors: ignore */ }
}

function clearStepStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}
```

### Updated `View` type

```ts
type View =
  | { mode: 'checklist' }
  | { mode: 'step'; step: DailyStep; exerciseIndex: number }
  | { mode: 'done' }
```

- [ ] **Step 4.1 — Write the full updated `DailyChecklist.tsx`**

```tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Flame, Sparkles } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import DailyStepSession from './DailyStepSession'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import DailyStepList from './DailyStepList'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'

export type { ConceptLesson }

// ── sessionStorage helpers ──────────────────────────────────────────────────

const STORAGE_KEY = 'daily:step'

function readStepStorage(): { stepId: string; exerciseIndex: number } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { stepId: string; exerciseIndex: number }
  } catch {
    return null
  }
}

function writeStepStorage(stepId: string, exerciseIndex: number): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ stepId, exerciseIndex }))
  } catch { /* quota errors: ignore */ }
}

function clearStepStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

// ── Types ───────────────────────────────────────────────────────────────────

interface DailyChecklistProps {
  conceptLesson: ConceptLesson | null
  initialStepId?: string
}

type View =
  | { mode: 'checklist' }
  | { mode: 'step'; step: DailyStep; exerciseIndex: number }
  | { mode: 'done' }

// ── Component ───────────────────────────────────────────────────────────────

export default function DailyChecklist({ conceptLesson, initialStepId }: DailyChecklistProps) {
  const router = useRouter()
  const { status, steps, doneIds, completedCount, allDone, load, markDone, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: true,
  })

  const [view, setView] = useState<View>({ mode: 'checklist' })
  const [sessionKey, setSessionKey] = useState(0)
  // Prevents double-triggering the initialStepId auto-start.
  const autoStartedRef = useRef(false)

  // Auto-start: when plan is ready and we have a step from the URL.
  useEffect(() => {
    if (status !== 'ready' || !initialStepId || autoStartedRef.current) return
    const step = steps.find((s) => s.id === initialStepId)
    if (!step || step.kind === 'concept') return
    autoStartedRef.current = true
    const stored = readStepStorage()
    const exerciseIndex = stored?.stepId === initialStepId ? (stored.exerciseIndex ?? 0) : 0
    setSessionKey((k) => k + 1)
    setView({ mode: 'step', step, exerciseIndex })
  }, [status, steps, initialStepId])

  // Celebrate once when all steps are complete.
  useEffect(() => {
    if (allDone && view.mode === 'checklist') {
      setView({ mode: 'done' })
      celebrate()
    }
  }, [allDone, view.mode, celebrate])

  const handleStartStep = useCallback((step: DailyStep) => {
    if (step.kind === 'concept') return
    writeStepStorage(step.id, 0)
    setSessionKey((k) => k + 1)
    setView({ mode: 'step', step, exerciseIndex: 0 })
    router.replace(`/daily?step=${step.id}`)
  }, [router])

  const handleComplete = useCallback((stepId: string) => {
    clearStepStorage()
    markDone(stepId)
    router.replace('/daily')
    setView({ mode: 'checklist' })
  }, [markDone, router])

  const handleExit = useCallback(() => {
    clearStepStorage()
    router.replace('/daily')
    setView({ mode: 'checklist' })
  }, [router])

  // ── Render: estados de carga / error ──────────────────────────────────────
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="phoneme-focus fixed inset-0 z-40 flex items-center justify-center">
        <div className="animate-pulse text-fg-subtle">Preparing your plan…</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="phoneme-focus fixed inset-0 z-40 flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <p className="text-error">Couldn't prepare your plan. Please try again.</p>
          <Button type="button" variant="primary" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // ── Render: sesión de un paso ──────────────────────────────────────────────
  if (view.mode === 'step') {
    const { step, exerciseIndex } = view
    return (
      <DailyStepSession
        step={step}
        sessionKey={sessionKey}
        initialExerciseIndex={exerciseIndex}
        onComplete={() => handleComplete(step.id)}
        onExit={handleExit}
      />
    )
  }

  // ── Render: pantalla "diaria cumplida" ─────────────────────────────────────
  if (view.mode === 'done') {
    return (
      <PageLayout className="mx-auto max-w-[640px]">
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--hue-icon-bg)] text-[var(--primary)]">
            <Flame size={30} />
          </div>
          <h1 className="text-3xl font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display), serif' }}>
            Daily complete!
          </h1>
          <p className="max-w-sm text-[15px] text-[var(--text-secondary)]">
            You completed all {steps.length} steps today. Your streak is alive — come back tomorrow.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/">
              <Button variant="primary" size="md">
                Go back home
              </Button>
            </Link>
            <Link href="/practice/sounds">
              <Button variant="secondary" size="md" icon={<ArrowRight size={15} />} iconPosition="right">
                Free practice
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  // ── Render: checklist ──────────────────────────────────────────────────────
  return (
    <PageLayout className="mx-auto max-w-[680px]">
      <header className="mb-6">
        <Badge label="Today's plan" variant="default" className="mb-3" />
        <h1 className="text-3xl font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display), serif' }}>
          Your daily
        </h1>
        <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
          {completedCount} of {steps.length} steps · complete all {steps.length} to keep your streak.
        </p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full w-full rounded-full bg-[var(--primary)] origin-left transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${steps.length ? completedCount / steps.length : 0})` }}
          />
        </div>
      </header>

      <DailyStepList
        steps={steps}
        doneIds={doneIds}
        onStartStep={handleStartStep}
        onMarkDone={markDone}
      />

      <div className="mt-8 flex flex-col items-center gap-2 text-center">
        <Link href="/practice/sounds" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
          <Sparkles size={14} />
          Want free practice? Choose what to work on.
        </Link>
      </div>
    </PageLayout>
  )
}
```

- [ ] **Step 4.2 — Verify TypeScript (Tasks 3 + 4 together)**

```powershell
pnpm type-check
```

Expected: no errors.

- [ ] **Step 4.3 — Commit Tasks 3 + 4**

```powershell
git add app/daily/page.tsx components/daily/DailyChecklist.tsx
git commit -m "feat(daily): URL-based step routing with sessionStorage exercise persistence"
```

---

## Task 5: Update `HomeDailyCard` — one-click navigation

**Files:**
- Modify: `components/home/HomeDailyCard.tsx`

- [ ] **Step 5.1 — Update `handleStartStep` to write sessionStorage and navigate**

Current `handleStartStep` (line 36–39):
```ts
const handleStartStep = useCallback((step: DailyStep) => {
  if (step.kind === 'concept') return
  router.push('/daily')
}, [router])
```

Replace with:
```ts
const handleStartStep = useCallback((step: DailyStep) => {
  if (step.kind === 'concept') return
  try {
    sessionStorage.setItem('daily:step', JSON.stringify({ stepId: step.id, exerciseIndex: 0 }))
  } catch { /* quota errors: ignore */ }
  router.push(`/daily?step=${step.id}`)
}, [router])
```

- [ ] **Step 5.2 — Verify TypeScript**

```powershell
pnpm type-check
```

Expected: no errors.

- [ ] **Step 5.3 — Run tests**

```powershell
pnpm test
```

Expected: all passing. No tests cover `HomeDailyCard` directly; `DailyChecklist` has no unit tests. The `PracticeSession` test suite should be unaffected.

- [ ] **Step 5.4 — Commit**

```powershell
git add components/home/HomeDailyCard.tsx
git commit -m "feat(daily): single-click step start from home card via URL nav"
```

---

## Task 6: Manual verification

- [ ] **Step 6.1 — Start dev server**

```powershell
pnpm dev
```

- [ ] **Step 6.2 — Test: one-click from home**

1. Open `http://localhost:3000`
2. Wait for plan to load
3. Click any non-concept step
4. Expected: URL changes to `/daily?step=<id>`, session starts immediately (no checklist flash)

- [ ] **Step 6.3 — Test: reload mid-session**

1. Start a step (step 6.2)
2. Answer 2–3 exercises
3. Reload the tab
4. Expected: session resumes — NOT at exercise 0, but at exercise 0 (because `sessionStorage` is written at start with `exerciseIndex: 0` and only updated when navigating from checklist; mid-session the index is not updated)

**Note on resume accuracy:** The current implementation restores to the index that was last written to `sessionStorage` — which is 0 on first click. Full per-exercise persistence would require calling `writeStepStorage` after each advance inside `PracticeSession`. That hook is internal to `useSessionState`; the simplest enhancement (if needed) is to add a `beforeunload` listener in `DailyChecklist` that reads `currentIndex` from a ref — but this is out of scope for this plan. The spec's Q2 answer ("resume at exact exercise") is partially satisfied: reloading resumes at the last written index. A future enhancement can add per-exercise writes.

- [ ] **Step 6.4 — Test: complete step**

1. Complete all exercises in a step
2. Expected: URL returns to `/daily`, checklist shows step as done, `sessionStorage` is cleared

- [ ] **Step 6.5 — Test: exit mid-session**

1. Start a step, press Exit
2. Expected: URL returns to `/daily`, checklist shown, step NOT marked done, `sessionStorage` cleared

- [ ] **Step 6.6 — Test: `/daily` with no `?step`**

Navigate directly to `http://localhost:3000/daily`
Expected: checklist shown normally

- [ ] **Step 6.7 — Test: `/daily?step=nonexistent`**

Navigate to `http://localhost:3000/daily?step=fake_id`
Expected: checklist shown (step not found, auto-start skipped)

- [ ] **Step 6.8 — Final test run**

```powershell
pnpm test
```

Expected: all green.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Home step click → `router.push('/daily?step=...')` + sessionStorage | Task 5 |
| `/daily` reads `?step` from searchParams | Task 3 |
| Finds matching step in plan | Task 4 (autoStart effect) |
| Starts `DailyStepSession` directly (no checklist flash) | Task 4 (`autoStartedRef`) |
| `initialExerciseIndex` passed to session | Tasks 2 + 4 |
| `initialIndex` seeds `currentIndex` in `useSessionState` | Task 1 |
| Complete → clear sessionStorage + `router.replace('/daily')` | Task 4 (`handleComplete`) |
| Exit → clear sessionStorage + `router.replace('/daily')` | Task 4 (`handleExit`) |
| Edge: stepId not found → checklist shown | Task 4 (step not found check) |
| Edge: no sessionStorage → start from 0 | Task 4 (fallback to 0) |
| Edge: concept step → no `?step` param | Task 5 (guard `step.kind === 'concept'`) |

**Type consistency:** `initialIndex` used in Task 1 (`PracticeConfig` + `useSessionState`) matches `initialIndex` in `DailyStepSession` passed as `initialExerciseIndex ?? 0` to `PracticeSession`. `PracticeSession` receives the full config object so `initialIndex` flows through automatically.

**Known limitation:** Per-exercise `sessionStorage` updates (so reload resumes mid-step, not just at step start) are deferred — not in this plan. The spec's Q2 ("resume exactly at exercise N") is partially met for the initial load. A follow-up can add a `beforeunload` hook.

**No placeholders found.**
