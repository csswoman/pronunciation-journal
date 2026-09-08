# Practice Hub Masonry Variable-Width Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `/practice`'s card grid from CSS Columns to a CSS Grid masonry where each card keeps its natural height and spans 1, 2, or 4 columns based on its type.

**Architecture:** A `<div class="practice-hub__masonry">` becomes `flex column` on mobile and `display: grid` with fine columns (`repeat(2|4, 1fr)`) + `grid-auto-rows: 8px` from tablet up. A new `useMasonryLayout` hook measures each direct child's real height after layout and sets `style.gridRowEnd = span N` so rows collapse to content (masonry). A per-type span map (`PRACTICE_CARD_SPANS`) drives a `data-span` attribute on each card wrapper, and CSS maps `data-span` to `grid-column: span N`. On mobile the hook is inert; without `ResizeObserver` it flags `data-masonry-off` and CSS falls back to a plain grid.

**Tech Stack:** Next.js 16 App Router, React 19 (client components), Tailwind v4 utility classes, plain CSS in `app/styles/practice-hub.css`, Vitest + jsdom + Testing Library.

---

## File Structure

| File | Responsibility |
| - | - |
| `hooks/useMasonryLayout.ts` (new) | Single responsibility: keep each grid child's `gridRowEnd` synced to its measured height; inert on mobile / without `ResizeObserver`. |
| `hooks/__tests__/useMasonryLayout.test.ts` (new) | Unit tests for the hook: span math, mobile teardown, missing `ResizeObserver`, unmount cleanup. |
| `components/practice/hub/PracticeOptionsGrid.tsx` (modify) | Owns `PRACTICE_CARD_SPANS`, renders card wrappers with `data-span`, wires `useMasonryLayout(gridRef)`. |
| `components/practice/hub/__tests__/PracticeOptionsGrid.test.tsx` (new) | Verifies each card wrapper renders the expected `data-span`. |
| `app/styles/practice-hub.css` (modify) | Replace `.practice-hub__masonry*` CSS Columns rules with the flex→grid responsive rules + `data-span` / `data-masonry-off` mappings. |
| `components/practice/hub/RecommendedPracticeCard.tsx` … `CourseCard.tsx` (modify, 9 files) | Remove the `h-fit` utility class so the grid controls height. |

**Existing helpers reused:** `hooks/useMediaQuery.ts` pattern (`window.matchMedia('(max-width: 767px)')`).

---

## Task 1: `useMasonryLayout` hook — span math (happy path)

**Files:**
- Create: `hooks/useMasonryLayout.ts`
- Test: `hooks/__tests__/useMasonryLayout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `hooks/__tests__/useMasonryLayout.test.ts`:

```ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { useMasonryLayout } from '../useMasonryLayout'

class MockResizeObserver {
  callback: ResizeObserverCallback
  constructor(cb: ResizeObserverCallback) {
    this.callback = cb
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

function mountGrid(childHeights: number[]) {
  const container = document.createElement('div')
  container.className = 'practice-hub__masonry'
  for (const h of childHeights) {
    const child = document.createElement('div')
    child.className = 'practice-hub__masonry-item'
    // jsdom has no layout; stub the measured height.
    Object.defineProperty(child, 'getBoundingClientRect', {
      value: () => ({ height: h }) as DOMRect,
      configurable: true,
    })
    container.appendChild(child)
  }
  document.body.appendChild(container)
  return container
}

function resetBody() {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild)
  }
}

beforeEach(() => {
  resetBody()
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: false, // desktop by default
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  )
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    () =>
      ({
        getPropertyValue: (prop: string) => {
          if (prop === 'grid-auto-rows') return '8px'
          if (prop === 'row-gap') return '20px'
          return ''
        },
      }) as unknown as CSSStyleDeclaration,
  )
})

describe('useMasonryLayout', () => {
  it('sets gridRowEnd on each child from its measured height', () => {
    // rowBase 8, gap 20 -> unit = 28
    // height 100 -> ceil((100 + 20) / 28) = ceil(4.28) = 5
    // height 300 -> ceil((300 + 20) / 28) = ceil(11.43) = 12
    const container = mountGrid([100, 300])
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(container)
      useMasonryLayout(ref)
    })
    const children = container.children
    expect((children[0] as HTMLElement).style.gridRowEnd).toBe('span 5')
    expect((children[1] as HTMLElement).style.gridRowEnd).toBe('span 12')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- hooks/__tests__/useMasonryLayout.test.ts`
Expected: FAIL — `Failed to resolve import "../useMasonryLayout"` / `useMasonryLayout is not a function`.

- [ ] **Step 3: Write minimal implementation**

Create `hooks/useMasonryLayout.ts`:

```ts
'use client'

import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'

const MOBILE_QUERY = '(max-width: 767px)'
const ITEM_SELECTOR = '.practice-hub__masonry-item'

function parsePx(value: string): number {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

function computeSpan(height: number, rowBase: number, gap: number): number {
  const unit = rowBase + gap
  if (unit <= 0) return 1
  return Math.max(1, Math.ceil((height + gap) / unit))
}

/**
 * Keeps each direct `.practice-hub__masonry-item` child's `gridRowEnd` synced to
 * its measured height so the CSS grid behaves as a masonry. Inert on mobile
 * (where the container is `flex column`) and when `ResizeObserver` is missing.
 */
export function useMasonryLayout(ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const container = ref.current
    if (!container) return

    if (typeof ResizeObserver === 'undefined') {
      container.setAttribute('data-masonry-off', '')
      return
    }

    let mql: MediaQueryList | null = null
    let observer: ResizeObserver | null = null

    const items = () =>
      Array.from(container.querySelectorAll<HTMLElement>(ITEM_SELECTOR))

    const clear = () => {
      for (const item of items()) item.style.gridRowEnd = ''
    }

    const layout = () => {
      if (mql?.matches) {
        clear()
        return
      }
      const styles = window.getComputedStyle(container)
      const rowBase = parsePx(styles.getPropertyValue('grid-auto-rows'))
      const gap = parsePx(styles.getPropertyValue('row-gap'))
      for (const item of items()) {
        const height = item.getBoundingClientRect().height
        item.style.gridRowEnd = `span ${computeSpan(height, rowBase, gap)}`
      }
    }

    mql = window.matchMedia(MOBILE_QUERY)
    const onChange = () => layout()
    mql.addEventListener('change', onChange)

    observer = new ResizeObserver(() => layout())
    observer.observe(container)
    for (const item of items()) observer.observe(item)

    layout()

    return () => {
      mql?.removeEventListener('change', onChange)
      observer?.disconnect()
      clear()
      container.removeAttribute('data-masonry-off')
    }
  }, [ref])
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- hooks/__tests__/useMasonryLayout.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add hooks/useMasonryLayout.ts hooks/__tests__/useMasonryLayout.test.ts
git commit -m "feat(practice): add useMasonryLayout hook for grid row spans"
```

---

## Task 2: `useMasonryLayout` — mobile teardown

**Files:**
- Modify: `hooks/__tests__/useMasonryLayout.test.ts`
- Modify: `hooks/useMasonryLayout.ts` (only if the test fails — the Task 1 implementation should already cover this)

- [ ] **Step 1: Write the failing test**

Append inside the `describe('useMasonryLayout', ...)` block in `hooks/__tests__/useMasonryLayout.test.ts`:

```ts
  it('clears gridRowEnd when the mobile media query matches', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: true, // mobile
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          onchange: null,
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    )
    const container = mountGrid([100, 300])
    // Pre-set stale inline values to prove they get cleared.
    ;(container.children[0] as HTMLElement).style.gridRowEnd = 'span 9'
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(container)
      useMasonryLayout(ref)
    })
    expect((container.children[0] as HTMLElement).style.gridRowEnd).toBe('')
    expect((container.children[1] as HTMLElement).style.gridRowEnd).toBe('')
  })
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `pnpm test -- hooks/__tests__/useMasonryLayout.test.ts`
Expected: PASS (Task 1's `layout()` already returns early after `clear()` when `mql.matches`). If it FAILS, fix `useMasonryLayout.ts` so `layout()` calls `clear()` and returns when `mql?.matches` is true, then re-run.

- [ ] **Step 3: Commit**

```bash
git add hooks/__tests__/useMasonryLayout.test.ts hooks/useMasonryLayout.ts
git commit -m "test(practice): cover mobile teardown in useMasonryLayout"
```

---

## Task 3: `useMasonryLayout` — missing ResizeObserver fallback

**Files:**
- Modify: `hooks/__tests__/useMasonryLayout.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside the `describe` block:

```ts
  it('flags data-masonry-off when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const container = mountGrid([100, 300])
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(container)
      useMasonryLayout(ref)
    })
    expect(container.hasAttribute('data-masonry-off')).toBe(true)
    expect((container.children[0] as HTMLElement).style.gridRowEnd).toBe('')
  })
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pnpm test -- hooks/__tests__/useMasonryLayout.test.ts`
Expected: PASS (Task 1 sets `data-masonry-off` and returns when `typeof ResizeObserver === 'undefined'`). If FAIL, adjust `useMasonryLayout.ts` accordingly.

- [ ] **Step 3: Commit**

```bash
git add hooks/__tests__/useMasonryLayout.test.ts
git commit -m "test(practice): cover missing ResizeObserver in useMasonryLayout"
```

---

## Task 4: `useMasonryLayout` — unmount cleanup

**Files:**
- Modify: `hooks/__tests__/useMasonryLayout.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside the `describe` block:

```ts
  it('disconnects the observer and clears styles on unmount', () => {
    const container = mountGrid([100, 300])
    let disconnectSpy: ReturnType<typeof vi.fn> | null = null
    class SpyRO extends MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        super(cb)
        disconnectSpy = this.disconnect
      }
    }
    vi.stubGlobal('ResizeObserver', SpyRO)

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(container)
      useMasonryLayout(ref)
    })
    expect((container.children[0] as HTMLElement).style.gridRowEnd).toBe('span 5')

    unmount()
    expect(disconnectSpy).toHaveBeenCalled()
    expect((container.children[0] as HTMLElement).style.gridRowEnd).toBe('')
  })
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pnpm test -- hooks/__tests__/useMasonryLayout.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 3: Commit**

```bash
git add hooks/__tests__/useMasonryLayout.test.ts
git commit -m "test(practice): cover unmount cleanup in useMasonryLayout"
```

---

## Task 5: `PRACTICE_CARD_SPANS` map + `data-span` wrappers

**Files:**
- Modify: `components/practice/hub/PracticeOptionsGrid.tsx`
- Create: `components/practice/hub/__tests__/PracticeOptionsGrid.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/practice/hub/__tests__/PracticeOptionsGrid.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import PracticeOptionsGrid from '../PracticeOptionsGrid'
import type { RecommendedResult } from '@/lib/practice/practice-modes'

vi.mock('@/lib/db', () => ({
  setLastPracticeMode: vi.fn(),
}))
vi.mock('@/lib/stores/aiCoachStore', () => ({
  useAICoachStore: (selector: (s: unknown) => unknown) =>
    selector({ openCoach: vi.fn() }),
}))

const recommendation = {
  mode: { id: 'essential-words', href: '/practice/essential-words' },
  headline: '15 palabras esperan repaso',
  subtext: 'Repaso recomendado',
  reason: 'due-review',
} as unknown as RecommendedResult

describe('PracticeOptionsGrid', () => {
  it('renders each card wrapper with the expected data-span', () => {
    const { container } = render(
      <PracticeOptionsGrid
        recommendation={recommendation}
        dueCount={15}
        vocabLearnedCount={612}
        vocabTotalCount={1000}
        arc={undefined}
      />,
    )

    const spans = Array.from(
      container.querySelectorAll('.practice-hub__masonry-item'),
    ).map((el) => el.getAttribute('data-span'))

    // Order matches render order in the component.
    expect(spans).toEqual(['4', '1', '1', '2', '2', '2', '1', '1', '1', '1'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- components/practice/hub/__tests__/PracticeOptionsGrid.test.tsx`
Expected: FAIL — wrappers currently have no `data-span` attribute, so the array is all `null`.

- [ ] **Step 3: Write the implementation**

Replace the entire contents of `components/practice/hub/PracticeOptionsGrid.tsx` with:

```tsx
'use client'

// Planned structure:
// <PracticeOptionsGrid> — CSS Grid masonry (fine columns + JS row spans)
//   Container: flex column on mobile; display:grid repeat(2|4,1fr) + grid-auto-rows:8px from tablet
//   Each card wrapper carries data-span (1 | 2 | 4) → CSS maps to grid-column: span N
//   useMasonryLayout(gridRef) measures each child and sets gridRowEnd so rows collapse to content

import { useRef } from 'react'
import type { SessionArc } from '@/lib/practice/types'
import type { RecommendedResult } from '@/lib/practice/practice-modes'
import { useMasonryLayout } from '@/hooks/useMasonryLayout'
import RecommendedPracticeCard from './RecommendedPracticeCard'
import SoundQuizWidget from './SoundQuizWidget'
import VocabularyReviewCard from './VocabularyReviewCard'
import CoachCallCard from './CoachCallCard'
import DecksCard from './DecksCard'
import ImmersionCard from './ImmersionCard'
import ReaderCard from './ReaderCard'
import CourseCard from './CourseCard'
import GamesSection from './GamesSection'
import ReferenceSection from './ReferenceSection'

// span = columns occupied on DESKTOP (4-col grid). Tablet CSS caps this at 2.
const PRACTICE_CARD_SPANS = {
  recommended: 4,
  vocabulary: 1,
  decks: 1,
  soundQuiz: 2,
  coach: 2,
  games: 2,
  immersion: 1,
  reader: 1,
  course: 1,
  reference: 1,
} as const

interface PracticeOptionsGridProps {
  recommendation: RecommendedResult
  dueCount: number | null
  vocabLearnedCount: number | null
  vocabTotalCount: number | null
  arc?: SessionArc
}

export default function PracticeOptionsGrid({
  recommendation,
  dueCount,
  vocabLearnedCount,
  vocabTotalCount,
  arc,
}: PracticeOptionsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  useMasonryLayout(gridRef)

  return (
    <div className="practice-hub__masonry" ref={gridRef}>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.recommended}>
        <RecommendedPracticeCard recommendation={recommendation} />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.vocabulary}>
        <VocabularyReviewCard
          dueCount={dueCount}
          learnedCount={vocabLearnedCount}
          totalCount={vocabTotalCount}
        />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.decks}>
        <DecksCard />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.soundQuiz}>
        <SoundQuizWidget />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.coach}>
        <CoachCallCard arc={arc} />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.games}>
        <GamesSection />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.immersion}>
        <ImmersionCard />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.reader}>
        <ReaderCard />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.course}>
        <CourseCard />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.reference}>
        <ReferenceSection />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- components/practice/hub/__tests__/PracticeOptionsGrid.test.tsx`
Expected: PASS (1 test). The span array is `['4','1','1','2','2','2','1','1','1','1']`.

> If the test fails because `SoundQuizWidget` / another card throws in jsdom (missing mock), add the minimal `vi.mock(...)` for that module at the top of the test file to stub its side-effecting imports — do not change component render order.

- [ ] **Step 5: Commit**

```bash
git add components/practice/hub/PracticeOptionsGrid.tsx components/practice/hub/__tests__/PracticeOptionsGrid.test.tsx
git commit -m "feat(practice): span map and data-span wrappers in PracticeOptionsGrid"
```

---

## Task 6: Rewrite masonry CSS (flex → grid + data-span)

**Files:**
- Modify: `app/styles/practice-hub.css` (lines 27–38, the `.practice-hub__masonry` block)

- [ ] **Step 1: Replace the `.practice-hub__masonry` rules**

In `app/styles/practice-hub.css`, delete the current block:

```css
.practice-hub__masonry {
  column-width: 320px;
  column-gap: var(--space-5);
  column-fill: balance;
}

.practice-hub__masonry-item {
  display: inline-block;
  width: 100%;
  margin-bottom: var(--space-5);
  break-inside: avoid;
}
```

and replace it with:

```css
.practice-hub__masonry {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

@media (min-width: 768px) {
  .practice-hub__masonry {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 8px;
    gap: var(--space-5);
    align-items: start;
  }

  .practice-hub__masonry-item {
    grid-column: span 1;
  }

  .practice-hub__masonry-item[data-span='2'],
  .practice-hub__masonry-item[data-span='4'] {
    grid-column: span 2;
  }
}

@media (min-width: 1024px) {
  .practice-hub__masonry {
    grid-template-columns: repeat(4, 1fr);
  }

  .practice-hub__masonry-item[data-span='2'] {
    grid-column: span 2;
  }

  .practice-hub__masonry-item[data-span='4'] {
    grid-column: span 4;
  }
}

/* Fallback when ResizeObserver is unavailable: plain grid, each item on its own row */
.practice-hub__masonry[data-masonry-off] .practice-hub__masonry-item {
  grid-row: auto;
}
```

- [ ] **Step 2: Verify CSS compiles**

Run: `pnpm build`
Expected: build succeeds, no CSS parse error. (Alternatively `pnpm dev` and load `/practice`.)

- [ ] **Step 3: Commit**

```bash
git add app/styles/practice-hub.css
git commit -m "style(practice): replace CSS Columns masonry with CSS Grid + row spans"
```

---

## Task 7: Remove `h-fit` from hub cards

**Files:**
- Modify: `components/practice/hub/CoachCallCard.tsx` (root `<div>` className, line ~29)
- Modify: `components/practice/hub/CourseCard.tsx` (root element className, line ~14)
- Modify: `components/practice/hub/DecksCard.tsx` (root element className, line ~15)
- Modify: `components/practice/hub/GamesSection.tsx` (root `<div>` className, line ~18)
- Modify: `components/practice/hub/ImmersionCard.tsx` (root element className, line ~15)
- Modify: `components/practice/hub/ReaderCard.tsx` (root element className, line ~14)
- Modify: `components/practice/hub/RecommendedPracticeCard.tsx` (root `<div>` className, line ~24)
- Modify: `components/practice/hub/ReferenceSection.tsx` (root `<Link>` className, line ~13)
- Modify: `components/practice/hub/VocabularyReviewCard.tsx` (root element className, line ~33)

- [ ] **Step 1: Remove the `h-fit` class**

In each file above, remove the ` h-fit` token from the root element's `className` string (delete `h-fit` and one adjacent space; keep every other class). Do **not** touch `SoundQuizWidget.tsx` (it has no `h-fit`).

Verification that none remain:

Run: `grep -rn "h-fit" components/practice/hub/`
Expected: **no matches** (the old comment reference in `PracticeOptionsGrid.tsx` was removed in Task 5).

- [ ] **Step 2: Run the hub tests**

Run: `pnpm test -- components/practice/hub/`
Expected: PASS — `GamesSection.test.tsx` and `PracticeOptionsGrid.test.tsx` green.

- [ ] **Step 3: Commit**

```bash
git add components/practice/hub/
git commit -m "style(practice): drop h-fit from hub cards so grid controls height"
```

---

## Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Type-check**

Run: `pnpm type-check`
Expected: no errors.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors, no new warnings for the touched files.

- [ ] **Step 3: Unit tests**

Run: `pnpm test -- hooks/__tests__/useMasonryLayout.test.ts components/practice/hub/`
Expected: all green (4 hook tests + hub tests).

- [ ] **Step 4: Manual browser check**

Run: `pnpm dev`, open `/practice`.
Expected:
- Desktop (≥1024px): 4-column grid; "Empieza por lo esencial" spans full width; "Laboratorio de sonidos", "Coach de conversación", "Juegos de vocabulario" span 2; the rest span 1. No large vertical gaps between cards — rows collapse to content.
- Tablet (768–1023px): 2 columns; wide cards span 2 (full row); no gaps.
- Mobile (<768px): single column, cards stacked in render order at natural height.
- Resize the window across breakpoints: layout re-flows without stuck inline heights.

- [ ] **Step 5: Commit (only if a doc/tweak changed during verification)**

```bash
git add -A
git commit -m "chore(practice): verify masonry grid across breakpoints" --allow-empty
```

---

## Self-Review

**1. Spec coverage:**
- Technique (CSS Grid + `grid-auto-rows` + JS `grid-row: span N`) → Tasks 1, 6.
- Responsive `< 768` flex / `768–1023` 2-col / `≥ 1024` 4-col → Task 6 CSS; hook inert on mobile → Tasks 1–2.
- `useMasonryLayout` hook (ResizeObserver on container + children, `useLayoutEffect`, `getComputedStyle` for row/gap, `matchMedia` mobile teardown, full cleanup) → Tasks 1–4.
- `PRACTICE_CARD_SPANS` fixed per-type map with the spec's table → Task 5.
- `PracticeOptionsGrid` refactor (props unchanged, `gridRef`, `data-span` wrappers, updated comment) → Task 5.
- CSS rewrite of `.practice-hub__masonry*` incl. `data-masonry-off` fallback → Task 6.
- Remove `h-fit` from the 9 cards (SoundQuizWidget excluded — confirmed no `h-fit`) → Task 7.
- Tests: `useMasonryLayout.test.ts` (span math, mobile teardown, missing RO, unmount cleanup) → Tasks 1–4; `PracticeOptionsGrid.test.tsx` (data-span per wrapper) → Task 5, verified Task 8.
- Type-check + lint + existing tests → Task 8.
- Edge cases: missing `ResizeObserver` (Task 3 + Task 6 CSS), async height change via per-child `ResizeObserver` (Task 1), SSR flash mitigated by `useLayoutEffect` (Task 1), offline unaffected (no network code). Covered.

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases" left as instructions. Every code step has full code. The one conditional note (Task 5 Step 4) gives a concrete action (add a `vi.mock` for a throwing module) rather than a vague deferral.

**3. Type consistency:** `useMasonryLayout(ref: RefObject<HTMLElement | null>)` defined in Task 1, called with `useRef<HTMLDivElement>(null)` in Task 5 (`HTMLDivElement` assignable to `HTMLElement`, `null` initial matches). Helper names `computeSpan` / `parsePx` / `clear` / `layout` used consistently within Task 1. `PRACTICE_CARD_SPANS` keys (`recommended`, `vocabulary`, `decks`, `soundQuiz`, `coach`, `games`, `immersion`, `reader`, `course`, `reference`) match the wrapper usages in Task 5 one-to-one. `data-span` values (`1|2|4`) match the CSS attribute selectors in Task 6. Render order in Task 5 (`recommended, vocabulary, decks, soundQuiz, coach, games, immersion, reader, course, reference`) matches the expected span array `['4','1','1','2','2','2','1','1','1','1']` in the Task 5 test.
