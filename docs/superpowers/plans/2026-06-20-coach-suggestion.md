# AI-Coach Suggestion (on session end) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Offer the AI coach (seeded chat + voice interview) as an optional next step when a user finishes their daily, surfaced in both the daily recap and the practice hub.

**Architecture:** A pure `buildCoachPrefill(arc)` produces a session-seeded prefill string. A reusable client component `SpeakWithCoachCard` renders two buttons that call the existing global `aiCoachStore.openCoach({ tab, prefill })` — no routing, no new panel. The card is dropped into `SessionRecapCard` and the practice hub.

**Tech Stack:** Next.js 15, React 19, Zustand (`aiCoachStore`), Tailwind v4, Vitest.

**Precedent:** `components/ipa/PracticeWithAICTA.tsx` already opens the coach via `openCoach({ tab, prefill })`; the panel is globally mounted in `AppShell` (`AICoachPanel`).

---

## File Structure

- `lib/ai-practice/coach-prefill.ts` — **new.** Pure `buildCoachPrefill(arc)`. Lives in `lib/ai-practice/` per the "no prompt strings in components" rule.
- `lib/ai-practice/__tests__/coach-prefill.test.ts` — **new.** Unit tests.
- `components/ai-coach/SpeakWithCoachCard.tsx` — **new.** Reusable card with two `openCoach` buttons.
- `components/daily/SessionRecapCard.tsx` — **modify.** Render the card under existing CTAs.
- `components/practice/hub/PracticeHubClient.tsx` — **modify** (from the practice-hub plan; if that plan is not yet executed, add this wiring when it is). Render the card under the grid, passing the cached `arc`.

> **Dependency note:** Tasks 1–3 are standalone. Task 4 (recap) is standalone. Task 5 (hub) depends on the practice-hub plan being implemented first. If the hub does not yet exist, skip Task 5 and add the card there as part of hub work.

---

## Task 1: `buildCoachPrefill` pure function

**Files:**
- Create: `lib/ai-practice/coach-prefill.ts`
- Test: `lib/ai-practice/__tests__/coach-prefill.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/ai-practice/__tests__/coach-prefill.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildCoachPrefill } from '../coach-prefill'

describe('buildCoachPrefill', () => {
  it('seeds with session words when present (capped at 6)', () => {
    const out = buildCoachPrefill({
      soundIpa: null,
      topicLabel: 'Food',
      sessionWords: ['order', 'menu', 'waiter', 'bill', 'table', 'tip', 'extra'],
    })
    expect(out).toContain('order, menu, waiter, bill, table, tip')
    expect(out).not.toContain('extra')
    expect(out.toLowerCase()).toContain("today's words")
  })

  it('falls back to topic when there are no words', () => {
    const out = buildCoachPrefill({
      soundIpa: null,
      topicLabel: 'Travel',
      sessionWords: [],
    })
    expect(out).toContain('Travel')
  })

  it('returns empty string when arc is undefined', () => {
    expect(buildCoachPrefill(undefined)).toBe('')
  })

  it('returns empty string when arc has no words and no topic', () => {
    expect(
      buildCoachPrefill({ soundIpa: null, topicLabel: null, sessionWords: [] }),
    ).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/ai-practice/__tests__/coach-prefill.test.ts`
Expected: FAIL — cannot resolve `../coach-prefill`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/ai-practice/coach-prefill.ts`:

```ts
import type { SessionArc } from '@/lib/practice/types'

const MAX_SEED_WORDS = 6

/**
 * Build a seeded opening message for the AI coach from a session's arc.
 * Empty string means "open the coach with no seed" (generic).
 */
export function buildCoachPrefill(arc: SessionArc | undefined): string {
  if (!arc) return ''

  const words = arc.sessionWords.slice(0, MAX_SEED_WORDS)
  if (words.length > 0) {
    return `Let's practice using today's words: ${words.join(', ')}. Ask me questions that make me use them.`
  }

  if (arc.topicLabel) {
    return `Let's have a conversation about ${arc.topicLabel}.`
  }

  return ''
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/ai-practice/__tests__/coach-prefill.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/coach-prefill.ts lib/ai-practice/__tests__/coach-prefill.test.ts
git commit -m "feat(coach): buildCoachPrefill — seed coach from session arc"
```

---

## Task 2: `SpeakWithCoachCard` component

**Files:**
- Create: `components/ai-coach/SpeakWithCoachCard.tsx`
- Test: `components/ai-coach/__tests__/SpeakWithCoachCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/ai-coach/__tests__/SpeakWithCoachCard.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SpeakWithCoachCard from '../SpeakWithCoachCard'

const openCoach = vi.fn()
vi.mock('@/lib/stores/aiCoachStore', () => ({
  useAICoachStore: (selector: (s: { openCoach: typeof openCoach }) => unknown) =>
    selector({ openCoach }),
}))

describe('SpeakWithCoachCard', () => {
  beforeEach(() => openCoach.mockClear())

  const arc = { soundIpa: null, topicLabel: 'Food', sessionWords: ['order', 'menu'] }

  it('opens chat with the seeded prefill', () => {
    render(<SpeakWithCoachCard arc={arc} />)
    fireEvent.click(screen.getByRole('button', { name: /conversa/i }))
    expect(openCoach).toHaveBeenCalledWith({
      tab: 'chat',
      prefill: expect.stringContaining('order, menu'),
    })
  })

  it('opens interview with the same prefill', () => {
    render(<SpeakWithCoachCard arc={arc} />)
    fireEvent.click(screen.getByRole('button', { name: /entrevista/i }))
    expect(openCoach).toHaveBeenCalledWith({
      tab: 'interview',
      prefill: expect.stringContaining('order, menu'),
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test components/ai-coach/__tests__/SpeakWithCoachCard.test.tsx`
Expected: FAIL — cannot resolve `../SpeakWithCoachCard`.

- [ ] **Step 3: Write minimal implementation**

Create `components/ai-coach/SpeakWithCoachCard.tsx`:

```tsx
'use client'

import { MessageCircle, Mic } from 'lucide-react'
import { useAICoachStore } from '@/lib/stores/aiCoachStore'
import { buildCoachPrefill } from '@/lib/ai-practice/coach-prefill'
import type { SessionArc } from '@/lib/practice/types'

// Planned structure:
// <SpeakWithCoachCard> — heading + two buttons (chat / voice interview)

interface Props {
  arc: SessionArc | undefined
}

export default function SpeakWithCoachCard({ arc }: Props) {
  const openCoach = useAICoachStore((s) => s.openCoach)
  const prefill = buildCoachPrefill(arc)

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4">
      <div>
        <p className="font-body-sm font-semibold text-[var(--text-primary)]">
          Speak it out loud
        </p>
        <p className="font-caption text-[var(--text-tertiary)]">
          Practice today’s words in a real conversation with the coach.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => openCoach({ tab: 'chat', prefill })}
          className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-sunken px-4 py-2.5 font-body-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--hue-icon-bg)] focus-ring"
        >
          <MessageCircle size={15} aria-hidden />
          Conversa sobre esto
        </button>
        <button
          type="button"
          onClick={() => openCoach({ tab: 'interview', prefill })}
          className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-sunken px-4 py-2.5 font-body-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--hue-icon-bg)] focus-ring"
        >
          <Mic size={15} aria-hidden />
          Entrevista por voz
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test components/ai-coach/__tests__/SpeakWithCoachCard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ai-coach/SpeakWithCoachCard.tsx components/ai-coach/__tests__/SpeakWithCoachCard.test.tsx
git commit -m "feat(coach): SpeakWithCoachCard — seeded chat + interview launchers"
```

---

## Task 3: Render the card in the daily recap

**Files:**
- Modify: `components/daily/SessionRecapCard.tsx`

- [ ] **Step 1: Import the card**

In `components/daily/SessionRecapCard.tsx`, add to the imports (near line 12):

```tsx
import SpeakWithCoachCard from '@/components/ai-coach/SpeakWithCoachCard'
```

- [ ] **Step 2: Render it under the CTAs**

In `SessionRecapCard.tsx`, immediately after the closing `</div>` of the CTA row
(the `<div className="mt-4 flex flex-col gap-3 sm:flex-row">` block that ends at
line 111), add:

```tsx
        <div className="mt-6 w-full max-w-sm">
          <SpeakWithCoachCard arc={arc} />
        </div>
```

(`arc` is already a prop of `SessionRecapCard`.)

- [ ] **Step 3: Type-check + run recap tests**

Run: `pnpm type-check && pnpm test components/daily`
Expected: PASS. Existing `SessionRecapCard` tests still pass (the card mocks nothing extra; if a recap test does a full render without jsdom mocks for the store, confirm it still mounts — `SpeakWithCoachCard` only reads `openCoach`, which is safe to call lazily).

- [ ] **Step 4: Commit**

```bash
git add components/daily/SessionRecapCard.tsx
git commit -m "feat(daily): suggest AI coach from the session recap"
```

---

## Task 4: Render the card in the practice hub

**Depends on:** the practice-hub plan (`2026-06-20-practice-hub.md`) being implemented. If `components/practice/hub/PracticeHubClient.tsx` does not exist yet, skip this task and fold it into the hub work.

**Files:**
- Modify: `components/practice/hub/PracticeHubClient.tsx`

- [ ] **Step 1: Import + read the arc**

`PracticeHubClient` already loads the cached plan’s arc for the recommendation
(see hub plan, Task 6). Add the import near the other component imports:

```tsx
import SpeakWithCoachCard from '@/components/ai-coach/SpeakWithCoachCard'
```

Hold the resolved arc in state so the card can use it. In the existing
`resolve()` effect, after computing `arc`, store it:

```tsx
  const [arc, setArc] = useState<import('@/lib/practice/types').SessionArc | undefined>(undefined)
```

and inside the effect, set it alongside the recommendation:

```tsx
      if (!cancelled) {
        setArc(arc)
        setRecommendation(result)
      }
```

(Replace the existing `if (!cancelled) setRecommendation(result)` line.)

- [ ] **Step 2: Render the card under the grid**

After the `<PracticeOptionsGrid ... />` element inside the `recommendation && (...)`
fragment, add:

```tsx
          <SpeakWithCoachCard arc={arc} />
```

- [ ] **Step 3: Type-check + run tests**

Run: `pnpm type-check && pnpm test`
Expected: PASS.

- [ ] **Step 4: Manual smoke (optional)**

Run: `pnpm dev`. Finish a daily → recap shows the coach card; clicking "Conversa
sobre esto" opens the global coach panel on the chat tab with the seeded message.

- [ ] **Step 5: Commit**

```bash
git add components/practice/hub/PracticeHubClient.tsx
git commit -m "feat(practice): suggest AI coach in the practice hub"
```

---

## Self-Review Notes

- **Spec coverage:** seeded prefill with words/topic/fallback (Task 1), reusable card with chat + interview launchers via global store (Task 2), surfaced in recap (Task 3) and hub (Task 4). Edge cases (no arc / no words → empty prefill) covered in Task 1 tests; card stays visible with generic copy regardless.
- **Type consistency:** `buildCoachPrefill(arc: SessionArc | undefined)`, `SpeakWithCoachCard` prop `arc`, `openCoach({ tab, prefill })` match `aiCoachStore.OpenCoachOptions` (`tab?: 'chat' | 'interview' | 'pronunciation'`, `prefill?: string`).
- **No placeholders:** all code shown. Copy is intentionally mixed ES/EN to match existing UI (recap uses ES button copy, headings use EN display font) — confirm with project tone during review if needed.
