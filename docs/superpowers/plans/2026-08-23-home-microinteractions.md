# Home Microinteractions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire four user-triggered microinteractions (favorite heart, phrase change, step-complete tick, streak increment) with coordinated CSS animation + existing UI sound cues, reusing the motion-pattern system already defined in `app/styles/animations.css`.

**Architecture:** One new CSS motion pattern (`heart-pop`, with a new spring-overshoot easing token) added to `app/styles/animations.css`; two reused existing patterns (`success-pulse`, `notification-bounce`); one new hook (`hooks/useRetrigger.ts`) that centralizes the forced-reflow re-trigger trick in two shapes (`useRetrigger` for imperative triggers, `useRetriggerOnIncrease` for value-watching); four small component edits that call the hook and `playUiCue(...)` at the same call site.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (tokens in `app/styles/tokens.css`), Vitest + Testing Library, existing `lib/ui-sounds/cues.ts` sound engine.

**Spec:** [`docs/superpowers/specs/2026-08-23-home-microinteractions-design.md`](../specs/2026-08-23-home-microinteractions-design.md)

---

## Task 1: Add `--dur-celebrate` / `--ease-spring` tokens

**Files:**
- Modify: `app/styles/tokens.css:23-24`

- [ ] **Step 1: Add the two new tokens next to the existing easing tokens**

In `app/styles/tokens.css`, immediately after line 24 (`--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);`), add:

```css
  --dur-celebrate: 420ms;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

- [ ] **Step 2: Verify the build picks up the tokens**

Run: `pnpm type-check`
Expected: no errors (CSS custom properties aren't type-checked, this just confirms nothing else broke).

- [ ] **Step 3: Commit**

```bash
git add app/styles/tokens.css
git commit -m "feat(tokens): add --dur-celebrate and --ease-spring motion tokens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Add `heart-pop` keyframe + class, wire into reduced-motion block

**Files:**
- Modify: `app/styles/animations.css`

- [ ] **Step 1: Add the `heart-pop` keyframe and class**

In `app/styles/animations.css`, after the existing `.animate-accuracy-pop` block (around line 173), add:

```css
@keyframes heart-pop {
  0%   { transform: scale(1); }
  35%  { transform: scale(1.32); }
  65%  { transform: scale(0.94); }
  100% { transform: scale(1); }
}
.animate-heart-pop {
  animation: heart-pop var(--dur-celebrate) var(--ease-spring);
  will-change: transform;
}
```

- [ ] **Step 2: Add `.animate-heart-pop` to the reduced-motion block**

In the same file, inside the `@media (prefers-reduced-motion: reduce)` block (around line 214), add `.animate-heart-pop,` to the list of animation classes that get `animation: none !important`. Insert it alphabetically-ish near the other `.animate-*` entries, e.g. right after `.animate-grid-in,`:

```css
  .animate-grid-in,
  .animate-heart-pop,
  .animate-weak-pulse,
```

- [ ] **Step 3: Verify no CSS/build errors**

Run: `pnpm build`
Expected: build succeeds (Tailwind v4 + PostCSS picks up the new keyframes without special config).

- [ ] **Step 4: Commit**

```bash
git add app/styles/animations.css
git commit -m "feat(motion): add heart-pop animation pattern

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: `useRetrigger` hook — imperative trigger

**Files:**
- Create: `hooks/useRetrigger.ts`
- Test: `hooks/__tests__/useRetrigger.test.tsx`

- [ ] **Step 1: Write the failing test for the imperative shape**

Create `hooks/__tests__/useRetrigger.test.tsx`:

```tsx
// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRetrigger } from '../useRetrigger'

function TestButton() {
  const { ref, trigger } = useRetrigger<HTMLButtonElement>('animate-heart-pop')
  return (
    <button ref={ref} data-testid="btn" onClick={trigger}>
      heart
    </button>
  )
}

describe('useRetrigger', () => {
  it('adds the animation class on trigger', () => {
    render(<TestButton />)
    const btn = screen.getByTestId('btn')
    expect(btn.classList.contains('animate-heart-pop')).toBe(false)

    fireEvent.click(btn)

    expect(btn.classList.contains('animate-heart-pop')).toBe(true)
  })

  it('forces a reflow so back-to-back triggers both apply the class', () => {
    render(<TestButton />)
    const btn = screen.getByTestId('btn')

    // Force the reflow read to happen so we can assert it occurred.
    const reflowSpy = vi.spyOn(btn, 'offsetWidth', 'get')

    fireEvent.click(btn)
    fireEvent.click(btn)

    expect(btn.classList.contains('animate-heart-pop')).toBe(true)
    expect(reflowSpy).toHaveBeenCalled()
  })

  it('does not throw when ref is not yet attached', () => {
    function Unmounted() {
      const { trigger } = useRetrigger<HTMLButtonElement>('animate-heart-pop')
      return (
        <button data-testid="btn2" onClick={trigger}>
          no ref
        </button>
      )
    }
    render(<Unmounted />)
    const btn = screen.getByTestId('btn2')
    expect(() => fireEvent.click(btn)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test hooks/__tests__/useRetrigger.test.tsx`
Expected: FAIL — `Cannot find module '../useRetrigger'`

- [ ] **Step 3: Write `hooks/useRetrigger.ts`**

```ts
'use client'

import { useCallback, useRef } from 'react'

/**
 * Imperatively re-triggers a CSS animation class on an element.
 *
 * A CSS animation does not restart if its class is already applied — the
 * documented cause of "the second click doesn't animate." `trigger()`
 * removes the class, forces a synchronous reflow (`void el.offsetWidth`),
 * then re-adds the class so the browser recomputes and restarts it.
 */
export function useRetrigger<T extends HTMLElement>(animationClass: string) {
  const ref = useRef<T | null>(null)

  const trigger = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.classList.remove(animationClass)
    void el.offsetWidth
    el.classList.add(animationClass)
  }, [animationClass])

  return { ref, trigger }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test hooks/__tests__/useRetrigger.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add hooks/useRetrigger.ts hooks/__tests__/useRetrigger.test.tsx
git commit -m "feat: add useRetrigger hook for imperative CSS animation re-trigger

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: `useRetriggerOnIncrease` — value-watching variant

**Files:**
- Modify: `hooks/useRetrigger.ts`
- Test: `hooks/__tests__/useRetrigger.test.tsx`

- [ ] **Step 1: Add failing tests for the value-watching shape**

Append to `hooks/__tests__/useRetrigger.test.tsx`:

```tsx
import { useRetriggerOnIncrease } from '../useRetrigger'

function TestCounter({ value }: { value: number }) {
  const ref = useRetriggerOnIncrease<HTMLSpanElement>(value, 'animate-notification-bounce')
  return (
    <span ref={ref} data-testid="counter">
      {value}
    </span>
  )
}

describe('useRetriggerOnIncrease', () => {
  it('does not animate on first mount', () => {
    render(<TestCounter value={3} />)
    const el = screen.getByTestId('counter')
    expect(el.classList.contains('animate-notification-bounce')).toBe(false)
  })

  it('animates when the value increases', () => {
    const { rerender } = render(<TestCounter value={3} />)
    rerender(<TestCounter value={4} />)
    const el = screen.getByTestId('counter')
    expect(el.classList.contains('animate-notification-bounce')).toBe(true)
  })

  it('does not animate when the value decreases', () => {
    const { rerender } = render(<TestCounter value={5} />)
    rerender(<TestCounter value={2} />)
    const el = screen.getByTestId('counter')
    expect(el.classList.contains('animate-notification-bounce')).toBe(false)
  })

  it('does not animate when the value is unchanged', () => {
    const { rerender } = render(<TestCounter value={5} />)
    rerender(<TestCounter value={5} />)
    const el = screen.getByTestId('counter')
    expect(el.classList.contains('animate-notification-bounce')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify the new tests fail**

Run: `pnpm test hooks/__tests__/useRetrigger.test.tsx`
Expected: FAIL — `useRetriggerOnIncrease is not exported`

- [ ] **Step 3: Add `useRetriggerOnIncrease` to `hooks/useRetrigger.ts`**

First, replace the file's import line (`import { useCallback, useRef } from 'react'`) with:

```ts
import { useCallback, useEffect, useRef } from 'react'
```

Then append this export at the end of the file:

```ts
/**
 * Re-triggers a CSS animation class whenever `value` strictly increases
 * compared to its previous render — never on first mount, never on a
 * decrease or no-op change. Use for counters where only "went up" should
 * celebrate (e.g. a streak count).
 */
export function useRetriggerOnIncrease<T extends HTMLElement>(
  value: number,
  animationClass: string,
) {
  const ref = useRef<T | null>(null)
  const prevValue = useRef<number | null>(null)

  useEffect(() => {
    const el = ref.current
    const previous = prevValue.current
    prevValue.current = value

    if (!el) return
    if (previous === null) return
    if (value <= previous) return

    el.classList.remove(animationClass)
    void el.offsetWidth
    el.classList.add(animationClass)
  }, [value, animationClass])

  return ref
}
```

Remove the stray `import { useEffect, useRef as useRefAlias } from 'react'` line added in the first sub-step — it was only scratch scaffolding; the real import is the merged one above.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test hooks/__tests__/useRetrigger.test.tsx`
Expected: PASS (7 tests total)

- [ ] **Step 5: Commit**

```bash
git add hooks/useRetrigger.ts hooks/__tests__/useRetrigger.test.tsx
git commit -m "feat: add useRetriggerOnIncrease for value-watching animations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Favorite heart — `HomeWordOfDayCard`

**Files:**
- Modify: `components/home/HomeWordOfDayCard.tsx:1-133`
- Test: `components/home/__tests__/HomeWordOfDayCard.test.tsx` (create if it doesn't exist; check first)

- [ ] **Step 1: Check for an existing test file**

Run: `ls components/home/__tests__/HomeWordOfDayCard.test.tsx`

If it exists, read it fully before editing (`Read` tool) so Step 2 extends it instead of clobbering it. If it doesn't exist, Step 2 creates a new minimal file.

- [ ] **Step 2: Write/extend the test**

Add this test (adjust import/mocking boilerplate to match whatever the existing file already sets up for `useWordOfDay`/`useAuth` mocks; if creating fresh, use this full file):

```tsx
// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HomeWordOfDayCard from '../HomeWordOfDayCard'

const playUiCue = vi.fn()
vi.mock('@/lib/ui-sounds/cues', () => ({
  playUiCue: (...args: unknown[]) => playUiCue(...args),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))

vi.mock('@/hooks/useWordOfDay', () => ({
  useWordOfDay: () => ({
    word: {
      word: 'serendipity',
      ipa: '/ˌserənˈdɪpɪti/',
      definition: 'a happy accident',
      example_sentence: 'Finding this cafe was pure serendipity.',
    },
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}))

vi.mock('@/lib/word-bank/queries', () => ({
  quickAddWord: vi.fn().mockResolvedValue({ id: 'w1' }),
  toggleFavorite: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  playUiCue.mockClear()
})

describe('HomeWordOfDayCard favorite heart', () => {
  it('plays the save cue and pops the heart when saved', async () => {
    render(<HomeWordOfDayCard />)

    const button = screen.getByRole('button', { name: 'Guardar palabra' })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Guardada' })).toBeInTheDocument()
    })

    expect(playUiCue).toHaveBeenCalledWith('save')
    expect(button.classList.contains('animate-heart-pop')).toBe(true)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test components/home/__tests__/HomeWordOfDayCard.test.tsx`
Expected: FAIL — `playUiCue` not called / `animate-heart-pop` class missing

- [ ] **Step 4: Wire `useRetrigger` + `playUiCue` into `handleSave`**

In `components/home/HomeWordOfDayCard.tsx`, add imports (after the existing `quickAddWord, toggleFavorite` import on line 21):

```ts
import { playUiCue } from "@/lib/ui-sounds/cues";
import { useRetrigger } from "@/hooks/useRetrigger";
```

Inside the component, after the `saveState` useState (line 42), add:

```ts
  const { ref: heartRef, trigger: popHeart } = useRetrigger<HTMLButtonElement>("animate-heart-pop");
```

Replace the `handleSave` function (lines 65-79) with:

```ts
  async function handleSave() {
    if (!word || saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    try {
      const entry = await quickAddWord({
        text: word.word,
        context: word.example_sentence || word.definition || null,
        source: "manual",
      });
      await toggleFavorite(entry.id, true);
      setSaveState("saved");
      popHeart();
      playUiCue("save");
    } catch {
      setSaveState("error");
    }
  }
```

Attach the ref to the heart `<button>` (line 114, the one with `aria-label={label}`):

```tsx
              <button
                ref={heartRef}
                type="button"
                onClick={() => void handleSave()}
                disabled={saveState === "saving" || saveState === "saved"}
                aria-label={label}
                aria-describedby="word-save-tooltip"
                className={cn(
                  "focus-ring inline-flex min-h-10 min-w-10 items-center justify-center rounded-sm transition-colors",
                  saveState === "saved"
                    ? "text-error"
                    : "text-fg-muted hover:text-fg",
                  saveState === "error" && "text-error",
                )}
              >
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test components/home/__tests__/HomeWordOfDayCard.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/home/HomeWordOfDayCard.tsx components/home/__tests__/HomeWordOfDayCard.test.tsx
git commit -m "feat(home): animate + sound the favorite heart on word save

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Favorite heart — `WordCard` (Vocabulario)

**Files:**
- Modify: `components/vocabulary/words/WordCard.tsx:1-123`
- Test: `components/vocabulary/words/__tests__/WordCard.test.tsx` (create if it doesn't exist; check first)

- [ ] **Step 1: Check for an existing test file**

Run: `ls components/vocabulary/words/__tests__/WordCard.test.tsx`

If it exists, read it fully first and extend it. Otherwise create fresh with Step 2's full file.

- [ ] **Step 2: Write/extend the test**

```tsx
// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WordCard } from '../WordCard'
import type { WordBankEntry } from '@/lib/word-bank/types'

const playUiCue = vi.fn()
vi.mock('@/lib/ui-sounds/cues', () => ({
  playUiCue: (...args: unknown[]) => playUiCue(...args),
}))

vi.mock('@/hooks/useAudioPlayback', () => ({
  useAudioPlayback: () => ({ play: vi.fn() }),
}))

const word: WordBankEntry = {
  id: 'w1',
  text: 'ephemeral',
  status: 'ready',
} as WordBankEntry

beforeEach(() => {
  playUiCue.mockClear()
})

describe('WordCard favorite heart', () => {
  it('plays the save cue and pops the heart when toggled to favorite', () => {
    const onToggleFavorite = vi.fn()
    render(
      <WordCard
        word={word}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
        isFavorite={false}
        onToggleFavorite={onToggleFavorite}
      />,
    )

    const heartButton = screen.getByRole('button', { name: 'Add to favorites' })
    fireEvent.click(heartButton)

    expect(onToggleFavorite).toHaveBeenCalled()
    expect(playUiCue).toHaveBeenCalledWith('save')
    expect(heartButton.classList.contains('animate-heart-pop')).toBe(true)
  })

  it('does not play the save cue when toggling off a favorite', () => {
    const onToggleFavorite = vi.fn()
    render(
      <WordCard
        word={word}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
        isFavorite={true}
        onToggleFavorite={onToggleFavorite}
      />,
    )

    const heartButton = screen.getByRole('button', { name: 'Remove from favorites' })
    fireEvent.click(heartButton)

    expect(onToggleFavorite).toHaveBeenCalled()
    expect(playUiCue).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test components/vocabulary/words/__tests__/WordCard.test.tsx`
Expected: FAIL — cue/class assertions fail

- [ ] **Step 4: Wire `useRetrigger` + `playUiCue` into the heart button**

In `components/vocabulary/words/WordCard.tsx`, add imports after line 11 (`import { getWordStrength } from "@/lib/word-bank/strength";`):

```ts
import { playUiCue } from "@/lib/ui-sounds/cues";
import { useRetrigger } from "@/hooks/useRetrigger";
```

Inside the component, after line 24 (`const { play } = useAudioPlayback(...)`), add:

```ts
  const { ref: heartRef, trigger: popHeart } = useRetrigger<HTMLButtonElement>("animate-heart-pop");
```

Replace the favorite button block (lines 100-108) with:

```tsx
          {onToggleFavorite && (
            <button
              ref={heartRef}
              onClick={e => {
                e.stopPropagation();
                const willBecomeFavorite = !isFavorite;
                onToggleFavorite();
                if (willBecomeFavorite) {
                  popHeart();
                  playUiCue("save");
                }
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className={`p-1.5 rounded-full transition-colors ${ isFavorite ? "text-error hover:text-error/70" : "text-fg-muted hover:text-fg" }`}
            >
              <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          )}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test components/vocabulary/words/__tests__/WordCard.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/vocabulary/words/WordCard.tsx components/vocabulary/words/__tests__/WordCard.test.tsx
git commit -m "feat(vocabulary): animate + sound the favorite heart on WordCard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Step-complete tick — `DailyStepList`

**Files:**
- Modify: `components/daily/DailyStepList.tsx:1-244`
- Test: `components/daily/__tests__/DailyStepList.test.tsx` (create if it doesn't exist; check first)

- [ ] **Step 1: Check for an existing test file**

Run: `ls components/daily/__tests__/DailyStepList.test.tsx`

If it exists, read it fully first and extend it with the test below (matching its existing mock setup for `DailyStep`/`getStepStatus`). Otherwise create fresh — but first read `lib/practice/types.ts` for the `DailyStep` shape and `hooks/useDailyPlan.ts` for `DailyStepStatus`, since the fresh-file test below needs a minimal valid step object.

```
Read lib/practice/types.ts (search for `interface DailyStep`)
Read hooks/useDailyPlan.ts (search for `DailyStepStatus`)
```

- [ ] **Step 2: Write/extend the test**

```tsx
// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, rerender as _rerender } from '@testing-library/react'
import DailyStepList from '../DailyStepList'
import type { DailyStep } from '@/lib/practice/types'

const playUiCue = vi.fn()
vi.mock('@/lib/ui-sounds/cues', () => ({
  playUiCue: (...args: unknown[]) => playUiCue(...args),
}))

const baseStep: DailyStep = {
  id: 'step-1',
  kind: 'exercise',
  title: 'Practice greetings',
  estMinutes: 5,
  exercises: [{ id: 'ex-1' }],
} as unknown as DailyStep

beforeEach(() => {
  playUiCue.mockClear()
})

describe('DailyStepList step-complete tick', () => {
  it('applies success-pulse and plays the toggle cue when a step transitions to done', () => {
    const { rerender } = render(
      <DailyStepList
        steps={[baseStep]}
        getStepStatus={() => 'pending'}
        onStartStep={vi.fn()}
      />,
    )

    expect(screen.queryByText('Hecho')).not.toBeInTheDocument()

    rerender(
      <DailyStepList
        steps={[baseStep]}
        getStepStatus={() => 'done'}
        onStartStep={vi.fn()}
      />,
    )

    const badge = screen.getByText('Hecho').closest('span')
    expect(badge?.classList.contains('success-pulse')).toBe(true)
    expect(playUiCue).toHaveBeenCalledWith('toggle')
  })

  it('does not play the toggle cue on initial mount already-done steps', () => {
    render(
      <DailyStepList
        steps={[baseStep]}
        getStepStatus={() => 'done'}
        onStartStep={vi.fn()}
      />,
    )

    expect(playUiCue).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test components/daily/__tests__/DailyStepList.test.tsx`
Expected: FAIL — no `success-pulse` class, `playUiCue` never called

- [ ] **Step 4: Add a per-step done-transition tracker + wire the cue**

In `components/daily/DailyStepList.tsx`, add imports after line 9 (`import { cn } from '@/lib/cn'`):

```ts
import { useRef } from 'react'
import { playUiCue } from '@/lib/ui-sounds/cues'
```

Note `useEffect, useState` are already imported on line 3 — merge `useRef` into that same import instead of a separate line:

```ts
import { useEffect, useRef, useState } from 'react'
```

Inside the component, after the `showAllCompact` useState (line 55), add a ref that tracks which step IDs were already seen as done, so the pulse/cue only fires on the transition into `done`, never on initial mount or re-renders of an already-done step:

```ts
  const seenDoneIds = useRef<Set<string>>(new Set())
```

After the `threadHints`/`activeId` setup and before the `return` (i.e. right after the `isHiddenRow` function, around line 87), compute newly-done steps and fire the cue as a side effect. Add:

```ts
  const currentDoneIds = new Set(
    steps
      .filter((s) => {
        const st = getStepStatus(s.id)
        return st === 'done' || st === 'resolved'
      })
      .map((s) => s.id),
  )
  const newlyDoneIds = [...currentDoneIds].filter((id) => !seenDoneIds.current.has(id))

  useEffect(() => {
    if (newlyDoneIds.length > 0) {
      playUiCue('toggle')
    }
    seenDoneIds.current = currentDoneIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, getStepStatus])
```

(The `eslint-disable` matches this file's existing pattern of effect deps intentionally scoped to `[inProgressStepId, steps]` on line 59 — `currentDoneIds`/`newlyDoneIds` are derived every render and don't need to be in the dep array.)

In the render loop, the badge needs to know if *this specific step* just transitioned, so add inside the `.map((step, i) => { ... })` callback, right after `const done = visual === 'done'` (line 100):

```ts
          const justCompleted = done && newlyDoneIds.includes(step.id)
```

Update the "Hecho" badge span (lines 179-183, the non-compact one) to add `success-pulse` conditionally:

```tsx
              {done ? (
                <span
                  className={cn(
                    "animate-state-in inline-flex shrink-0 items-center gap-1 rounded-md bg-accent-2-soft px-2.5 py-1 font-caption font-semibold text-accent-2",
                    justCompleted && "success-pulse",
                  )}
                >
                  <Check size={16} aria-hidden />
                  Hecho
                </span>
              ) : visual === 'entry' ? (
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test components/daily/__tests__/DailyStepList.test.tsx`
Expected: PASS

- [ ] **Step 6: Run the full existing test suite for this component's directory to check nothing broke**

Run: `pnpm test components/daily`
Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add components/daily/DailyStepList.tsx components/daily/__tests__/DailyStepList.test.tsx
git commit -m "feat(daily): pulse + sound the Hecho badge on step completion

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Streak increment — `StreakChip`

**Files:**
- Modify: `components/home/StreakChip.tsx`
- Test: `components/home/__tests__/StreakChip.test.tsx` (create if it doesn't exist; check first)

- [ ] **Step 1: Check for an existing test file**

Run: `ls components/home/__tests__/StreakChip.test.tsx`

If it exists, read it fully first and extend it. Otherwise create fresh with Step 2's full file.

- [ ] **Step 2: Write/extend the test**

```tsx
// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StreakChip from '../StreakChip'

const playUiCue = vi.fn()
vi.mock('@/lib/ui-sounds/cues', () => ({
  playUiCue: (...args: unknown[]) => playUiCue(...args),
}))

beforeEach(() => {
  playUiCue.mockClear()
})

describe('StreakChip', () => {
  it('does not animate or play a cue on first mount', () => {
    render(<StreakChip days={3} />)
    const count = screen.getByText('3 días')
    expect(count.classList.contains('animate-notification-bounce')).toBe(false)
    expect(playUiCue).not.toHaveBeenCalled()
  })

  it('animates and plays the streak cue when days increases', () => {
    const { rerender } = render(<StreakChip days={3} />)
    rerender(<StreakChip days={4} />)

    const count = screen.getByText('4 días')
    expect(count.classList.contains('animate-notification-bounce')).toBe(true)
    expect(playUiCue).toHaveBeenCalledWith('streak')
  })

  it('does not animate when days decreases', () => {
    const { rerender } = render(<StreakChip days={5} />)
    rerender(<StreakChip days={1} />)

    const count = screen.getByText('1 día')
    expect(count.classList.contains('animate-notification-bounce')).toBe(false)
    expect(playUiCue).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test components/home/__tests__/StreakChip.test.tsx`
Expected: FAIL — no animation class, `playUiCue` never called

- [ ] **Step 4: Wire `useRetriggerOnIncrease` + `playUiCue` into `StreakChip`**

Replace the full contents of `components/home/StreakChip.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Flame } from "@/components/icons";
import { useRetriggerOnIncrease } from "@/hooks/useRetrigger";
import { playUiCue } from "@/lib/ui-sounds/cues";

interface StreakChipProps {
  days: number;
}

/** Amber streak chip — flame icon + day count, shown beside the home title. */
export default function StreakChip({ days }: StreakChipProps) {
  const countRef = useRetriggerOnIncrease<HTMLSpanElement>(days, "animate-notification-bounce");
  const prevDays = useRef<number | null>(null);

  useEffect(() => {
    const previous = prevDays.current;
    prevDays.current = days;
    if (previous !== null && days > previous) {
      playUiCue("streak");
    }
  }, [days]);

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-racha-soft px-2.5 py-1 text-tiny text-racha">
      <Flame size={14} aria-hidden />
      <span ref={countRef} className="font-medium tabular-nums">
        {days} {days === 1 ? "día" : "días"}
      </span>
    </span>
  );
}
```

Note: this duplicates the "previous value" tracking that `useRetriggerOnIncrease` already does internally (once for the DOM class, once here for the cue side effect) — that's intentional and kept minimal since the hook doesn't expose "did it just increase" as a return value, only performs the DOM mutation. Both trackers are driven by the same `days` prop so they always agree.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test components/home/__tests__/StreakChip.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/home/StreakChip.tsx components/home/__tests__/StreakChip.test.tsx
git commit -m "feat(home): bump animation + sound cue when streak increases

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all tests PASS, including the 4 new/extended test files from Tasks 3-8.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: no errors (checks the `react-hooks/exhaustive-deps` disable comment in Task 7 doesn't trip a stricter rule; if it does, replace the disable comment with an inline justification per the project's existing lint config).

- [ ] **Step 4: Production build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 5: Manual smoke check (reduced motion)**

No automated step — note for the human reviewer: toggle OS-level "reduce motion" and confirm `.animate-heart-pop` no longer plays (this is covered by the existing global CSS rule verified in Task 2, but worth a manual check since jsdom doesn't evaluate `@media` blocks).

- [ ] **Step 6: Final commit if any lint/build fixes were needed**

```bash
git add -A
git commit -m "chore: fix lint/build issues from microinteractions verification pass

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(Skip this commit if Steps 1-4 passed clean with no changes.)
