# Session Loading Animation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static spinner in `SessionLoadingShell` with an animated word carousel that cycles through 10 user words (with IPA) using the app's accent color, falling back to a curated set if the user has no words yet.

**Architecture:** A new `useLoadingWords` hook fetches from `getMyWords()`, shuffles, and returns 10 `LoadingWord` items. A new `WordCarousel` component receives those items and owns the cycling animation entirely. `SessionLoadingShell` composes both. No logic leaks between layers.

**Tech Stack:** React 19, Tailwind v4, Vitest, Supabase (via existing `getMyWords()`), CSS custom properties (`var(--primary)`)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `hooks/useLoadingWords.ts` | Fetch, shuffle, return 10 `LoadingWord` items |
| Create | `hooks/__tests__/useLoadingWords.test.ts` | Unit tests for the hook |
| Create | `components/practice/session/WordCarousel.tsx` | Animation: cycles word + IPA + progress bar |
| Modify | `components/practice/session/SessionLoadingShell.tsx` | Compose hook + carousel, remove old spinner |

---

## Task 1: Define the `LoadingWord` type and `FALLBACK_WORDS`

**Files:**
- Create: `hooks/useLoadingWords.ts` (skeleton only)

- [ ] **Step 1: Create the file with the type and fallback array**

```ts
// hooks/useLoadingWords.ts
import { useState, useEffect } from 'react'
import { getMyWords } from '@/lib/word-bank/queries'

export type LoadingWord = { text: string; ipa: string | null }

const FALLBACK_WORDS: LoadingWord[] = [
  { text: 'thought',       ipa: '/θɔːt/' },
  { text: 'through',       ipa: '/θruː/' },
  { text: 'though',        ipa: '/ðoʊ/' },
  { text: 'world',         ipa: '/wɜːrld/' },
  { text: 'clothes',       ipa: '/kloʊðz/' },
  { text: 'comfortable',   ipa: '/ˈkʌmftərbəl/' },
  { text: 'rhythm',        ipa: '/ˈrɪðəm/' },
  { text: 'pronunciation', ipa: '/prəˌnʌnsiˈeɪʃən/' },
  { text: 'thoroughly',    ipa: '/ˈθɜːrəli/' },
  { text: 'particularly',  ipa: '/pərˈtɪkjʊlərli/' },
]

// Fisher-Yates in-place shuffle — returns the same array
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function useLoadingWords(): LoadingWord[] {
  const [words, setWords] = useState<LoadingWord[]>(shuffle([...FALLBACK_WORDS]))

  useEffect(() => {
    let cancelled = false

    getMyWords()
      .then(entries => {
        if (cancelled) return
        const ready = entries.filter(e => e.status === 'ready')
        if (ready.length === 0) return // keep fallback
        const picked = shuffle([...ready])
          .slice(0, 10)
          .map(e => ({ text: e.text, ipa: e.ipa ?? null }))
        setWords(picked)
      })
      .catch(() => {
        // network error → keep fallback already set
      })

    return () => { cancelled = true }
  }, [])

  return words
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useLoadingWords.ts
git commit -m "feat(loading): add useLoadingWords hook with fallback word set"
```

---

## Task 2: Test `useLoadingWords`

**Files:**
- Create: `hooks/__tests__/useLoadingWords.test.ts`

- [ ] **Step 1: Write the test file**

```ts
// hooks/__tests__/useLoadingWords.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLoadingWords } from '../useLoadingWords'
import * as queries from '@/lib/word-bank/queries'

const makeEntry = (text: string, ipa: string | null, status = 'ready') => ({
  id: text,
  user_id: 'u1',
  text,
  ipa,
  status,
  context: null,
  meaning: null,
  translation: null,
  example: null,
  synonyms: null,
  image_prompt: null,
  audio_url: null,
  difficulty: 1,
  error_reason: null,
  audio_fetch_attempts: 0,
  has_audio: false,
  ease_factor: 2.5,
  interval_days: 1,
  repetitions: 0,
  srs_status: 'new',
  next_review_at: null,
  last_reviewed_at: null,
  review_count: 0,
  source: null,
  source_ref: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

describe('useLoadingWords', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 10 fallback words immediately before fetch resolves', () => {
    vi.spyOn(queries, 'getMyWords').mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useLoadingWords())
    expect(result.current).toHaveLength(10)
  })

  it('switches to user words when fetch returns ready entries', async () => {
    const userWords = Array.from({ length: 15 }, (_, i) =>
      makeEntry(`word${i}`, `/wɜːrd${i}/`)
    )
    vi.spyOn(queries, 'getMyWords').mockResolvedValue(userWords)
    const { result } = renderHook(() => useLoadingWords())
    await waitFor(() => {
      expect(result.current.every(w => w.text.startsWith('word'))).toBe(true)
    })
    expect(result.current).toHaveLength(10)
  })

  it('keeps fallback when all entries have non-ready status', async () => {
    const processing = Array.from({ length: 5 }, (_, i) =>
      makeEntry(`proc${i}`, null, 'processing')
    )
    vi.spyOn(queries, 'getMyWords').mockResolvedValue(processing)
    const { result } = renderHook(() => useLoadingWords())
    await waitFor(() => Promise.resolve()) // let microtasks flush
    expect(result.current.some(w => w.text === 'thought')).toBe(true)
  })

  it('keeps fallback on network error', async () => {
    vi.spyOn(queries, 'getMyWords').mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useLoadingWords())
    await waitFor(() => Promise.resolve())
    expect(result.current).toHaveLength(10)
    expect(result.current.some(w => w.text === 'thought')).toBe(true)
  })

  it('includes ipa field for each word', async () => {
    vi.spyOn(queries, 'getMyWords').mockResolvedValue([])
    const { result } = renderHook(() => useLoadingWords())
    expect(result.current.every(w => 'ipa' in w)).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests and verify they pass**

```bash
npx vitest run hooks/__tests__/useLoadingWords.test.ts
```

Expected: all 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add hooks/__tests__/useLoadingWords.test.ts
git commit -m "test(loading): add useLoadingWords unit tests"
```

---

## Task 3: Build `WordCarousel`

**Files:**
- Create: `components/practice/session/WordCarousel.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/practice/session/WordCarousel.tsx

// Planned structure:
// <WordCarousel>
//   <WordSlot />   (word text + IPA, animated)
//   <ProgressBar />
//   <LoadingLabel />
// </WordCarousel>

'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { LoadingWord } from '@/hooks/useLoadingWords'

interface WordCarouselProps {
  words: LoadingWord[]
}

export function WordCarousel({ words }: WordCarouselProps) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const prefersReduced = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )

  useEffect(() => {
    if (words.length === 0) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % words.length)
        setVisible(true)
      }, 300)
    }, 2200)
    return () => clearInterval(interval)
  }, [words.length])

  const current = words[index]
  if (!current) return null

  return (
    <div className="flex flex-col items-center gap-4 py-12 px-8 w-full max-w-xs mx-auto">
      {/* Word + IPA slot */}
      <div
        className={cn(
          'flex flex-col items-center gap-1 min-h-14 justify-center transition-opacity',
          prefersReduced.current
            ? 'duration-300'
            : 'duration-300',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5',
          !prefersReduced.current && 'transition-[opacity,transform]'
        )}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <span className="font-mono text-xl font-medium text-primary tracking-wide">
          {current.text}
        </span>
        {current.ipa && (
          <span className="font-mono text-sm text-fg-secondary">
            {current.ipa}
          </span>
        )}
      </div>

      {/* Indeterminate progress bar */}
      <div
        className="w-full h-0.5 rounded-full overflow-hidden bg-border-default"
        role="progressbar"
        aria-label="Cargando sesión"
        aria-busy="true"
      >
        <div className="h-full w-2/5 rounded-full bg-primary animate-[loadingSlide_2s_linear_infinite]" />
      </div>

      {/* Label */}
      <span className="text-xs font-medium uppercase tracking-widest text-fg-tertiary">
        Preparando tu sesión
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Add the `loadingSlide` keyframe to `globals.css`**

Open `app/globals.css` and add inside the `@layer utilities` block (or at the end of the file if no such block exists):

```css
@keyframes loadingSlide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
```

- [ ] **Step 3: Commit**

```bash
git add components/practice/session/WordCarousel.tsx app/globals.css
git commit -m "feat(loading): add WordCarousel component with word/IPA cycling animation"
```

---

## Task 4: Refactor `SessionLoadingShell`

**Files:**
- Modify: `components/practice/session/SessionLoadingShell.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
// components/practice/session/SessionLoadingShell.tsx

// Planned structure:
// <SessionLoadingShell>
//   <PhonemeFocusShell>  (when focusUi mode)
//     <WordCarousel />
//   </PhonemeFocusShell>
//   plain wrapper div    (otherwise)
//     <WordCarousel />
// </SessionLoadingShell>

'use client'

import { PhonemeFocusShell } from '@/components/phoneme-practice/PhonemeFocusShell'
import { WordCarousel } from './WordCarousel'
import { useLoadingWords } from '@/hooks/useLoadingWords'

interface SessionLoadingShellProps {
  focusUi: boolean
  displayBadge: string
  onExit: () => void
}

export function SessionLoadingShell({ focusUi, displayBadge, onExit }: SessionLoadingShellProps) {
  const words = useLoadingWords()

  if (focusUi && displayBadge) {
    return (
      <PhonemeFocusShell
        badge={displayBadge}
        progressPct={0}
        onExit={onExit}
      >
        <WordCarousel words={words} />
      </PhonemeFocusShell>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <WordCarousel words={words} />
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors related to the modified files.

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run
```

Expected: all existing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add components/practice/session/SessionLoadingShell.tsx
git commit -m "feat(loading): wire WordCarousel into SessionLoadingShell"
```

---

## Task 5: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Navigate to a practice session**

Open `http://localhost:3000/practice` and start any session. Observe the loading screen before the session loads.

Expected:
- Words cycle every ~2.2s with a smooth fade + subtle vertical slide
- Word text appears in the app's accent color (violet by default)
- IPA appears below in a lighter gray
- Indeterminate bar slides left to right on loop
- Label "Preparando tu sesión" is visible

- [ ] **Step 3: Test with a new user (no words)**

If you have a test account with no words, verify that the fallback words appear (e.g. "thought", "through", etc.) instead of an empty carousel.

- [ ] **Step 4: Verify `prefers-reduced-motion`**

In Chrome DevTools → Rendering → Emulate CSS media feature → `prefers-reduced-motion: reduce`. The word should still change but without the translate animation — only fade.

- [ ] **Step 5: Final commit**

```bash
git add -p  # review any leftover changes
git commit -m "chore(loading): verify session loading animation complete"
```

---

## Self-Review

**Spec coverage:**
- ✅ Word carousel with 10 words cycling — Task 3 + Task 4
- ✅ Words from `getMyWords()` filtered to `status === 'ready'` — Task 1
- ✅ Fallback when empty or error — Task 1 (`catch` + empty check)
- ✅ Shuffle without consecutive repeats — Task 1 (Fisher-Yates on full list, cycle through all 10)
- ✅ IPA null handled gracefully — Task 3 (`{current.ipa && ...}`)
- ✅ Accent color (`var(--primary)`) on word text and progress bar — Task 3
- ✅ `prefers-reduced-motion` — Task 3
- ✅ Tokens only, no hardcoded colors — Task 3
- ✅ No logic in component (`useLoadingWords` owns all data logic) — Task 4
- ✅ Tests for hook — Task 2
- ✅ Both `focusUi` modes preserved — Task 4

**Type consistency:** `LoadingWord` defined in Task 1, imported in Task 3 and Task 4. `words: LoadingWord[]` prop matches hook return type throughout.
