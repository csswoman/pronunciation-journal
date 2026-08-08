# Essential Words — Session Bookends (Ready + Done) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pre-session "ready" summary screen to Essential Words practice and redesign the end-of-session screen, both matching the approved mockups, without touching grading/FSRS/plan-engine logic.

**Architecture:** Insert a new `"ready"` phase between `"loading"` and `"study"/"speak"` in `useEssentialWordsSession`, gated by a new `beginSession()` action that flips phase using state `bootstrap()` already computed. Add a `strugglingWords` field (derived from the existing `pendingLapsesRef`) and a vault count (derived from SRS entries the loader already fetches). Build two new presentational components (`StatBlock`, `SessionReady`) and restyle `SessionDone` to consume the same `StatBlock`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest + Testing Library, Tailwind v4 (tokens only, per CLAUDE.md).

**Reference spec:** `docs/superpowers/specs/2026-08-05-essential-words-session-bookends-design.md`

---

## File Structure

| File | Change |
| - | - |
| `lib/essential-words/session-model.ts` | Add `"ready"` to `EssentialWordsPhase`; extend `EssentialWordsSessionSummary` is untouched (struggling words tracked separately). |
| `lib/essential-words/session-loader.ts` | Extend `EssentialWordsStats` with `vaulted: number`, computed via `isVaultEntry` over the SRS entries already fetched. |
| `hooks/useEssentialWordsSession.ts` | Set `phase: "ready"` in `bootstrap()` instead of jumping to the first step's phase; add `beginSession()`; add `strugglingWords: string[]` state, captured at `finishSession()`. |
| `components/practice/essential-words/StatBlock.tsx` | **New.** Shared 3(+)-column big-number stat row. |
| `components/practice/essential-words/SessionReady.tsx` | **New.** Pre-session summary screen (image 1). |
| `components/practice/essential-words/SessionDone.tsx` | Redesign internals to use `StatBlock`, struggling-words chips, tomorrow preview. Props unchanged. |
| `components/practice/essential-words/EssentialWordsSession.tsx` | Render `SessionReady` when `phase === "ready"`; pass `strugglingWords` to `SessionDone`. |
| `lib/essential-words/__tests__/session-loader.test.ts` | Add coverage for `stats.vaulted`. |
| `hooks/__tests__/useEssentialWordsSession.session-plan-parity.test.ts` | Unchanged (pure plan-engine parity, no phase involved). |
| `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx` | Update every existing test to click "Empezar" after the ready screen appears; add new tests for the ready screen itself. |
| `components/practice/essential-words/__tests__/SessionReady.test.tsx` | **New.** |
| `components/practice/essential-words/__tests__/StatBlock.test.tsx` | **New.** |
| `components/practice/essential-words/__tests__/SessionDone.test.tsx` | **New.** (no test file exists today) |

---

## Task 1: Add `"ready"` phase to the session model

**Files:**
- Modify: `lib/essential-words/session-model.ts:7`

- [ ] **Step 1: Update the `EssentialWordsPhase` union**

```ts
export type EssentialWordsPhase = "loading" | "ready" | "study" | "speak" | "done" | "empty" | "error";
```

- [ ] **Step 2: Run the type-check to confirm nothing else needs the union yet**

Run: `pnpm type-check`
Expected: PASS (no consumer pattern-matches exhaustively on this union yet, so adding a member is non-breaking at this step).

- [ ] **Step 3: Commit**

```bash
git add lib/essential-words/session-model.ts
git commit -m "feat(essential-words): add ready phase to session model"
```

---

## Task 2: Add vault count to `EssentialWordsStats`

**Files:**
- Modify: `lib/essential-words/session-loader.ts`
- Test: `lib/essential-words/__tests__/session-loader.test.ts`

`loadEssentialWordsQueue` already fetches `srsEntries` via `prepareEssentialWordsSrsEntries`. Reuse `isVaultEntry` from `lib/srs/vault.ts` (snoozed/mastered) — no new Dexie query.

- [ ] **Step 1: Write the failing test**

Add to `lib/essential-words/__tests__/session-loader.test.ts`, inside the existing `describe("loadEssentialWordsQueue", ...)` block:

```ts
  it("counts snoozed and mastered entries as vaulted", async () => {
    vi.mocked(getEssentialWordsSrsEntries).mockResolvedValue([
      {
        wordId: "c1k:snoozed-word",
        word: "snoozed-word",
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2099-01-01T00:00:00.000Z",
        status: "snoozed",
        snoozedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        wordId: "c1k:mastered-word",
        word: "mastered-word",
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2026-07-01T00:00:00.000Z",
        status: "mastered",
        masteredAt: "2026-01-01T00:00:00.000Z",
      },
      {
        wordId: "c1k:test",
        word: "test",
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2026-07-01T00:00:00.000Z",
      },
    ]);

    const result = await loadEssentialWordsQueue();

    expect(result.stats.vaulted).toBe(2);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test session-loader.test.ts`
Expected: FAIL — `result.stats.vaulted` is `undefined`, not `2` (property doesn't exist yet).

- [ ] **Step 3: Implement `vaulted` in the loader**

In `lib/essential-words/session-loader.ts`, add the import and extend the interface + return:

```ts
import { isVaultEntry } from "@/lib/srs/vault";
```

```ts
export interface EssentialWordsStats {
  totalWords: number;
  learned: number;
  dueCount: number;
  newToday: number;
  newQuota: number;
  vaulted: number;
}
```

In the `return` block of `loadEssentialWordsQueue`, add `vaulted` to the `stats` object:

```ts
    stats: {
      totalWords: scopedWords.length,
      learned,
      dueCount: items.filter((item) => item.kind === "review").length,
      newToday: introducedToday.length,
      newQuota: NEW_CARDS_PER_DAY,
      vaulted: srsEntries.filter(isVaultEntry).length,
    },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test session-loader.test.ts`
Expected: PASS, both existing tests and the new one.

- [ ] **Step 5: Fix the `EMPTY_STATS` constant in the hook so type-check still passes**

`hooks/useEssentialWordsSession.ts` has:

```ts
const EMPTY_STATS: EssentialWordsStats = {
  totalWords: 0, learned: 0, dueCount: 0, newToday: 0, newQuota: NEW_CARDS_PER_DAY,
};
```

Update to:

```ts
const EMPTY_STATS: EssentialWordsStats = {
  totalWords: 0, learned: 0, dueCount: 0, newToday: 0, newQuota: NEW_CARDS_PER_DAY, vaulted: 0,
};
```

- [ ] **Step 6: Run full type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/essential-words/session-loader.ts lib/essential-words/__tests__/session-loader.test.ts hooks/useEssentialWordsSession.ts
git commit -m "feat(essential-words): add vaulted count to session stats"
```

---

## Task 3: Wire the `ready` phase and `beginSession()` into the hook

**Files:**
- Modify: `hooks/useEssentialWordsSession.ts`

This is a behavior-preserving refactor for the actual step reached — `beginSession()` must land on exactly the step `bootstrap()` used to jump to directly. No new plan computation; just delay flipping `phase` away from `"ready"`.

- [ ] **Step 1: Change `bootstrap()`'s compat-mode phase assignment**

Find (around `bootstrap`, compat-mode branch):

```ts
      setCounts(deriveCounts(items, 0));
      setPhase(items[0].kind === "new" ? "study" : "speak");
      return;
```

Replace with:

```ts
      setCounts(deriveCounts(items, 0));
      setPhase(items.length > 0 ? "ready" : "empty");
      return;
```

- [ ] **Step 2: Change `bootstrap()`'s plan-mode phase assignment**

Find:

```ts
    if (nextPlanState) setCounts(derivePlanCounts(nextPlanState));
    else setCounts(EMPTY_COUNTS);
    setPhase(first ? (first.kind === "expose" ? "study" : "speak") : "empty");
  }, [nextCompatStepId, persistPendingLapses, user?.id]);
```

Replace with:

```ts
    if (nextPlanState) setCounts(derivePlanCounts(nextPlanState));
    else setCounts(EMPTY_COUNTS);
    setPhase(first ? "ready" : "empty");
  }, [nextCompatStepId, persistPendingLapses, user?.id]);
```

- [ ] **Step 3: Add `beginSession()` — factor the phase-selection logic used by both paths**

Add this new callback near `startSpeak` (after it, before `submitGrade`):

```ts
  const beginSession = useCallback(() => {
    if (phase !== "ready") return;
    if (compatModeRef.current) {
      const item = compatQueue[compatIndex];
      setPhase(item && item.kind === "new" ? "study" : "speak");
      return;
    }
    setPhase(currentStep && currentStep.kind === "expose" ? "study" : "speak");
  }, [phase, compatQueue, compatIndex, currentStep]);
```

- [ ] **Step 4: Return `beginSession` from the hook**

In the `return { ... }` block at the end of the hook, add `beginSession,` alongside `startSpeak,`:

```ts
    startSpeak,
    beginSession,
    omitWord,
```

- [ ] **Step 5: Run type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add hooks/useEssentialWordsSession.ts
git commit -m "feat(essential-words): add ready phase gate and beginSession action"
```

Note: existing `EssentialWordsSession.tsx` and its tests are not updated yet — the app will currently show nothing for `phase === "ready"` (falls through both the loading/empty/done branch and the main render, since `phase !== "study"/"speak"` in the JSX conditionals). This is expected; Task 5 wires the new screen in. Do not run the full component test suite as a gate for this task — Task 6 handles that.

---

## Task 4: Capture `strugglingWords` at session end

**Files:**
- Modify: `hooks/useEssentialWordsSession.ts`

`pendingLapsesRef.current` holds `wordId → quality` for unresolved fails (`c1k:`-prefixed). `finishSession()` calls `flushLapses()`, which mutates/clears entries as they persist successfully — so the struggling-word snapshot must be taken **before** the flush, inside `finishSession` itself.

- [ ] **Step 1: Add state for struggling words**

Near the other `useState` declarations (after `sessionSummary`):

```ts
  const [strugglingWords, setStrugglingWords] = useState<string[]>([]);
```

- [ ] **Step 2: Snapshot struggling words in `finishSession`, before flushing**

Find:

```ts
  const finishSession = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setPhase("done");
    await flushLapses();
```

Replace with:

```ts
  const finishSession = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setPhase("done");
    setStrugglingWords(
      Array.from(pendingLapsesRef.current.keys()).map((wordId) => wordId.replace("c1k:", "")),
    );
    await flushLapses();
```

- [ ] **Step 3: Reset `strugglingWords` on each new bootstrap**

In `bootstrap()`, both the compat-mode branch and the plan-mode branch already reset `sessionSummary` to `null` and `sessionResultsRef.current` to `[]`. Add a reset alongside each. In the compat-mode branch, find:

```ts
      setSessionSummary(null);
      sessionResultsRef.current = [];
      pendingLapsesRef.current = new Map();
      persistPendingLapses();
      setPreviousMode(undefined);
      setCounts(deriveCounts(items, 0));
```

Replace with:

```ts
      setSessionSummary(null);
      setStrugglingWords([]);
      sessionResultsRef.current = [];
      pendingLapsesRef.current = new Map();
      persistPendingLapses();
      setPreviousMode(undefined);
      setCounts(deriveCounts(items, 0));
```

In the plan-mode branch, find:

```ts
    setSessionSummary(null);
    sessionResultsRef.current = [];
    pendingLapsesRef.current = new Map();
    persistPendingLapses();
    setPreviousMode(undefined);
    if (nextPlanState) setCounts(derivePlanCounts(nextPlanState));
```

Replace with:

```ts
    setSessionSummary(null);
    setStrugglingWords([]);
    sessionResultsRef.current = [];
    pendingLapsesRef.current = new Map();
    persistPendingLapses();
    setPreviousMode(undefined);
    if (nextPlanState) setCounts(derivePlanCounts(nextPlanState));
```

- [ ] **Step 4: Return `strugglingWords` from the hook**

In the `return { ... }` block, add alongside `sessionSummary,`:

```ts
    sessionSummary,
    strugglingWords,
```

- [ ] **Step 5: Run type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add hooks/useEssentialWordsSession.ts
git commit -m "feat(essential-words): expose strugglingWords from session hook"
```

---

## Task 5: `StatBlock` shared component

**Files:**
- Create: `components/practice/essential-words/StatBlock.tsx`
- Test: `components/practice/essential-words/__tests__/StatBlock.test.tsx`

```
// Planned structure:
// <StatBlock>
//   <StatColumn × n />   — big number + muted label
// </StatBlock>
```

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatBlock } from '../StatBlock'

describe('StatBlock', () => {
  it('renders one column per stat with its label and value', () => {
    render(
      <StatBlock
        stats={[
          { label: 'Nuevas', value: 8 },
          { label: 'Repasos', value: 16 },
          { label: 'En el baúl', value: 8 },
        ]}
      />,
    )

    expect(screen.getByText('8')).toBeTruthy()
    expect(screen.getByText('16')).toBeTruthy()
    expect(screen.getByText('Nuevas')).toBeTruthy()
    expect(screen.getByText('Repasos')).toBeTruthy()
    expect(screen.getByText('En el baúl')).toBeTruthy()
  })

  it('supports an accented column for emphasis', () => {
    render(
      <StatBlock
        stats={[
          { label: 'Aprendidas hoy', value: 8, accent: true },
          { label: 'Repasadas', value: 16 },
        ]}
      />,
    )

    expect(screen.getByText('8').className).toContain('text-info')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test StatBlock.test.tsx`
Expected: FAIL — `Cannot find module '../StatBlock'`

- [ ] **Step 3: Implement `StatBlock.tsx`**

```tsx
// Planned structure:
// <StatBlock>
//   <StatColumn × n />   — big number + muted label
// </StatBlock>

import { cn } from '@/lib/cn'

export interface StatBlockItem {
  label: string
  value: number
  /** Highlights the value in the info color, for the standout stat in the row. */
  accent?: boolean
}

interface Props {
  stats: StatBlockItem[]
}

function StatColumn({ label, value, accent }: StatBlockItem) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span
        className={cn(
          'type-stat text-h3 tracking-tight',
          accent ? 'text-info' : 'text-fg',
        )}
      >
        {value}
      </span>
      <span className="text-center font-kicker text-fg-subtle">{label}</span>
    </div>
  )
}

export function StatBlock({ stats }: Props) {
  return (
    <div className="grid w-full grid-cols-3 gap-layout-stack rounded-md border border-border-subtle bg-surface-raised p-4 sm:gap-space-5 sm:p-5">
      {stats.map((stat) => (
        <StatColumn key={stat.label} {...stat} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test StatBlock.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/practice/essential-words/StatBlock.tsx components/practice/essential-words/__tests__/StatBlock.test.tsx
git commit -m "feat(essential-words): add shared StatBlock component"
```

---

## Task 6: `SessionReady` screen

**Files:**
- Create: `components/practice/essential-words/SessionReady.tsx`
- Test: `components/practice/essential-words/__tests__/SessionReady.test.tsx`

```
// Planned structure:
// <SessionReady>
//   <ReadyHeadline />     — "Hoy te tocan N palabras" + "~M minutos"
//   <StatBlock />         — Nuevas · Repasos · En el baúl
//   <StructureNote />     — "X bloques de palabras nuevas, más los repasos y una ronda final"
//   <PillButton>Empezar</PillButton>
// </SessionReady>
```

Minutes estimate reuses `estimateDurationMs` from `lib/essential-words/session-plan-time-ceiling.ts`. Since the component only receives `counts` (new/review remaining) rather than the raw expose/exercise step list, approximate using the same per-word costs the plan engine uses: each new word costs 1 expose + 3 exercises, each review word costs 3 exercises — this mirrors `perNewWordMs`/`perReviewWordMs`, which are file-local (not exported) in `session-plan-time-ceiling.ts`. Compute directly via the exported `estimateDurationMs`:

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionReady } from '../SessionReady'

describe('SessionReady', () => {
  it('shows the total word count, time estimate, and per-kind stats', () => {
    render(
      <SessionReady
        counts={{ newRemaining: 8, learningRemaining: 0, reviewRemaining: 16 }}
        vaulted={8}
        onBegin={vi.fn()}
      />,
    )

    expect(screen.getByText('Hoy te tocan 24 palabras')).toBeTruthy()
    expect(screen.getByText('8')).toBeTruthy()
    expect(screen.getByText('16')).toBeTruthy()
    expect(screen.getByText('En el baúl')).toBeTruthy()
  })

  it('describes the block structure when there are new words', () => {
    render(
      <SessionReady
        counts={{ newRemaining: 8, learningRemaining: 0, reviewRemaining: 16 }}
        vaulted={8}
        onBegin={vi.fn()}
      />,
    )

    expect(
      screen.getByText('3 bloques de palabras nuevas, más los repasos y una ronda final'),
    ).toBeTruthy()
  })

  it('omits the structure note when there are no new words', () => {
    render(
      <SessionReady
        counts={{ newRemaining: 0, learningRemaining: 0, reviewRemaining: 5 }}
        vaulted={0}
        onBegin={vi.fn()}
      />,
    )

    expect(screen.queryByText(/bloques de palabras nuevas/)).toBeNull()
  })

  it('calls onBegin when Empezar is pressed', async () => {
    const user = userEvent.setup()
    const onBegin = vi.fn()
    render(
      <SessionReady
        counts={{ newRemaining: 3, learningRemaining: 0, reviewRemaining: 0 }}
        vaulted={0}
        onBegin={onBegin}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Empezar' }))

    expect(onBegin).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test SessionReady.test.tsx`
Expected: FAIL — `Cannot find module '../SessionReady'`

- [ ] **Step 3: Implement `SessionReady.tsx`**

```tsx
'use client'

// Planned structure:
// <SessionReady>
//   <ReadyHeadline />     — "Hoy te tocan N palabras" + "~M minutos"
//   <StatBlock />         — Nuevas · Repasos · En el baúl
//   <StructureNote />     — "X bloques de palabras nuevas, más los repasos y una ronda final"
//   <PillButton>Empezar</PillButton>
// </SessionReady>

import { estimateDurationMs } from '@/lib/essential-words/session-plan-time-ceiling'
import { PillButton } from '@/components/ui/PillButton'
import type { EssentialWordsCounts } from '@/hooks/useEssentialWordsSession'
import { StatBlock } from './StatBlock'

interface Props {
  counts: EssentialWordsCounts
  vaulted: number
  onBegin: () => void
}

// Mirrors the plan engine's per-new-word cost (1 expose + 3 exercises) and
// per-review-word cost (3 exercises) from session-plan-time-ceiling.ts —
// those helpers are file-local there, so the shape is reproduced here from
// the same exported estimateDurationMs primitive rather than duplicating constants.
function estimateSessionMinutes(counts: EssentialWordsCounts): number {
  const newMs = estimateDurationMs({ exposeCount: counts.newRemaining, exerciseCount: counts.newRemaining * 3 })
  const reviewMs = estimateDurationMs({ exposeCount: 0, exerciseCount: counts.reviewRemaining * 3 })
  return Math.max(1, Math.round((newMs + reviewMs) / 60000))
}

export function SessionReady({ counts, vaulted, onBegin }: Props) {
  const total = counts.newRemaining + counts.reviewRemaining
  const minutes = estimateSessionMinutes(counts)
  const blocks = Math.ceil(counts.newRemaining / 3)

  return (
    <div className="flex flex-col items-center layout-stack-loose py-layout-page-block text-center animate-message-in">
      <div className="flex flex-col items-center gap-2">
        <h2 className="m-0 text-h3 text-fg">
          Hoy te tocan {total} {total === 1 ? 'palabra' : 'palabras'}
        </h2>
        <p className="m-0 text-body-sm text-fg-muted">unos {minutes} minutos</p>
      </div>

      <div className="w-full max-w-sm">
        <StatBlock
          stats={[
            { label: 'Nuevas', value: counts.newRemaining },
            { label: 'Repasos', value: counts.reviewRemaining },
            { label: 'En el baúl', value: vaulted },
          ]}
        />
      </div>

      {counts.newRemaining > 0 ? (
        <p className="m-0 max-w-[42ch] rounded-md bg-surface-sunken px-4 py-3 text-caption text-fg-muted">
          {blocks} {blocks === 1 ? 'bloque' : 'bloques'} de palabras nuevas, más los repasos y una ronda final
        </p>
      ) : null}

      <PillButton
        type="button"
        variant="primary"
        size="md"
        className="w-full max-w-sm"
        onClick={onBegin}
        data-cuelume-press="press"
        data-cuelume-release="release"
      >
        Empezar
      </PillButton>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test SessionReady.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/practice/essential-words/SessionReady.tsx components/practice/essential-words/__tests__/SessionReady.test.tsx
git commit -m "feat(essential-words): add SessionReady pre-session screen"
```

---

## Task 7: Wire `SessionReady` into `EssentialWordsSession`

**Files:**
- Modify: `components/practice/essential-words/EssentialWordsSession.tsx`
- Modify: `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx` (every test that currently expects to land directly on the first word)

- [ ] **Step 1: Destructure the new hook fields**

Find:

```tsx
  const {
    phase, currentStepId, current, currentMode, distractorPool, stats, counts, sessionSummary,
    reloadLoading, levels, activeRouteId, setRoute,
    startSpeak, omitWord, submitGrade, reload, learnMore, archiveWord,
    keepSnooze, masterWord,
  } = useEssentialWordsSession()
```

Replace with:

```tsx
  const {
    phase, currentStepId, current, currentMode, distractorPool, stats, counts, sessionSummary,
    strugglingWords, reloadLoading, levels, activeRouteId, setRoute,
    startSpeak, beginSession, omitWord, submitGrade, reload, learnMore, archiveWord,
    keepSnooze, masterWord,
  } = useEssentialWordsSession()
```

- [ ] **Step 2: Import `SessionReady`**

Add alongside the other essential-words component imports:

```tsx
import { SessionReady } from './SessionReady'
```

- [ ] **Step 3: Render `SessionReady` for `phase === "ready"`**

Find the `if (phase === 'loading')` block's closing `}` and insert a new branch right after it, before the `if (phase === 'empty' || ...)` block:

```tsx
  if (phase === 'ready') {
    return (
      <>
        <Frame>
          {chrome}
          <SessionReady counts={counts} vaulted={stats.vaulted} onBegin={beginSession} />
        </Frame>
        {exitSheet}
      </>
    )
  }
```

Note: `SessionDone`'s call site still passes its current props unchanged here — `strugglingWords` is wired into that call in Task 8 Step 1, once `SessionDone` actually accepts the prop. Wiring it here first would leave `SessionDone` receiving a prop its own type doesn't declare yet.

- [ ] **Step 4: Update existing tests to click through the ready screen**

In `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx`, every test that currently does `render(<EssentialWordsSession />)` and then immediately asserts on study/speak content needs one extra step: wait for the "Empezar" button and click it. Add this helper right after the `import { EssentialWordsSession } from '../EssentialWordsSession'` line:

```tsx
async function clickEmpezar() {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Empezar' }))
}
```

Now update each affected test (tests for `empty`/`error` phases are unaffected — they never reach `ready`):

**Test `'renders the exposure phase before any exercise for a batch of new words (Fase A block structure)'`** (line ~121):

```tsx
  it('renders the exposure phase before any exercise for a batch of new words (Fase A block structure)', async () => {
    dbMocks.getEssentialWordsSrsEntries.mockResolvedValue([])
    dbMocks.getEssentialWordsIntroducedToday.mockResolvedValue([])

    render(<EssentialWordsSession />)
    await clickEmpezar()

    expect(await screen.findByRole('heading', { name: WORDS[0].word })).toBeTruthy()
  })
```

**Test `'introduces a new card as study first, then speak with self-grade fallback'`** (line ~142): insert `await clickEmpezar()` right after `render(<EssentialWordsSession />)`:

```tsx
  it('introduces a new card as study first, then speak with self-grade fallback', async () => {
    const user = userEvent.setup()
    render(<EssentialWordsSession />)
    await clickEmpezar()

    await screen.findByRole('heading', { name: 'the' })
    expect(screen.getByText('/ðʌ/')).toBeTruthy()
    expect(screen.getByText('/ðə/')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(await screen.findByText('Give me the book please.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Bien' }))

    await waitFor(() => expect(dbMocks.saveSRSData).toHaveBeenCalledOnce())
    expect(dbMocks.recordEssentialWordIntroduction).toHaveBeenCalledWith('the', 'user-1')
    await screen.findByRole('heading', { name: 'be' })
  })
```

**Test `'keeps a failed multiple-choice result pending until Continue and remounts the next step cleanly'`** (line ~160): insert `await clickEmpezar()` right after `render(<EssentialWordsSession />)`.

**Test `'resumes on the first appended card when learning more after finishing'`** (line ~204): insert `await clickEmpezar()` right after `render(<EssentialWordsSession />)`. Note this test's flow continues through completion and re-entering "learn more" — that path does not return to `ready`, so only one `clickEmpezar()` call is needed.

**Test `'persists pending lapses and flushes them on pagehide'`** (line ~232): insert `await clickEmpezar()` right after `render(<EssentialWordsSession />)`.

**Test `'records the finished session only once when the last card is archived'`** (line ~258): insert `await clickEmpezar()` right after `render(<EssentialWordsSession />)`.

**Test `'offers keep/master actions for words reactivated from snooze'`** (line ~277): insert `await clickEmpezar()` right after `render(<EssentialWordsSession />)`.

**Test `'masters a reactivated snooze word and advances'`** (line ~304): insert `await clickEmpezar()` right after `render(<EssentialWordsSession />)`.

**Test `'renders ClozeCard for a middle-tier review whose rotation picks cloze'`** (line ~329): insert `await clickEmpezar()` right after `render(<EssentialWordsSession />)`.

**Test `'threads repetitions into ClozeCard so the rotated sentence variant is blanked'`** (line ~361): insert `await clickEmpezar()` right after `render(<EssentialWordsSession />)`.

Leave unchanged:
- `'shows only the loader during loading — no session chrome/header'` (loading phase, never reaches ready).
- `'shows the empty state when there is nothing due and no quota left'` (goes straight to `empty`).
- `'shows a reload state instead of empty when the dataset load fails'` (goes straight to `error`).

- [ ] **Step 5: Run the full session test file**

Run: `pnpm test EssentialWordsSession.test.tsx`
Expected: PASS (all tests, including the untouched empty/error/loading ones)

- [ ] **Step 6: Add a dedicated test for the ready screen appearing and gating**

Add a new test to `EssentialWordsSession.test.tsx`, in the `describe('EssentialWordsSession', ...)` block:

```tsx
  it('shows the ready screen before the first card and only advances after Empezar', async () => {
    dbMocks.getEssentialWordsSrsEntries.mockResolvedValue([])
    dbMocks.getEssentialWordsIntroducedToday.mockResolvedValue([])

    render(<EssentialWordsSession />)

    await screen.findByRole('button', { name: 'Empezar' })
    expect(screen.queryByRole('heading', { name: WORDS[0].word })).toBeNull()

    await clickEmpezar()

    expect(await screen.findByRole('heading', { name: WORDS[0].word })).toBeTruthy()
  })
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm test EssentialWordsSession.test.tsx`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add components/practice/essential-words/EssentialWordsSession.tsx components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx
git commit -m "feat(essential-words): render SessionReady before study/speak phases"
```

---

## Task 8: Redesign `SessionDone` with `StatBlock` and struggling-words chips

**Files:**
- Modify: `components/practice/essential-words/SessionDone.tsx`
- Modify: `components/practice/essential-words/EssentialWordsSession.tsx` (wire the `strugglingWords` prop, deferred from Task 7)
- Create: `components/practice/essential-words/__tests__/SessionDone.test.tsx`

- [ ] **Step 1: Wire `strugglingWords` into the `SessionDone` call site**

In `components/practice/essential-words/EssentialWordsSession.tsx`, find:

```tsx
          <SessionDone
            stats={stats}
            sessionSummary={sessionSummary}
            wasEmpty={phase === 'empty'}
            loadFailed={phase === 'error'}
            onContinue={reload}
            continueLoading={reloadLoading}
            onLearnMore={phase === 'done' ? learnMore : undefined}
          />
```

Replace with:

```tsx
          <SessionDone
            stats={stats}
            sessionSummary={sessionSummary}
            strugglingWords={strugglingWords}
            wasEmpty={phase === 'empty'}
            loadFailed={phase === 'error'}
            onContinue={reload}
            continueLoading={reloadLoading}
            onLearnMore={phase === 'done' ? learnMore : undefined}
          />
```

- [ ] **Step 2: Write the failing test file**

Create `components/practice/essential-words/__tests__/SessionDone.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionDone } from '../SessionDone'
import type { EssentialWordsStats } from '@/hooks/useEssentialWordsSession'

const STATS: EssentialWordsStats = {
  totalWords: 2800, learned: 120, dueCount: 12, newToday: 8, newQuota: 10, vaulted: 8,
}

describe('SessionDone', () => {
  it('shows the practiced/correct stat block on a completed session', () => {
    render(
      <SessionDone
        stats={STATS}
        sessionSummary={{ practiced: 24, correct: 21 }}
        strugglingWords={[]}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByText('¡Sesión completa!')).toBeTruthy()
    expect(screen.getByText('21')).toBeTruthy()
  })

  it('lists struggling words as a chip list with a return-tomorrow note', () => {
    render(
      <SessionDone
        stats={STATS}
        sessionSummary={{ practiced: 24, correct: 21 }}
        strugglingWords={['he', 'their', 'have']}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByText('Estas te costaron — vuelven mañana')).toBeTruthy()
    expect(screen.getByText('he')).toBeTruthy()
    expect(screen.getByText('their')).toBeTruthy()
    expect(screen.getByText('have')).toBeTruthy()
  })

  it('omits the struggling-words chip list when nothing was missed', () => {
    render(
      <SessionDone
        stats={STATS}
        sessionSummary={{ practiced: 24, correct: 24 }}
        strugglingWords={[]}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.queryByText('Estas te costaron — vuelven mañana')).toBeNull()
  })

  it('shows a tomorrow preview combining struggling words, due count, and daily quota', () => {
    render(
      <SessionDone
        stats={STATS}
        sessionSummary={{ practiced: 24, correct: 21 }}
        strugglingWords={['he', 'their', 'have']}
        onContinue={vi.fn()}
      />,
    )

    // dueCount(12) + strugglingWords.length(3) = 15 repasos; newQuota = 10 nuevas
    expect(screen.getByText('Mañana: 15 repasos y 10 palabras nuevas')).toBeTruthy()
  })

  it('keeps the empty-state copy without a stat block or chips', () => {
    render(
      <SessionDone
        stats={STATS}
        sessionSummary={null}
        strugglingWords={[]}
        wasEmpty
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByText('Nada pendiente por hoy')).toBeTruthy()
    expect(screen.queryByText('Estas te costaron — vuelven mañana')).toBeNull()
    expect(screen.queryByText(/^Mañana:/)).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test SessionDone.test.tsx`
Expected: FAIL — `strugglingWords` prop doesn't exist on `SessionDone` yet; "Mañana:" / chip text not rendered.

- [ ] **Step 4: Rewrite `SessionDone.tsx`**

```tsx
'use client'

// Planned structure:
// <SessionDone>
//   <CelebrationMark />     — icon + cue on complete / empty / error
//   <Headline />
//   <StatBlock />           — Aprendidas hoy · Repasadas · Sin fallos
//   <StruggledChips />      — words that need to come back tomorrow
//   <TomorrowPreview />     — approximate repasos/nuevas for tomorrow
//   <SessionActions />
// </SessionDone>

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2, Sparkles, AlertCircle, Loader2 } from '@/components/icons'
import { PillButton } from '@/components/ui/PillButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'
import type { EssentialWordsSessionSummary, EssentialWordsStats } from '@/hooks/useEssentialWordsSession'
import { StatBlock } from './StatBlock'

interface Props {
  stats: EssentialWordsStats
  sessionSummary?: EssentialWordsSessionSummary | null
  /** Words with an unresolved fail this session (lib pendingLapses at session end). */
  strugglingWords: string[]
  /** true cuando la cola estaba vacía desde el inicio */
  wasEmpty?: boolean
  loadFailed?: boolean
  onContinue?: () => void
  continueLoading?: boolean
  onLearnMore?: () => void
}

export function SessionDone({
  stats,
  sessionSummary,
  strugglingWords,
  wasEmpty,
  loadFailed,
  onContinue,
  continueLoading,
  onLearnMore,
}: Props) {
  const practiced = sessionSummary?.practiced ?? 0
  const correct = sessionSummary?.correct ?? 0
  const accuracy = practiced > 0 ? Math.round((correct / practiced) * 100) : null
  const cuePlayed = useRef(false)

  useEffect(() => {
    if (cuePlayed.current) return
    cuePlayed.current = true
    if (loadFailed) {
      playUiCue('wrong')
      return
    }
    if (wasEmpty) {
      playUiCue('soft')
      return
    }
    if (accuracy !== null && accuracy >= 85) playUiCue('correct')
    else if (accuracy !== null && accuracy >= 60) playUiCue('reveal')
    else if (practiced > 0) playUiCue('soft')
    else playUiCue('reveal')
  }, [loadFailed, wasEmpty, accuracy, practiced])

  const headline = loadFailed
    ? 'No se pudo cargar la sesión'
    : wasEmpty
      ? 'Nada pendiente por hoy'
      : '¡Sesión completa!'

  const Icon = loadFailed ? AlertCircle : wasEmpty ? Sparkles : CheckCircle2
  const iconTone = loadFailed
    ? 'bg-error-soft text-error'
    : wasEmpty
      ? 'bg-primary-soft text-primary'
      : 'bg-success text-white'

  const showSessionDetails = !wasEmpty && !loadFailed && practiced > 0
  const cleanCount = Math.max(0, practiced - strugglingWords.length)
  const tomorrowReviews = stats.dueCount + strugglingWords.length

  return (
    <div className="flex flex-col items-center layout-stack-loose py-layout-page-block text-center animate-message-in">
      <div className="flex flex-col items-center gap-3">
        <span
          className={cn( 'inline-flex h-12 w-12 items-center justify-center rounded-full', iconTone, !loadFailed && 'animate-step-done', )}
          aria-hidden
        >
          <Icon size={24} />
        </span>
        <h2 className="m-0 text-h3 text-fg">{headline}</h2>
        {showSessionDetails ? (
          <p className="m-0 text-body-sm text-fg-muted">
            {practiced} {practiced === 1 ? 'palabra practicada' : 'palabras practicadas'}
            {accuracy !== null ? ` · ${accuracy}% precisión` : ''}
          </p>
        ) : null}
        <p className="m-0 text-body-sm text-fg-muted">
          {stats.learned} de {stats.totalWords} palabras en tu deck, {stats.newToday}/
          {stats.newQuota} nuevas hoy
        </p>
        {loadFailed ? (
          <p className="m-0 max-w-[36ch] text-caption text-fg-subtle">
            Revisa tu conexión o vuelve a intentar la carga.
          </p>
        ) : wasEmpty ? (
          <p className="m-0 max-w-[36ch] text-caption text-fg-subtle">
            Estás al día. Vuelve mañana, el repaso espaciado hace el resto.
          </p>
        ) : (
          <p className="m-0 max-w-[36ch] text-caption text-fg-subtle">
            Tu práctica ya cuenta en tu progreso.
          </p>
        )}
      </div>

      {showSessionDetails ? (
        <div className="w-full max-w-sm">
          <StatBlock
            stats={[
              { label: 'Aprendidas hoy', value: stats.newToday },
              { label: 'Repasadas', value: Math.max(0, practiced - stats.newToday) },
              { label: 'Sin fallos', value: cleanCount },
            ]}
          />
        </div>
      ) : null}

      {showSessionDetails && strugglingWords.length > 0 ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-md bg-surface-sunken p-4">
          <p className="m-0 text-caption text-fg-muted">Estas te costaron — vuelven mañana</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {strugglingWords.map((word) => (
              <span
                key={word}
                className="rounded-full bg-warning-soft px-3 py-1 font-mono text-caption text-warning"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {showSessionDetails ? (
        <p className="m-0 max-w-[42ch] rounded-md bg-surface-sunken px-4 py-3 text-caption text-fg-muted">
          Mañana: {tomorrowReviews} {tomorrowReviews === 1 ? 'repaso' : 'repasos'} y {stats.newQuota}{' '}
          {stats.newQuota === 1 ? 'palabra nueva' : 'palabras nuevas'}
        </p>
      ) : null}

      <div className="flex w-full max-w-sm flex-col gap-layout-stack">
        {onLearnMore ? (
          <PillButton
            type="button"
            variant="outline"
            size="md"
            className="w-full"
            onClick={onLearnMore}
            data-cuelume-press="press"
            data-cuelume-release="release"
          >
            Aprender 10 nuevas más
          </PillButton>
        ) : null}
        {onContinue ? (
          <PillButton
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            icon={continueLoading ? <Loader2 size={16} /> : undefined}
            isLoading={continueLoading}
            onClick={onContinue}
            data-cuelume-press="press"
            data-cuelume-release="release"
          >
            {loadFailed ? 'Reintentar carga' : 'Buscar palabras para practicar'}
          </PillButton>
        ) : null}
        <details className="w-full text-center">
          <summary className="cursor-pointer rounded-md px-3 py-2 text-caption font-semibold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring">
            Ver más
          </summary>
          <div className="mt-2 flex flex-col items-center gap-1">
            <Link
              href="/progress"
              className="rounded-md px-3 py-2 text-caption font-semibold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring"
              data-cuelume-hover="tick"
            >
              Ver progreso
            </Link>
            <Link
              href="/daily"
              className="rounded-md px-3 py-2 text-caption font-semibold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring"
              data-cuelume-hover="tick"
            >
              Abrir plan de hoy
            </Link>
          </div>
        </details>
      </div>
    </div>
  )
}
```

Note: `bg-warning-soft` / `text-warning` follow the same token-naming pattern as the existing `bg-error-soft`/`text-error` and `bg-primary-soft`/`text-primary` pairs already used in this file. If a `warning` semantic token does not exist in `globals.css`, substitute the closest existing semantic pair (check `bg-error-soft`/`text-error` usage sites for the token list) — do not hardcode a color.

- [ ] **Step 5: Verify the warning token exists**

Run: `grep -rn "warning-soft\|text-warning" app/globals.css`
Expected: at least one match. If none, replace `bg-warning-soft text-warning` in Step 4's code with an existing pair (e.g. `bg-error-soft text-error`) before proceeding.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test SessionDone.test.tsx`
Expected: PASS

- [ ] **Step 7: Run the full essential-words component test directory to catch regressions**

Run: `pnpm test components/practice/essential-words`
Expected: PASS — includes `EssentialWordsSession.test.tsx` (now passing `strugglingWords` through), `SessionDone.test.tsx`, `SessionReady.test.tsx`, `StatBlock.test.tsx`, and all untouched card tests.

- [ ] **Step 8: Commit**

```bash
git add components/practice/essential-words/SessionDone.tsx components/practice/essential-words/EssentialWordsSession.tsx components/practice/essential-words/__tests__/SessionDone.test.tsx
git commit -m "feat(essential-words): redesign SessionDone with stat block and struggling-words recap"
```

---

## Task 9: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: PASS, no regressions outside the files touched in this plan.

- [ ] **Step 2: Run type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS. Watch for the 250-line component budget (CLAUDE.md) — `SessionDone.tsx` grew with the stat block/chips/preview; if it exceeds ~250 lines, extract `StruggledChips` and `TomorrowPreview` into small local components in the same file's spirit as the "Planned structure" comment at its top (matches the project's decomposition convention).

- [ ] **Step 4: Manually verify file line counts**

Run: `wc -l components/practice/essential-words/SessionDone.tsx components/practice/essential-words/SessionReady.tsx components/practice/essential-words/StatBlock.tsx`
Expected: each ≤ 250 lines per CLAUDE.md convention. If `SessionDone.tsx` is over, split per Step 3's guidance and re-run Steps 1–3.

- [ ] **Step 5: Manual smoke check in dev**

Run: `pnpm dev`, navigate to `/practice/essential-words`, confirm:
- The ready screen appears before any card, showing correct Nuevas/Repasos/En el baúl counts and a plausible minute estimate.
- "Empezar" advances into the first study/speak card.
- Completing a session with at least one wrong answer shows the struggling-words chip list and the tomorrow preview line on the done screen.
- Completing a session with zero wrong answers omits the chip list.

No commit for this task — verification only.
