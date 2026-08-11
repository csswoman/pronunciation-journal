# Daily Page Home Plan Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/daily` render today’s plan with the same card UI as Home (`bg-daily-card`, segmented progress, collapsed steps), while keeping Daily session/recap logic and adding a light recommended-practice nudge.

**Architecture:** Extract presentational `DailyPlanCard` from `HomeDailyCard`. Home becomes a thin orchestrator (load plan → navigate to `/daily?step=`). `DailyChecklist` keeps its own `useDailyPlan` + in-page session, and renders `DailyPlanCard` + optional `RecommendedPracticeCard` under the existing page chrome.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Vitest + Testing Library, `pnpm`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-08-daily-page-home-plan-card-design.md`
- Home visual is source of truth; both surfaces pass `collapseFutureSteps`
- No business logic in `/app` pages; keep Supabase/Gemini rules from `CLAUDE.md`
- Components ≤250 lines; Tailwind tokens only; no inline prompts
- Offline: Daily plan still from Dexie/`useDailyPlan`; recommended nudge degrades to hidden if no arc
- Do not embed full `/practice` hub (`PracticeOptionsGrid` / `SpeakWithCoachCard`)

---

## File Structure

| File | Responsibility |
| --- | --- |
| `components/daily/DailyPlanCard.tsx` | Presentational plan card (Home chrome + states + collapsed list) |
| `components/daily/__tests__/DailyPlanCard.test.tsx` | Card loading / ready-collapsed / error |
| `components/home/HomeDailyCard.tsx` | Orchestrator: `useDailyPlan`, status callback, navigate on start → `DailyPlanCard` |
| `components/daily/DailyChecklist.tsx` | Page orchestrator: session/recap + checklist layout with card + recommended nudge |
| `components/daily/__tests__/DailyChecklist.test.tsx` | Checklist uses card; start opens step mode; recommended when arc present |

---

### Task 1: `DailyPlanCard` — failing tests

**Files:**
- Create: `components/daily/__tests__/DailyPlanCard.test.tsx`
- Create (stub later): `components/daily/DailyPlanCard.tsx`

**Interfaces:**
- Consumes: `DailyStep`, `DailyStepStatus`, `DailyPlanStatus` from `@/hooks/useDailyPlan`
- Produces: tests that define the public `DailyPlanCard` props used in Tasks 2–3

- [ ] **Step 1: Write failing tests**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DailyPlanCard from '../DailyPlanCard'
import type { DailyStep, DailyStepStatus } from '@/hooks/useDailyPlan'

function makeStep(overrides: Partial<DailyStep> = {}): DailyStep {
  return {
    kind: 'word_review',
    id: 'step-1',
    title: 'Repaso de palabras',
    subtitle: 'Afianza 6 palabras de tu vocabulario',
    icon: 'book',
    exercises: [{ id: 'ex-1' } as DailyStep['exercises'][number]],
    estMinutes: 5,
    ...overrides,
  }
}

function statusMap(map: Record<string, DailyStepStatus>) {
  return (stepId: string) => map[stepId] ?? 'pending'
}

describe('DailyPlanCard', () => {
  it('shows loading skeleton copy when status is loading', () => {
    render(
      <DailyPlanCard
        status="loading"
        steps={[]}
        getStepStatus={statusMap({})}
        completedCount={0}
        allDone={false}
        onStartStep={vi.fn()}
        collapseFutureSteps
      />,
    )
    expect(screen.getByText('Preparando tu plan…')).toBeInTheDocument()
    expect(screen.getByLabelText('Plan de hoy')).toBeInTheDocument()
  })

  it('shows error + retry when status is error', async () => {
    const onRetry = vi.fn()
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(
      <DailyPlanCard
        status="error"
        steps={[]}
        getStepStatus={statusMap({})}
        completedCount={0}
        allDone={false}
        onStartStep={vi.fn()}
        onRetry={onRetry}
        collapseFutureSteps
      />,
    )
    expect(screen.getByText('No se pudo preparar tu plan.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders collapsed plan list with Plan de hoy label when ready', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Palabras nuevas', estMinutes: 3 }),
      makeStep({ id: 's2', title: 'Repaso de palabras', estMinutes: 8 }),
      makeStep({ id: 's3', title: 'Práctica en contexto', estMinutes: 5 }),
      makeStep({ id: 's4', title: 'Estudia teoría', estMinutes: 5 }),
      makeStep({ id: 's5', title: 'Sentence stress', estMinutes: 2 }),
    ]
    render(
      <DailyPlanCard
        status="ready"
        steps={steps}
        getStepStatus={statusMap({})}
        completedCount={0}
        allDone={false}
        onStartStep={vi.fn()}
        collapseFutureSteps
      />,
    )
    expect(screen.getByText('Plan de hoy')).toBeInTheDocument()
    expect(screen.getByText('Palabras nuevas')).toBeInTheDocument()
    expect(screen.getByText(/Ver \d+ más/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `pnpm test components/daily/__tests__/DailyPlanCard.test.tsx`

Expected: FAIL — module `../DailyPlanCard` not found (or export missing).

- [ ] **Step 3: Commit tests**

```bash
git add components/daily/__tests__/DailyPlanCard.test.tsx
git commit -m "test: add failing DailyPlanCard coverage"
```

---

### Task 2: Implement `DailyPlanCard`

**Files:**
- Create: `components/daily/DailyPlanCard.tsx`
- Test: `components/daily/__tests__/DailyPlanCard.test.tsx`

**Interfaces:**
- Consumes: `DailyStepList`, `readInProgressStepId`, `PlanSegmentProgress`, `Button`, `Link`
- Produces:

```ts
export interface DailyPlanCardProps {
  status: DailyPlanStatus
  steps: DailyStep[]
  getStepStatus: (stepId: string) => DailyStepStatus
  completedCount: number
  allDone: boolean
  onStartStep: (step: DailyStep) => void
  onRetry?: () => void
  collapseFutureSteps?: boolean
  reviewDue?: boolean
  isNewLearner?: boolean
  demoteEntryHighlight?: boolean
  inProgressStepId?: string | null
  /** Optional content between progress row and step list (e.g. HomeFirstSessionHint). */
  listPrefix?: React.ReactNode
}
```

- [ ] **Step 1: Implement `DailyPlanCard`**

Move the JSX/state currently inside `HomeDailyCard`’s `<section aria-label="Plan de hoy">` into this file. Keep file ≤250 lines.

```tsx
'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from '@/components/icons'
import Button from '@/components/ui/Button'
import DailyStepList, { readInProgressStepId } from '@/components/daily/DailyStepList'
import { PlanSegmentProgress } from '@/components/home/PlanSegmentProgress'
import type {
  DailyPlanStatus,
  DailyStep,
  DailyStepStatus,
} from '@/hooks/useDailyPlan'

// Planned structure:
// <DailyPlanCard>
//   <loading | error | empty | ready list>
//   <PlanSegmentProgress />
//   {listPrefix}
//   <DailyStepList collapseFutureSteps />
// </DailyPlanCard>

export interface DailyPlanCardProps {
  status: DailyPlanStatus
  steps: DailyStep[]
  getStepStatus: (stepId: string) => DailyStepStatus
  completedCount: number
  allDone: boolean
  onStartStep: (step: DailyStep) => void
  onRetry?: () => void
  collapseFutureSteps?: boolean
  reviewDue?: boolean
  isNewLearner?: boolean
  demoteEntryHighlight?: boolean
  inProgressStepId?: string | null
  listPrefix?: ReactNode
}

export default function DailyPlanCard({
  status,
  steps,
  getStepStatus,
  completedCount,
  allDone,
  onStartStep,
  onRetry,
  collapseFutureSteps = false,
  reviewDue = false,
  isNewLearner = false,
  demoteEntryHighlight = false,
  inProgressStepId: inProgressStepIdProp,
  listPrefix,
}: DailyPlanCardProps) {
  const [inProgressStepId, setInProgressStepId] = useState<string | null>(null)

  useEffect(() => {
    if (inProgressStepIdProp !== undefined) {
      setInProgressStepId(inProgressStepIdProp)
      return
    }
    setInProgressStepId(readInProgressStepId())
  }, [status, steps, inProgressStepIdProp])

  const entryStep = useMemo(() => {
    return steps.find((s) => {
      const st = getStepStatus(s.id)
      return st !== 'done' && st !== 'resolved'
    })
  }, [steps, getStepStatus])

  const remainingMinutes = useMemo(() => {
    return steps.reduce((sum, s) => {
      const st = getStepStatus(s.id)
      if (st === 'done' || st === 'resolved') return sum
      return sum + (s.estMinutes || 0)
    }, 0)
  }, [steps, getStepStatus])

  const progressLabel = useMemo(() => {
    if (steps.length === 0) return ''
    if (completedCount === 0) {
      const parts = [`${steps.length} ${steps.length === 1 ? 'paso' : 'pasos'}`]
      if (inProgressStepId) parts.push('en curso')
      if (remainingMinutes > 0) parts.push(`${remainingMinutes} min`)
      return parts.join(' · ')
    }
    const parts = [`${completedCount} de ${steps.length}`]
    if (inProgressStepId) parts.push('en curso')
    if (remainingMinutes > 0) parts.push(`${remainingMinutes} min restantes`)
    return parts.join(' · ')
  }, [steps.length, completedCount, inProgressStepId, remainingMinutes])

  return (
    <section aria-label="Plan de hoy">
      <div className="flex flex-col rounded-xl border border-border-subtle bg-daily-card px-[var(--layout-card-pad)] pb-[var(--layout-card-pad)] pt-5">
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {status === 'ready' && !allDone && `Plan de hoy listo, ${steps.length} pasos`}
          {status === 'ready' && allDone && 'Plan diario completo'}
        </div>

        {(status === 'loading' || status === 'idle') && (
          <div className="flex flex-col gap-2.5">
            {(['w-4/5', 'w-3/4', 'w-11/12', 'w-2/3', 'w-5/6'] as const).map((widthClass, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-6 shrink-0 animate-pulse rounded bg-surface-sunken" />
                <div className={`h-4 animate-pulse rounded-md bg-surface-sunken ${widthClass}`} />
              </div>
            ))}
            <p className="font-body-sm mt-2 animate-pulse text-center text-fg-muted">
              Preparando tu plan…
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-state-in flex flex-col items-center gap-3 py-[var(--layout-section-gap)] text-center">
            <p className="font-body-sm text-error">No se pudo preparar tu plan.</p>
            {onRetry ? (
              <Button type="button" variant="primary" size="md" onClick={() => void onRetry()}>
                Reintentar
              </Button>
            ) : null}
          </div>
        )}

        {status === 'ready' && !allDone && steps.length === 0 && (
          <div className="animate-state-in flex flex-col items-center gap-4 py-[var(--layout-section-gap)] text-center">
            <div className="flex flex-col gap-1.5">
              <p className="font-label font-semibold text-fg">
                {reviewDue
                  ? 'Después del repaso, arma tu plan.'
                  : isNewLearner
                    ? 'Aquí verás tu plan del día'
                    : 'Tu plan está vacío hoy.'}
              </p>
              <p className="font-body-sm max-w-[36ch] text-pretty text-fg-muted">
                {isNewLearner && !reviewDue
                  ? 'Cuando practiques sonidos o un curso, aparecen pasos claros para hoy.'
                  : 'Se arma cuando empiezas un curso o practicas sonidos.'}
              </p>
            </div>
            {!isNewLearner || reviewDue ? (
              <Link href="/courses">
                <Button
                  variant={reviewDue ? 'secondary' : 'primary'}
                  size="md"
                  icon={<ArrowRight size={18} />}
                  iconPosition="right"
                >
                  Explorar cursos
                </Button>
              </Link>
            ) : null}
          </div>
        )}

        {status === 'ready' && allDone ? (
          <p className="sr-only">Plan diario completo</p>
        ) : null}

        {status === 'ready' && !allDone && steps.length > 0 ? (
          <div className="animate-state-in flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="font-label shrink-0 text-fg">Plan de hoy</span>
              <PlanSegmentProgress
                stepIds={steps.map((s) => s.id)}
                completedCount={completedCount}
                getStepStatus={getStepStatus}
                activeStepId={inProgressStepId}
                entryStepId={entryStep?.id ?? null}
              />
              <span className="font-caption shrink-0 tabular-nums text-fg-muted">
                {progressLabel}
              </span>
            </div>
            {listPrefix}
            <DailyStepList
              steps={steps}
              getStepStatus={getStepStatus}
              onStartStep={onStartStep}
              inProgressStepId={inProgressStepId}
              demoteEntryHighlight={demoteEntryHighlight}
              collapseFutureSteps={collapseFutureSteps}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Run tests — expect PASS**

Run: `pnpm test components/daily/__tests__/DailyPlanCard.test.tsx`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/daily/DailyPlanCard.tsx components/daily/__tests__/DailyPlanCard.test.tsx
git commit -m "feat(daily): extract DailyPlanCard from Home visual"
```

---

### Task 3: Thin `HomeDailyCard` wrapper

**Files:**
- Modify: `components/home/HomeDailyCard.tsx`
- Verify: `pnpm test components/home/__tests__/HomeCommandGrid.test.tsx`

**Interfaces:**
- Consumes: `DailyPlanCard` props from Task 2
- Produces: unchanged public `HomeDailyCard` / `HomePlanStatus` API for `HomeCommandGrid`

- [ ] **Step 1: Rewrite `HomeDailyCard` as orchestrator**

Replace the presentational JSX with `DailyPlanCard`. Keep `useDailyPlan`, celebrate, `onPlanStatusChange`, and navigate-on-start.

```tsx
'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DailyPlanCard from '@/components/daily/DailyPlanCard'
import HomeFirstSessionHint from '@/components/home/HomeFirstSessionHint'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'
import { useAuth } from '@/components/auth/AuthProvider'
import type { SessionArc } from '@/lib/practice/types'

/** Review kinds already surfaced as plan step 01 — banner would duplicate the CTA. */
const REVIEW_ENTRY_KINDS = new Set(['word_review', 'word_intro'])

export interface HomePlanStatus {
  empty: boolean
  settled: boolean
  reviewIsEntry: boolean
  conceptSlug: string | null
  allDone: boolean
  arc: SessionArc | undefined
  stepCount: number
}

interface HomeDailyCardProps {
  conceptLesson: ConceptLesson | null
  reviewDue?: boolean
  isNewLearner?: boolean
  showFirstSessionHint?: boolean
  onPlanStatusChange?: (status: HomePlanStatus) => void
}

function isReviewEntryStep(step: DailyStep | undefined): boolean {
  if (!step) return false
  if (REVIEW_ENTRY_KINDS.has(step.kind)) return true
  return step.id.startsWith('review_sound:') || step.id === 'failed_sentences'
}

export default function HomeDailyCard({
  conceptLesson,
  reviewDue = false,
  isNewLearner = false,
  showFirstSessionHint = false,
  onPlanStatusChange,
}: HomeDailyCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { status, steps, getStepStatus, completedCount, allDone, arc, load, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: false,
  })

  useEffect(() => {
    if (user && status === 'idle') void load()
  }, [user, status, load])

  useEffect(() => {
    if (allDone) celebrate()
  }, [allDone, celebrate])

  const entryStep = useMemo(() => {
    return steps.find((s) => {
      const st = getStepStatus(s.id)
      return st !== 'done' && st !== 'resolved'
    })
  }, [steps, getStepStatus])

  const reviewIsEntry = isReviewEntryStep(entryStep)
  const conceptSlug =
    steps.find((s) => s.kind === 'concept' && s.id.startsWith('concept:'))?.id.replace(/^concept:/, '') ??
    null
  const demoteEntryHighlight = reviewDue && !reviewIsEntry

  useEffect(() => {
    if (!onPlanStatusChange) return
    if (status === 'loading' || status === 'idle') {
      onPlanStatusChange({
        empty: false,
        settled: false,
        reviewIsEntry: false,
        conceptSlug: null,
        allDone: false,
        arc: undefined,
        stepCount: 0,
      })
      return
    }
    const empty = status === 'ready' && !allDone && steps.length === 0
    onPlanStatusChange({
      empty,
      settled: status === 'ready' || status === 'error',
      reviewIsEntry: status === 'ready' && reviewIsEntry,
      conceptSlug: status === 'ready' ? conceptSlug : null,
      allDone: status === 'ready' && allDone,
      arc: status === 'ready' ? arc : undefined,
      stepCount: steps.length,
    })
  }, [status, allDone, steps.length, reviewIsEntry, conceptSlug, arc, onPlanStatusChange])

  const handleStartStep = useCallback((step: DailyStep) => {
    if (step.kind === 'concept') return
    try {
      sessionStorage.setItem('daily:step', JSON.stringify({ stepId: step.id, exerciseIndex: 0 }))
    } catch { /* quota errors: ignore */ }
    router.push(`/daily?step=${step.id}`)
  }, [router])

  return (
    <DailyPlanCard
      status={status}
      steps={steps}
      getStepStatus={getStepStatus}
      completedCount={completedCount}
      allDone={allDone}
      onStartStep={handleStartStep}
      onRetry={() => void load()}
      collapseFutureSteps
      reviewDue={reviewDue}
      isNewLearner={isNewLearner}
      demoteEntryHighlight={demoteEntryHighlight}
      listPrefix={<HomeFirstSessionHint enabled={showFirstSessionHint} />}
    />
  )
}
```

- [ ] **Step 2: Run Home + card tests**

Run: `pnpm test components/daily/__tests__/DailyPlanCard.test.tsx components/home/__tests__/HomeCommandGrid.test.tsx`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/home/HomeDailyCard.tsx
git commit -m "refactor(home): HomeDailyCard wraps shared DailyPlanCard"
```

---

### Task 4: Wire `DailyChecklist` to `DailyPlanCard` + recommended nudge

**Files:**
- Modify: `components/daily/DailyChecklist.tsx`
- Create: `components/daily/__tests__/DailyChecklist.test.tsx`

**Interfaces:**
- Consumes: `DailyPlanCard`, `RecommendedPracticeCard`, `resolveRecommendedMode`
- Produces: checklist mode layout per spec; session/recap unchanged

- [ ] **Step 1: Write failing checklist tests**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { DailyStep } from '@/hooks/useDailyPlan'

const startStep = vi.fn()
const mockState = vi.hoisted(() => ({
  status: 'ready' as const,
  steps: [] as DailyStep[],
  allDone: false,
  completedCount: 0,
  arc: undefined as { soundIpa: string; topicLabel: string; sessionWords: string[] } | undefined,
  getStepStatus: (_id: string) => 'pending' as const,
  load: vi.fn(),
  markDone: vi.fn(),
  celebrate: vi.fn(),
  plan: null as { arc?: typeof mockState.arc } | null,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))

vi.mock('@/hooks/useDailyPlan', () => ({
  useDailyPlan: () => ({
    plan: mockState.plan ?? { arc: mockState.arc },
    status: mockState.status,
    steps: mockState.steps,
    getStepStatus: mockState.getStepStatus,
    completedCount: mockState.completedCount,
    allDone: mockState.allDone,
    load: mockState.load,
    markDone: mockState.markDone,
    celebrate: mockState.celebrate,
  }),
}))

vi.mock('@/lib/review/client-queries', () => ({
  fetchDueTomorrowCount: vi.fn().mockResolvedValue(0),
}))

vi.mock('./DailyStepSession', () => ({
  default: () => <div>Step session</div>,
}))

vi.mock('./SessionRecapCard', () => ({
  default: () => <div>Recap</div>,
}))

vi.mock('./SessionOpeningBanner', () => ({
  default: () => <div>Opening banner</div>,
}))

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layout/PageHeader', () => ({
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}))

import DailyChecklist from '../DailyChecklist'

function makeStep(overrides: Partial<DailyStep> = {}): DailyStep {
  return {
    kind: 'word_review',
    id: 's1',
    title: 'Palabras nuevas',
    subtitle: '5 palabras',
    icon: 'book',
    exercises: [{ id: 'ex-1' } as DailyStep['exercises'][number]],
    estMinutes: 3,
    ...overrides,
  }
}

describe('DailyChecklist (checklist surface)', () => {
  beforeEach(() => {
    mockState.status = 'ready'
    mockState.allDone = false
    mockState.completedCount = 0
    mockState.steps = [
      makeStep({ id: 's1', title: 'Palabras nuevas' }),
      makeStep({ id: 's2', title: 'Repaso de palabras', estMinutes: 8 }),
      makeStep({ id: 's3', title: 'Práctica en contexto', estMinutes: 5 }),
      makeStep({ id: 's4', title: 'Estudia teoría', estMinutes: 5 }),
      makeStep({ id: 's5', title: 'Sentence stress', estMinutes: 2 }),
    ]
    mockState.arc = { soundIpa: 'h', topicLabel: 'aspiración', sessionWords: ['hello'] }
    mockState.plan = { arc: mockState.arc }
    startStep.mockClear()
  })

  it('keeps page title and renders Home-style plan card (collapsed)', () => {
    render(<DailyChecklist conceptLesson={null} />)
    expect(screen.getByRole('heading', { name: 'Plan diario' })).toBeInTheDocument()
    expect(screen.getByLabelText('Plan de hoy')).toBeInTheDocument()
    expect(screen.getByText(/Ver \d+ más/)).toBeInTheDocument()
  })

  it('shows recommended practice card when arc is present', () => {
    render(<DailyChecklist conceptLesson={null} />)
    expect(screen.getByText(/Keep going with \/h\//)).toBeInTheDocument()
  })

  it('hides recommended practice card when arc is missing', () => {
    mockState.arc = undefined
    mockState.plan = { arc: undefined }
    render(<DailyChecklist conceptLesson={null} />)
    expect(screen.queryByText(/Keep going with/)).not.toBeInTheDocument()
    expect(screen.getByText(/Want free practice/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `pnpm test components/daily/__tests__/DailyChecklist.test.tsx`

Expected: FAIL — still renders bare `DailyStepList` / no recommended card / no `aria-label="Plan de hoy"`.

- [ ] **Step 3: Update `DailyChecklist` checklist render path**

Remove the early fullscreen loading/error returns for checklist. Keep step + done early returns. In checklist mode:

```tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles } from '@/components/icons'
import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import RecommendedPracticeCard from '@/components/practice/hub/RecommendedPracticeCard'
import { resolveRecommendedMode } from '@/lib/practice/practice-modes'
import DailyStepSession from './DailyStepSession'
import SessionOpeningBanner from './SessionOpeningBanner'
import SessionRecapCard from './SessionRecapCard'
import DailyPlanCard from './DailyPlanCard'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'
import { fetchDueTomorrowCount } from '@/lib/review/client-queries'

export type { ConceptLesson }

// … keep STORAGE_KEY helpers + View + props unchanged …

export default function DailyChecklist({ conceptLesson, initialStepId, streak = null }: DailyChecklistProps) {
  // … keep existing hook/state/effects/handlers …

  if (view.mode === 'step') {
    // unchanged DailyStepSession return
  }

  if (view.mode === 'done') {
    // unchanged SessionRecapCard return
  }

  const recommendation = useMemo(() => {
    if (status !== 'ready' || !plan?.arc) return null
    return resolveRecommendedMode({
      fromDaily: true,
      arc: plan.arc,
      lastModeId: null,
    })
  }, [status, plan?.arc])

  return (
    <PageLayout archetype="session">
      <PageHeader
        variant="compact"
        kicker="Hoy"
        title="Plan diario"
        subtitle={
          status === 'ready' && steps.length > 0
            ? `${completedCount} de ${steps.length} pasos · completa los ${steps.length} para mantener tu racha.`
            : 'Preparando tu plan…'
        }
        progress={
          status === 'ready' && steps.length
            ? Math.round((completedCount / steps.length) * 100)
            : 0
        }
      />

      {status === 'ready' ? <SessionOpeningBanner arc={plan?.arc} /> : null}

      <DailyPlanCard
        status={status}
        steps={steps}
        getStepStatus={getStepStatus}
        completedCount={completedCount}
        allDone={allDone}
        onStartStep={handleStartStep}
        onRetry={() => void load()}
        collapseFutureSteps
      />

      {recommendation ? (
        <div className="mt-6">
          <RecommendedPracticeCard recommendation={recommendation} />
        </div>
      ) : null}

      <div className="mt-8 flex flex-col items-center gap-2 text-center">
        <Link
          href="/practice/sounds"
          className="inline-flex items-center gap-1.5 text-caption text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          <Sparkles size={14} />
          Want free practice? Choose what to work on.
        </Link>
      </div>
    </PageLayout>
  )
}
```

Notes for implementer:
- Delete unused `Button` import if error UI moved into the card.
- Keep `handleStartStep` as in-page session (not `router.push` to a new mount).
- `autoLoad: true` stays.
- Ensure file stays ≤250 lines; if over, extract storage helpers to `lib/daily/step-storage.ts` in the same task.

- [ ] **Step 4: Run checklist + card + Home tests**

Run: `pnpm test components/daily/__tests__/DailyPlanCard.test.tsx components/daily/__tests__/DailyChecklist.test.tsx components/daily/__tests__/DailyStepList.test.tsx components/home/__tests__/HomeCommandGrid.test.tsx`

Expected: PASS

- [ ] **Step 5: Manual smoke**

1. Open `/` — Plan de hoy card unchanged (collapse + segments).
2. Open `/daily` — PageHeader “Plan diario”, Home-style card, collapse, banner, recommended CTA when arc exists, free-practice link.
3. Click “Empieza aquí” on `/daily` — enters `DailyStepSession`.
4. From Home, click a step — lands on `/daily?step=` and auto-starts.

- [ ] **Step 6: Commit**

```bash
git add components/daily/DailyChecklist.tsx components/daily/__tests__/DailyChecklist.test.tsx
git commit -m "feat(daily): use DailyPlanCard and light practice nudge on /daily"
```

---

## Spec coverage self-check

| Spec requirement | Task |
| --- | --- |
| Extract shared Home visual card | Tasks 1–2 |
| Home thin wrapper + navigate on start | Task 3 |
| `/daily` keeps PageHeader, banner, free-practice link | Task 4 |
| Collapse on `/daily` | Task 4 (`collapseFutureSteps`) |
| In-page session + recap unchanged | Task 4 (early returns kept) |
| Light `RecommendedPracticeCard` only | Task 4 |
| Loading/error use card chrome, not fullscreen | Task 4 |
| Home `onPlanStatusChange` intact | Task 3 + HomeCommandGrid test |

## Placeholder / type consistency check

- `DailyPlanCardProps` names match across Tasks 1–4.
- `collapseFutureSteps` boolean prop spelling consistent.
- `resolveRecommendedMode({ fromDaily: true, arc, lastModeId: null })` matches `lib/practice/practice-modes.ts`.
- No TBD/TODO left in steps.
