# Home Daily Plan Collapse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On Home's "Plan de hoy" card, collapse future/done steps into compact one-line rows so the daily plan card doesn't push the rest of Home below the fold, while `/daily` (the dedicated plan page) keeps showing every step fully expanded.

**Architecture:** Add an opt-in `collapseFutureSteps` prop to `DailyStepList`. When `true`, the component classifies each row as `expanded` (the current/entry step) or `compact` (done or pending steps beyond the current one), renders the first 2 compact pending rows plus all compact done rows, and hides any remaining pending rows behind a "Ver N más" toggle. `HomeDailyCard` passes the new prop; `DailyChecklist` (`/daily`) does not, so its behavior is byte-for-byte unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Vitest + @testing-library/react.

---

## File Structure

- **Modify:** `components/daily/DailyStepList.tsx` — add `collapseFutureSteps` prop, compact-row rendering branch, "ver más" toggle state.
- **Modify:** `components/home/HomeDailyCard.tsx` — pass `collapseFutureSteps` to `DailyStepList`.
- **Create:** `components/daily/__tests__/DailyStepList.test.tsx` — new test file (none exists today) covering both the default (uncollapsed, `/daily`-equivalent) behavior and the new collapsed behavior.

No new files beyond the test — the full/compact row markup is a conditional branch inside the existing per-step `.map()`, not different enough in structure to warrant a separate component (both are the same `<li>` wrapper with a `<button>`/`<Link>`, differing only in the inner content and row height class).

---

### Task 1: Add failing tests for default (uncollapsed) `DailyStepList` behavior

**Files:**
- Create: `components/daily/__tests__/DailyStepList.test.tsx`

Before touching the collapse logic, lock down the existing behavior with tests, since none exist yet. This also gives a safety net proving `/daily` (which never passes `collapseFutureSteps`) is unaffected by the later change.

- [ ] **Step 1: Write the test file covering current (default) rendering**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DailyStepList from '../DailyStepList'
import type { DailyStep, DailyStepStatus } from '@/hooks/useDailyPlan'

function makeStep(overrides: Partial<DailyStep> = {}): DailyStep {
  return {
    kind: 'word_review',
    id: 'step-1',
    title: 'Repaso de palabras',
    subtitle: 'Afianza 6 palabras de tu léxico',
    icon: 'book',
    exercises: [{ id: 'ex-1' } as DailyStep['exercises'][number]],
    estMinutes: 5,
    ...overrides,
  }
}

function statusMap(map: Record<string, DailyStepStatus>) {
  return (stepId: string) => map[stepId] ?? 'pending'
}

describe('DailyStepList (default, collapseFutureSteps unset)', () => {
  it('renders every step fully expanded with title, subtitle, and meta', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Repaso de palabras' }),
      makeStep({ id: 's2', title: 'Lectura', subtitle: 'Tus palabras recientes' }),
      makeStep({ id: 's3', title: 'Práctica de sonido', subtitle: '4 ejercicios' }),
    ]
    render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({})}
        onStartStep={vi.fn()}
      />,
    )

    expect(screen.getByText('Repaso de palabras')).toBeInTheDocument()
    expect(screen.getByText(/Afianza 6 palabras/)).toBeInTheDocument()
    expect(screen.getByText('Lectura')).toBeInTheDocument()
    expect(screen.getByText(/Tus palabras recientes/)).toBeInTheDocument()
    expect(screen.getByText('Práctica de sonido')).toBeInTheDocument()
    expect(screen.queryByText(/Ver \d+ más/)).not.toBeInTheDocument()
  })

  it('marks the first non-done step as the entry point ("Empieza aquí")', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Repaso de palabras' }),
      makeStep({ id: 's2', title: 'Lectura' }),
    ]
    render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({})}
        onStartStep={vi.fn()}
      />,
    )
    expect(screen.getByText('Empieza aquí')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they pass against current implementation**

Run: `pnpm test components/daily/__tests__/DailyStepList.test.tsx`
Expected: PASS (this locks down existing behavior before any change)

- [ ] **Step 3: Commit**

```bash
git add components/daily/__tests__/DailyStepList.test.tsx
git commit -m "test: cover DailyStepList default (uncollapsed) rendering"
```

---

### Task 2: Write failing tests for the new `collapseFutureSteps` behavior

**Files:**
- Modify: `components/daily/__tests__/DailyStepList.test.tsx`

- [ ] **Step 1: Add the new describe block with failing tests**

Append to the same test file:

```tsx
describe('DailyStepList (collapseFutureSteps=true)', () => {
  it('renders the current step expanded and up to 2 pending steps compact, with a toggle for the rest', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Repaso de palabras', subtitle: 'Afianza 6 palabras' }),
      makeStep({ id: 's2', title: 'Lectura', subtitle: 'Tus palabras recientes', estMinutes: 3 }),
      makeStep({ id: 's3', title: 'Práctica de sonido', subtitle: '4 ejercicios', estMinutes: 8 }),
      makeStep({ id: 's4', title: 'Estudia teoría', subtitle: 'Cómo estudiar', estMinutes: 5 }),
      makeStep({ id: 's5', title: 'Irregular past tense', subtitle: 'Grammar of the day', estMinutes: 2 }),
    ]
    render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({})}
        onStartStep={vi.fn()}
        collapseFutureSteps
      />,
    )

    // Current step: expanded (subtitle visible). Regex, not exact string —
    // the expanded row joins subtitle + stepMeta() into one text node
    // (e.g. "Afianza 6 palabras · 1 ejercicio · ≈5 min"), same as Task 1's tests.
    expect(screen.getByText('Repaso de palabras')).toBeInTheDocument()
    expect(screen.getByText(/Afianza 6 palabras/)).toBeInTheDocument()
    expect(screen.getByText('Empieza aquí')).toBeInTheDocument()

    // Next 2 pending steps: compact (title + time visible, subtitle not)
    expect(screen.getByText('Lectura')).toBeInTheDocument()
    expect(screen.getByText(/≈3 min/)).toBeInTheDocument()
    expect(screen.queryByText('Tus palabras recientes')).not.toBeInTheDocument()

    expect(screen.getByText('Práctica de sonido')).toBeInTheDocument()
    expect(screen.getByText(/≈8 min/)).toBeInTheDocument()
    expect(screen.queryByText('4 ejercicios')).not.toBeInTheDocument()

    // Remaining 2 steps hidden behind the toggle
    expect(screen.queryByText('Estudia teoría')).not.toBeInTheDocument()
    expect(screen.queryByText('Irregular past tense')).not.toBeInTheDocument()
    expect(screen.getByText('Ver 2 más')).toBeInTheDocument()
  })

  it('reveals the remaining compact steps when the toggle is clicked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const steps = [
      makeStep({ id: 's1', title: 'Repaso de palabras' }),
      makeStep({ id: 's2', title: 'Lectura', estMinutes: 3 }),
      makeStep({ id: 's3', title: 'Práctica de sonido', estMinutes: 8 }),
      makeStep({ id: 's4', title: 'Estudia teoría', estMinutes: 5 }),
    ]
    render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({})}
        onStartStep={vi.fn()}
        collapseFutureSteps
      />,
    )

    expect(screen.queryByText('Estudia teoría')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('Ver 1 más'))
    expect(screen.getByText('Estudia teoría')).toBeInTheDocument()
    expect(screen.queryByText(/Ver \d+ más/)).not.toBeInTheDocument()
  })

  it('does not show the toggle when there are 2 or fewer pending steps beyond the current one', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Repaso de palabras' }),
      makeStep({ id: 's2', title: 'Lectura' }),
      makeStep({ id: 's3', title: 'Práctica de sonido' }),
    ]
    render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({})}
        onStartStep={vi.fn()}
        collapseFutureSteps
      />,
    )
    expect(screen.queryByText(/Ver \d+ más/)).not.toBeInTheDocument()
  })

  it('renders done steps compact with a check, never hidden, and does not count them against the pending budget', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Repaso de palabras', subtitle: 'Ya completado' }),
      makeStep({ id: 's2', title: 'Lectura' }),
      makeStep({ id: 's3', title: 'Práctica de sonido' }),
      makeStep({ id: 's4', title: 'Estudia teoría' }),
      makeStep({ id: 's5', title: 'Irregular past tense' }),
    ]
    render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({ s1: 'done' })}
        onStartStep={vi.fn()}
        collapseFutureSteps
      />,
    )

    // Done step: compact (title + "Hecho", no subtitle), always visible —
    // does not consume any of the 2-pending-visible budget.
    expect(screen.getByText('Repaso de palabras')).toBeInTheDocument()
    expect(screen.getByText('Hecho')).toBeInTheDocument()
    expect(screen.queryByText('Ya completado')).not.toBeInTheDocument()

    // Entry point moves to s2. s3 and s4 are the 2 pending steps shown
    // compact (full budget, unaffected by the done step). s5 is the only
    // one hidden behind the toggle.
    expect(screen.getByText('Lectura')).toBeInTheDocument()
    expect(screen.getByText('Práctica de sonido')).toBeInTheDocument()
    expect(screen.getByText('Estudia teoría')).toBeInTheDocument()
    expect(screen.queryByText('Irregular past tense')).not.toBeInTheDocument()
    expect(screen.getByText('Ver 1 más')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `pnpm test components/daily/__tests__/DailyStepList.test.tsx`
Expected: FAIL — `collapseFutureSteps` prop doesn't exist yet, compact rendering and toggle aren't implemented. The Task 1 tests should still pass.

- [ ] **Step 3: Commit**

```bash
git add components/daily/__tests__/DailyStepList.test.tsx
git commit -m "test: add failing tests for DailyStepList collapseFutureSteps"
```

---

### Task 3: Implement `collapseFutureSteps` in `DailyStepList`

**Files:**
- Modify: `components/daily/DailyStepList.tsx`

Current relevant structure (for reference, from the existing file):
- `DailyStepListProps` interface (lines 20-32)
- `rowVisual()` helper classifying each row as `'done' | 'entry' | 'current' | 'pending'` (lines 60-71)
- The `.map()` render loop building `cardClass` and `inner` per step (lines 108-205)

- [ ] **Step 1: Add the new prop to the interface**

In `components/daily/DailyStepList.tsx`, update `DailyStepListProps`:

```tsx
interface DailyStepListProps {
  steps: DailyStep[]
  getStepStatus: (stepId: string) => DailyStepStatus
  /** Starts the exercise session for a step (not called for 'concept'). */
  onStartStep: (step: DailyStep) => void
  /** Step id with a real mid-session (exerciseIndex > 0). */
  inProgressStepId?: string | null
  /**
   * When review is the home primary, keep "Empieza aquí" but drop primary wash
   * so only one zone shouts.
   */
  demoteEntryHighlight?: boolean
  /**
   * Collapse done/pending rows beyond the current step into compact one-line
   * rows, with a "Ver N más" toggle for anything past the first 2 pending
   * rows. Off by default so /daily (DailyChecklist) keeps full expansion.
   */
  collapseFutureSteps?: boolean
}
```

- [ ] **Step 2: Destructure the new prop with a default, add expansion state**

Update the function signature and add local state right after the existing `activeId` state:

```tsx
export default function DailyStepList({
  steps,
  getStepStatus,
  onStartStep,
  inProgressStepId = null,
  demoteEntryHighlight = false,
  collapseFutureSteps = false,
}: DailyStepListProps) {
  const threadHints = collectPlanHints(steps)
  const [activeId, setActiveId] = useState<string | null>(inProgressStepId)
  const [showAllCompact, setShowAllCompact] = useState(false)

  useEffect(() => {
    setActiveId(inProgressStepId ?? readInProgressStepId())
  }, [inProgressStepId, steps])
```

- [ ] **Step 3: Compute which rows render compact and how many stay hidden**

Right after the existing `entryIndex` calculation (`const entryIndex = steps.findIndex(...)`), add:

```tsx
  const entryIndex = steps.findIndex((s) => {
    const st = getStepStatus(s.id)
    return st !== 'done' && st !== 'resolved'
  })

  // When collapsing: the entry/current step stays expanded; done steps and
  // the first 2 pending steps beyond entry render compact; anything past
  // that is hidden behind the "Ver N más" toggle until showAllCompact.
  const MAX_VISIBLE_COMPACT_PENDING = 2
  let visiblePendingCompactBudget = MAX_VISIBLE_COMPACT_PENDING
  let hiddenCount = 0
  const isCompactRow = (index: number, status: DailyStepStatus, isEntryOrCurrent: boolean): boolean => {
    if (!collapseFutureSteps) return false
    if (isEntryOrCurrent) return false
    return true
  }
  const isHiddenRow = (index: number, status: DailyStepStatus, isEntryOrCurrent: boolean): boolean => {
    if (!collapseFutureSteps || showAllCompact) return false
    if (isEntryOrCurrent) return false
    if (status === 'done' || status === 'resolved') return false
    if (visiblePendingCompactBudget > 0) {
      visiblePendingCompactBudget -= 1
      return false
    }
    hiddenCount += 1
    return true
  }
```

- [ ] **Step 4: Wire the compact/hidden logic into the render loop**

Replace the existing loop body's status/visual computation (the block starting `const status = getStepStatus(step.id)` through `const cardClass = cn(...)`) with:

```tsx
      <ol className="flex w-full flex-col gap-2.5">
        {steps.map((step, i) => {
          const status = getStepStatus(step.id)
          const isInProgress =
            activeId === step.id && status !== 'done' && status !== 'resolved'
          // Entry point only when nothing is mid-session — avoid false "en curso".
          const isEntry =
            !activeId && i === entryIndex && status !== 'done' && status !== 'resolved'
          const visual = rowVisual(status, isInProgress, isEntry)
          const done = visual === 'done'
          const isEntryOrCurrent = visual === 'entry' || visual === 'current'
          const compact = isCompactRow(i, status, isEntryOrCurrent)
          const hidden = isHiddenRow(i, status, isEntryOrCurrent)
          const isReadingStep = step.kind === 'concept' || step.kind === 'study_deck'
          const cardCount = step.studyCards?.length ?? 0
          const hasReader = !!step.readerPassage
          const isStartable = step.exercises.length > 0 || cardCount > 0 || hasReader

          if (hidden) return null

          const cardClass = cn(
            'home-card-lift focus-ring group flex w-full flex-col gap-2 rounded-[var(--radius-lg)] border bg-surface-raised text-left',
            compact ? 'px-4 py-2' : 'px-4 py-3.5',
            visual === 'entry' &&
              (demoteEntryHighlight
                ? 'border-border-subtle hover:border-border-default'
                : 'border-primary bg-primary-soft hover:border-primary'),
            visual === 'current' &&
              'border-primary bg-primary-soft hover:border-primary',
            visual === 'pending' &&
              'border-border-subtle hover:border-border-default',
            visual === 'done' && 'border-border-subtle opacity-80',
          )
```

- [ ] **Step 5: Add the compact row content, keeping the expanded `inner` unchanged**

Replace the existing `const inner = (...)` block with a conditional: compact rows render title + time (or "Hecho"), expanded rows keep today's full markup.

```tsx
          const inner = compact ? (
            <div className="flex w-full items-center justify-between gap-3">
              <span className={cn('truncate font-body-sm font-medium', done ? 'text-fg-muted/70' : 'text-fg')}>
                {localizeDailyStepTitle(step.title)}
              </span>
              {done ? (
                <span className="inline-flex shrink-0 items-center gap-1 font-body-sm font-medium text-success">
                  <Check size={14} aria-hidden />
                  Hecho
                </span>
              ) : (
                <span className="shrink-0 font-caption tabular-nums text-fg-muted">
                  ≈{step.estMinutes} min
                </span>
              )}
            </div>
          ) : (
            <div className="flex w-full items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className={cn(done && 'opacity-60')}>
                  <DailyStepTitle
                    title={localizeDailyStepTitle(step.title)}
                    ipa={step.ipa}
                    index={i}
                  />
                </div>
                <p
                  className={cn( 'mt-0.5 truncate font-body-sm', done ? 'text-fg-muted/70' : 'text-fg-muted', )}
                >
                  {[localizeDailyStepSubtitle(step.subtitle), stepMeta(step)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              {done ? (
                <span className="animate-state-in inline-flex shrink-0 items-center gap-1 font-body-sm font-medium text-success">
                  <Check size={16} aria-hidden />
                  Hecho
                </span>
              ) : visual === 'entry' ? (
                <span
                  className={cn(
                    'shrink-0 font-body-sm font-medium',
                    demoteEntryHighlight ? 'text-fg-muted' : 'text-primary',
                  )}
                >
                  Empieza aquí
                </span>
              ) : visual === 'current' ? (
                <span className="shrink-0 font-body-sm font-medium text-primary">
                  En curso
                </span>
              ) : (
                <ArrowRight
                  size={18}
                  className="shrink-0 text-fg-muted transition-transform duration-150 group-hover:translate-x-0.5"
                />
              )}
            </div>
          )
```

- [ ] **Step 6: Add the toggle after the `<ol>`, before `DailyThreadStrip`**

The existing return statement ends with:

```tsx
      </ol>
      {threadHints.length > 0 ? <DailyThreadStrip hints={threadHints} /> : null}
    </div>
  )
}
```

Change it to insert the toggle button between the list and the thread strip:

```tsx
      </ol>
      {collapseFutureSteps && !showAllCompact && hiddenCount > 0 ? (
        <button
          type="button"
          className="focus-ring self-start font-body-sm font-medium text-fg-muted hover:text-fg"
          onClick={() => setShowAllCompact(true)}
        >
          Ver {hiddenCount} más
        </button>
      ) : null}
      {threadHints.length > 0 ? <DailyThreadStrip hints={threadHints} /> : null}
    </div>
  )
}
```

Note: `hiddenCount` is only fully accurate after the `.map()` above has executed, which happens because `.map()` runs eagerly during render before this JSX is evaluated — this works because both are inside the same function body and `.map()` executes top-to-bottom before the trailing JSX renders. No extra render pass needed.

- [ ] **Step 7: Run the full test file**

Run: `pnpm test components/daily/__tests__/DailyStepList.test.tsx`
Expected: PASS — all Task 1 and Task 2 tests green.

- [ ] **Step 8: Run type-check**

Run: `pnpm type-check`
Expected: no errors related to `DailyStepList.tsx` or its callers.

- [ ] **Step 9: Commit**

```bash
git add components/daily/DailyStepList.tsx
git commit -m "feat(daily): add collapseFutureSteps prop to DailyStepList"
```

---

### Task 4: Wire `collapseFutureSteps` into `HomeDailyCard`

**Files:**
- Modify: `components/home/HomeDailyCard.tsx:190-196`

- [ ] **Step 1: Pass the new prop from `HomeDailyCard`**

In `components/home/HomeDailyCard.tsx`, find:

```tsx
              <DailyStepList
                steps={steps}
                getStepStatus={getStepStatus}
                onStartStep={handleStartStep}
                inProgressStepId={inProgressStepId}
                demoteEntryHighlight={reviewDue}
              />
```

Replace with:

```tsx
              <DailyStepList
                steps={steps}
                getStepStatus={getStepStatus}
                onStartStep={handleStartStep}
                inProgressStepId={inProgressStepId}
                demoteEntryHighlight={reviewDue}
                collapseFutureSteps
              />
```

- [ ] **Step 2: Check existing Home tests still pass**

Run: `pnpm test components/home/__tests__/`
Expected: PASS. If any existing Home test asserted on full subtitle text of a non-entry step (e.g. checking `HomeCommandGrid.test.tsx` or similar renders every step's subtitle), it will now fail because that step renders compact — fix by asserting on the title only, or the compact-visible time string, matching what Task 3 tests already validate.

- [ ] **Step 3: Run type-check and lint**

Run: `pnpm type-check && pnpm lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/home/HomeDailyCard.tsx
git commit -m "feat(home): collapse future daily-plan steps on Home"
```

---

### Task 5: Manual verification in the browser

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`

- [ ] **Step 2: Open Home on a mobile viewport**

Navigate to the authenticated Home page, resize the browser (or use device toolbar) to a mobile width (~375-414px). Confirm:
- The current/entry step renders expanded with "Empieza aquí".
- The next 2 pending steps render as compact one-line rows with `≈N min`.
- Any additional steps are hidden behind a "Ver N más" toggle; clicking it reveals them compact.
- Done steps (if any exist in your test data) show compact with the green check.
- The rest of Home (Lectura recomendada, Práctica de sonido cards, aside) is now visible without scrolling past the whole plan.

- [ ] **Step 3: Open `/daily` directly**

Navigate to `/daily`. Confirm every step still renders fully expanded (title, subtitle, meta, CTA) exactly as before — no compact rows, no toggle. This is the regression check for the opt-in scoping from Task 4.

- [ ] **Step 4: Stop the dev server**

Kill the `pnpm dev` process once verification is complete.

---

## Self-Review Notes

- **Spec coverage:** current step expanded (Task 3 Step 4/5), 2 compact pending rows + toggle (Task 3 Steps 3-6, tested in Task 2), done steps compact with check never hidden (Task 3 Step 3 `isHiddenRow` excludes done/resolved, tested in Task 2), toggle doesn't persist across renders (no persistence mechanism added — state is local `useState`, resets on remount, matches spec), opt-in via `collapseFutureSteps` prop with `/daily` unaffected (Task 4, regression-checked in Task 5 Step 3). All spec requirements are covered.
- **Placeholder scan:** no TBD/TODO; all steps show full code.
- **Type consistency:** `collapseFutureSteps?: boolean` matches its usage in both `DailyStepListProps` (Task 3) and the JSX prop passed in `HomeDailyCard` (Task 4). `DailyStepStatus` import already exists in the test file per the codebase's `hooks/useDailyPlan.ts` export.
