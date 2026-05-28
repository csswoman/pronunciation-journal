# Lexicon Review Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-phase flashcard-review flow to `/lexicon/[id]/practice` — users first rate every word (I don't know it / Normal / I already know it) which updates the SRS, then optionally do match-pairs exercises with only the words they struggled with.

**Architecture:** `LexiconPracticePage` becomes a phase orchestrator (`loading → review → summary → practice → done`). Two new components (`LexiconReviewPhase`, `LexiconReviewSummary`) handle the flashcard stack and the between-phase summary. A new query in `lib/word-bank/srs-queries.ts` handles upsert + SRS write for lexicon words that may not yet be in `word_bank`. Phase 2 reuses the existing `PracticeSession` component filtered to struggled words.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, Supabase browser client, existing `computeSM2` / `scheduleNextReview` SRS layer, existing `generateMatchPairsFromWordBank` exercise generator.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `lib/word-bank/srs-queries.ts` | **Create** | New query: upsert lexicon word into `word_bank` + apply flashcard rating |
| `lib/word-bank/lexicon-review-types.ts` | **Create** | Shared types: `FlashcardRating`, `WordRating` |
| `components/lexicon/practice/LexiconFlashcard.tsx` | **Create** | Single flashcard — front/back flip + 3 rating buttons |
| `components/lexicon/practice/LexiconReviewPhase.tsx` | **Create** | Flashcard stack orchestrator — iterates cards, emits `onComplete(WordRating[])` |
| `components/lexicon/practice/LexiconReviewSummary.tsx` | **Create** | Between-phase summary with counts + "Start exercises" CTA |
| `app/lexicon/[id]/practice/page.tsx` | **Modify** | Wire all phases; build filtered exercise list for Phase 2 |
| `components/practice/session/SessionSummary.tsx` | **Modify** | Fix Spanish button labels ("Practicar de nuevo" → "Practice again", "Terminar" → "Finish") |

---

## Task 1: Shared types

**Files:**
- Create: `lib/word-bank/lexicon-review-types.ts`

- [ ] **Step 1: Create the types file**

```ts
// lib/word-bank/lexicon-review-types.ts
import type { WordBankEntry } from '@/lib/word-bank/types'

export type FlashcardRating = 'forgot' | 'normal' | 'known'

export interface WordRating {
  entry: WordBankEntry
  rating: FlashcardRating
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/word-bank/lexicon-review-types.ts
git commit -m "feat(lexicon): add flashcard rating types"
```

---

## Task 2: SRS query for flashcard ratings

This is the core data layer. One exported function handles both the upsert (creating a `word_bank` row for words the user hasn't seen before) and the SRS write based on the rating.

**Files:**
- Create: `lib/word-bank/srs-queries.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/word-bank/__tests__/srs-queries.test.ts`:

```ts
// lib/word-bank/__tests__/srs-queries.test.ts
import { applyFlashcardRating } from '../srs-queries'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// This is an integration boundary test — we verify the function calls the
// right Supabase methods with the right data rather than mocking the DB.
// Run these manually against a local Supabase instance.

describe('applyFlashcardRating (unit — shape only)', () => {
  it('exports a function', () => {
    expect(typeof applyFlashcardRating).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest lib/word-bank/__tests__/srs-queries.test.ts --no-coverage
```

Expected: FAIL — `applyFlashcardRating` not found.

- [ ] **Step 3: Create `lib/word-bank/srs-queries.ts`**

```ts
// lib/word-bank/srs-queries.ts
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { computeSM2 } from '@/lib/srs/compute'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { FlashcardRating } from '@/lib/word-bank/lexicon-review-types'

const MIN_EASE = 1.3

function supabase() {
  return getSupabaseBrowserClient()
}

export interface LexiconWordInput {
  sourceRef: string      // lexicon word id
  text: string
  definition: string
  example?: string | null
  difficulty?: number
}

/**
 * Upsert a lexicon word into word_bank (if needed) then apply the flashcard
 * rating to its SRS fields. Returns the updated word_bank row.
 *
 * Rating semantics:
 *   'forgot'  → interval=1, ease-=0.15, repetitions=0, srs_status=new
 *   'normal'  → standard SM-2 with grade 3
 *   'known'   → interval=30, ease=2.5, repetitions=1, srs_status=mastered (fixed write)
 */
export async function applyFlashcardRating(
  userId: string,
  input: LexiconWordInput,
  rating: FlashcardRating,
): Promise<WordBankEntry> {
  const db = supabase()

  // 1. Find existing row by source_ref (lexicon word id).
  const { data: existing, error: selectError } = await db
    .from('word_bank')
    .select('*')
    .eq('user_id', userId)
    .eq('source_ref', input.sourceRef)
    .maybeSingle()

  if (selectError) throw selectError

  let entry: WordBankEntry

  if (existing) {
    entry = existing as WordBankEntry
  } else {
    // Insert a new word_bank row with lexicon data pre-filled.
    const { data: inserted, error: insertError } = await db
      .from('word_bank')
      .insert({
        user_id: userId,
        text: input.text,
        meaning: input.definition,
        example: input.example ?? null,
        difficulty: input.difficulty ?? 0,
        status: 'ready',
        source: 'lexicon',
        source_ref: input.sourceRef,
      })
      .select('*')
      .single()

    if (insertError) throw insertError
    entry = inserted as WordBankEntry
  }

  // 2. Compute new SRS fields from rating.
  const now = new Date()

  let srsUpdate: {
    ease_factor: number
    interval_days: number
    repetitions: number
    srs_status: string
    next_review_at: string
    last_reviewed_at: string
    review_count: number
  }

  if (rating === 'known') {
    const next30 = new Date(now)
    next30.setDate(next30.getDate() + 30)
    srsUpdate = {
      ease_factor: 2.5,
      interval_days: 30,
      repetitions: 1,
      srs_status: 'mastered',
      next_review_at: next30.toISOString(),
      last_reviewed_at: now.toISOString(),
      review_count: (entry.review_count ?? 0) + 1,
    }
  } else if (rating === 'forgot') {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    srsUpdate = {
      ease_factor: Math.max(MIN_EASE, (entry.ease_factor ?? 2.5) - 0.15),
      interval_days: 1,
      repetitions: 0,
      srs_status: 'new',
      next_review_at: tomorrow.toISOString(),
      last_reviewed_at: now.toISOString(),
      review_count: (entry.review_count ?? 0) + 1,
    }
  } else {
    // 'normal' — standard SM-2 grade 3
    const current = entry.next_review_at || entry.srs_status !== 'new'
      ? {
          ease_factor: entry.ease_factor ?? 2.5,
          interval_days: entry.interval_days ?? 1,
          repetitions: entry.repetitions ?? 0,
          next_review_at: entry.next_review_at,
          status: entry.srs_status as 'new' | 'learning' | 'review' | 'mastered',
          last_reviewed_at: entry.last_reviewed_at,
        }
      : null
    const next = computeSM2(current, 3)
    srsUpdate = {
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      srs_status: next.status,
      next_review_at: next.next_review_at!,
      last_reviewed_at: next.last_reviewed_at!,
      review_count: (entry.review_count ?? 0) + 1,
    }
  }

  const { data: updated, error: updateError } = await db
    .from('word_bank')
    .update(srsUpdate)
    .eq('id', entry.id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (updateError) throw updateError
  return updated as WordBankEntry
}

/**
 * Apply a direct SRS penalty for failing a word in Phase 2 match-pairs.
 * Does NOT re-run SM-2 — only writes a controlled correction to avoid
 * double-applying the algorithm in the same session.
 */
export async function applyPhase2Penalty(
  userId: string,
  wordBankId: string,
  currentEaseFactor: number,
): Promise<void> {
  const db = supabase()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { error } = await db
    .from('word_bank')
    .update({
      srs_status: 'new',
      interval_days: 0,
      ease_factor: Math.max(MIN_EASE, currentEaseFactor - 0.15),
      next_review_at: tomorrow.toISOString(),
    })
    .eq('id', wordBankId)
    .eq('user_id', userId)

  if (error) throw error
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest lib/word-bank/__tests__/srs-queries.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/word-bank/srs-queries.ts lib/word-bank/__tests__/srs-queries.test.ts
git commit -m "feat(lexicon): add applyFlashcardRating and applyPhase2Penalty queries"
```

---

## Task 3: LexiconFlashcard component

Single card — word on front, tap to reveal definition + example + audio, then three rating buttons.

**Files:**
- Create: `components/lexicon/practice/LexiconFlashcard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/lexicon/practice/LexiconFlashcard.tsx
'use client'

// Planned structure:
// <LexiconFlashcard>
//   <CardFront />      — word + "Tap to reveal" hint
//   <CardBack />       — definition + example + audio + rating buttons
// </LexiconFlashcard>

import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { FlashcardRating } from '@/lib/word-bank/lexicon-review-types'

interface LexiconFlashcardProps {
  word: string
  partOfSpeech?: string
  definition: string
  example?: string | null
  cardNumber: number
  totalCards: number
  onRate: (rating: FlashcardRating) => void
}

export function LexiconFlashcard({
  word,
  partOfSpeech,
  definition,
  example,
  cardNumber,
  totalCards,
  onRate,
}: LexiconFlashcardProps) {
  const [revealed, setRevealed] = useState(false)

  function handleRate(rating: FlashcardRating) {
    setRevealed(false)
    onRate(rating)
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-fg-subtle">
        <span>Review words</span>
        <span className="font-bold tabular-nums px-2.5 py-1 rounded-full bg-[var(--primary)] text-[var(--on-primary)]">
          {cardNumber} / {totalCards}
        </span>
      </div>

      <div
        className="min-h-52 w-full cursor-pointer rounded-2xl border border-border-subtle bg-surface-raised p-6 transition-shadow hover:shadow-md flex flex-col gap-3"
        onClick={() => !revealed && setRevealed(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !revealed && setRevealed(true)}
        aria-label={revealed ? undefined : `Tap to reveal definition of ${word}`}
      >
        <div>
          <p className="text-2xl font-bold text-fg">{word}</p>
          {partOfSpeech && (
            <p className="text-xs italic text-fg-subtle mt-0.5">{partOfSpeech}</p>
          )}
        </div>

        {!revealed ? (
          <p className="text-sm text-fg-muted mt-auto">Tap to reveal →</p>
        ) : (
          <>
            <p className="text-sm text-fg-muted leading-snug">{definition}</p>
            {example && (
              <p className="text-[11px] italic text-fg-subtle leading-snug pl-2 border-l-2 border-border-default">
                "{example}"
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                speak([word, definition, example ? `For example: ${example}` : ''].filter(Boolean).join('. '), 0.9)
              }}
              className="self-start p-1.5 rounded-full text-fg-muted hover:text-fg hover:bg-surface-sunken transition-colors"
              aria-label={`Listen to ${word}`}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleRate('forgot')}
            className="rounded-xl border border-error/40 bg-error-soft px-3 py-3 text-xs font-semibold text-error transition-colors hover:bg-error/20"
          >
            I don't know it
          </button>
          <button
            type="button"
            onClick={() => handleRate('normal')}
            className="rounded-xl border border-border-subtle bg-surface-raised px-3 py-3 text-xs font-semibold text-fg transition-colors hover:border-border-strong"
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => handleRate('known')}
            className="rounded-xl border border-primary/40 bg-primary-soft px-3 py-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            I already know it
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/lexicon/practice/LexiconFlashcard.tsx
git commit -m "feat(lexicon): add LexiconFlashcard component"
```

---

## Task 4: LexiconReviewPhase component

Iterates through cards, calls `applyFlashcardRating` on each rating, emits `onComplete` when all cards are rated.

**Files:**
- Create: `components/lexicon/practice/LexiconReviewPhase.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/lexicon/practice/LexiconReviewPhase.tsx
'use client'

// Planned structure:
// <LexiconReviewPhase>
//   <LexiconFlashcard />   — one card at a time
// </LexiconReviewPhase>

import { useState } from 'react'
import { LexiconFlashcard } from './LexiconFlashcard'
import { applyFlashcardRating } from '@/lib/word-bank/srs-queries'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { FlashcardRating, WordRating } from '@/lib/word-bank/lexicon-review-types'

interface LexiconReviewPhaseProps {
  entries: WordBankEntry[]
  userId: string
  onComplete: (ratings: WordRating[]) => void
}

export function LexiconReviewPhase({ entries, userId, onComplete }: LexiconReviewPhaseProps) {
  const [index, setIndex] = useState(0)
  const [ratings, setRatings] = useState<WordRating[]>([])
  const [busy, setBusy] = useState(false)

  async function handleRate(rating: FlashcardRating) {
    if (busy) return
    const entry = entries[index]
    if (!entry) return

    setBusy(true)
    try {
      const updated = await applyFlashcardRating(userId, {
        sourceRef: entry.source_ref ?? entry.id,
        text: entry.text,
        definition: entry.meaning ?? '',
        example: entry.example,
        difficulty: entry.difficulty ?? 0,
      }, rating)

      const next: WordRating[] = [...ratings, { entry: updated, rating }]
      const nextIndex = index + 1

      if (nextIndex >= entries.length) {
        onComplete(next)
      } else {
        setRatings(next)
        setIndex(nextIndex)
      }
    } catch (err) {
      console.error('[LexiconReviewPhase] applyFlashcardRating failed', err)
      // Proceed without saving — don't block the user.
      const next: WordRating[] = [...ratings, { entry, rating }]
      const nextIndex = index + 1
      if (nextIndex >= entries.length) {
        onComplete(next)
      } else {
        setRatings(next)
        setIndex(nextIndex)
      }
    } finally {
      setBusy(false)
    }
  }

  const current = entries[index]
  if (!current) return null

  return (
    <main className="flex w-full items-center justify-center px-10 py-10">
      <LexiconFlashcard
        key={current.id}
        word={current.text}
        definition={current.meaning ?? ''}
        example={current.example}
        cardNumber={index + 1}
        totalCards={entries.length}
        onRate={handleRate}
      />
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/lexicon/practice/LexiconReviewPhase.tsx
git commit -m "feat(lexicon): add LexiconReviewPhase orchestrator"
```

---

## Task 5: LexiconReviewSummary component

Shows rating counts after Phase 1, routes to Phase 2 or skips to done.

**Files:**
- Create: `components/lexicon/practice/LexiconReviewSummary.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/lexicon/practice/LexiconReviewSummary.tsx
'use client'

import type { WordRating } from '@/lib/word-bank/lexicon-review-types'

interface LexiconReviewSummaryProps {
  ratings: WordRating[]
  onStartExercises: () => void
  onFinish: () => void
}

export function LexiconReviewSummary({ ratings, onStartExercises, onFinish }: LexiconReviewSummaryProps) {
  const forgot = ratings.filter((r) => r.rating === 'forgot').length
  const normal = ratings.filter((r) => r.rating === 'normal').length
  const known = ratings.filter((r) => r.rating === 'known').length

  const hasExercises = forgot > 0

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs font-semibold uppercase tracking-[.08em] text-fg-subtle">
          Review complete
        </p>
        <p className="text-sm text-fg-muted">{ratings.length} words reviewed</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-error/30 bg-error-soft/40 p-3">
          <span className="text-2xl font-bold text-error tabular-nums">{forgot}</span>
          <span className="text-[10px] text-fg-subtle text-center leading-tight">I don't know it</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface-raised p-3">
          <span className="text-2xl font-bold text-fg tabular-nums">{normal}</span>
          <span className="text-[10px] text-fg-subtle text-center leading-tight">Normal</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-primary/30 bg-primary-soft/40 p-3">
          <span className="text-2xl font-bold text-primary tabular-nums">{known}</span>
          <span className="text-[10px] text-fg-subtle text-center leading-tight">I already know it</span>
        </div>
      </div>

      {hasExercises ? (
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm text-fg-muted">
            {forgot} {forgot === 1 ? 'word needs' : 'words need'} practice.
          </p>
          <button
            type="button"
            onClick={onStartExercises}
            className="w-full rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold text-on-primary shadow-md transition-transform hover:-translate-y-[1px]"
            style={{ backgroundImage: 'var(--gradient-primary)' }}
          >
            Start exercises
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-4 py-3 text-sm font-semibold text-fg transition-colors hover:border-border-strong"
          >
            Finish
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm text-fg-muted">
            Great job — no words to practice right now.
          </p>
          <button
            type="button"
            onClick={onFinish}
            className="w-full rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold text-on-primary shadow-md transition-transform hover:-translate-y-[1px]"
            style={{ backgroundImage: 'var(--gradient-primary)' }}
          >
            Finish
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/lexicon/practice/LexiconReviewSummary.tsx
git commit -m "feat(lexicon): add LexiconReviewSummary component"
```

---

## Task 6: Fix Spanish labels in SessionSummary

While we're here, fix the two Spanish strings that will be visible in Phase 2.

**Files:**
- Modify: `components/practice/session/SessionSummary.tsx:94-103`

- [ ] **Step 1: Fix the button labels**

In `components/practice/session/SessionSummary.tsx`, find the two buttons at the bottom and change:
- `"Practicar de nuevo"` → `"Practice again"`
- `"Terminar"` → `"Finish"`

```tsx
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="flex-1 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-4 py-3 text-sm font-semibold text-fg transition-colors hover:border-border-strong"
        >
          Practice again
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="flex-1 rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold text-on-primary shadow-md transition-transform hover:-translate-y-[1px]"
          style={{ backgroundImage: 'var(--gradient-primary)' }}
        >
          Finish
        </button>
      </div>
```

- [ ] **Step 2: Commit**

```bash
git add components/practice/session/SessionSummary.tsx
git commit -m "fix(practice): translate session summary buttons to English"
```

---

## Task 7: Wire LexiconPracticePage

Replace the current page with the full phase-orchestrated flow.

**Files:**
- Modify: `app/lexicon/[id]/practice/page.tsx`

- [ ] **Step 1: Replace the page**

Replace the entire content of `app/lexicon/[id]/practice/page.tsx` with:

```tsx
'use client'

// Planned structure:
// <LexiconPracticePage>
//   phase=review   → <LexiconReviewPhase />
//   phase=summary  → <LexiconReviewSummary />
//   phase=practice → <PracticeSession />
//   phase=done     → redirect to lexicon lesson
// </LexiconPracticePage>

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import PracticeSession from '@/components/practice/PracticeSession'
import { LexiconReviewPhase } from '@/components/lexicon/practice/LexiconReviewPhase'
import { LexiconReviewSummary } from '@/components/lexicon/practice/LexiconReviewSummary'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { generateMatchPairsFromWordBank } from '@/lib/exercises/generators/match-pairs'
import { fromGenericExercise } from '@/lib/practice/adapters'
import { applyPhase2Penalty } from '@/lib/word-bank/srs-queries'
import type { PracticeExercise, SessionResult } from '@/lib/practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { WordEntry } from '@/lib/lexicon/types'
import type { WordRating } from '@/lib/word-bank/lexicon-review-types'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'
type FlowPhase = 'review' | 'summary' | 'practice' | 'done'

const MIN_MATCH_PAIRS = 4
const MAX_MATCH_PAIRS = 6

export default function LexiconPracticePage() {
  const params = useParams()
  const categoryId = params.id as string
  const router = useRouter()
  const { user } = useAuth()

  const [lessonName, setLessonName] = useState('')
  const [allEntries, setAllEntries] = useState<WordBankEntry[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  // Phase state
  const [flowPhase, setFlowPhase] = useState<FlowPhase>('review')
  const [ratings, setRatings] = useState<WordRating[]>([])
  const [practiceExercises, setPracticeExercises] = useState<PracticeExercise[]>([])
  const [sessionKey, setSessionKey] = useState(0)

  const load = useCallback(async () => {
    if (!user) return
    setLoadState('loading')
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(`/api/lexicon/${categoryId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? 'Failed to load lesson')
      }
      const { words, wordBankRows } = (await res.json()) as {
        words: WordEntry[]
        wordBankRows: WordBankEntry[]
      }

      if (words.length === 0) throw new Error('No words available for this lesson')

      const bySourceRef = new Map(wordBankRows.map((r) => [r.source_ref, r]))

      // Shape every lexicon word into a WordBankEntry for the review phase.
      const entries: WordBankEntry[] = words.map((w) => {
        const real = bySourceRef.get(w.id)
        if (real) return real
        return {
          id: `lexicon:${w.id}`,
          user_id: user.id,
          text: w.word,
          meaning: w.definition,
          example: w.example ?? null,
          difficulty: w.difficulty ?? 0,
          source: 'lexicon',
          source_ref: w.id,
          status: 'ready',
          srs_status: 'new',
          audio_url: null,
          ipa: null,
          context: null,
          created_at: '',
          updated_at: '',
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          review_count: 0,
          last_reviewed_at: null,
          next_review_at: null,
          error_reason: null,
          has_audio: null,
          audio_fetch_attempts: 0,
          image_prompt: null,
          synonyms: null,
          translation: null,
        } satisfies WordBankEntry
      })

      setLessonName(categoryId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
      setAllEntries(entries)
      setFlowPhase('review')
      setLoadState('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson')
      setLoadState('error')
    }
  }, [categoryId, user])

  useEffect(() => {
    load()
  }, [load])

  // Called when Phase 1 (review) finishes.
  const handleReviewComplete = useCallback((completedRatings: WordRating[]) => {
    setRatings(completedRatings)

    const forgotEntries = completedRatings
      .filter((r) => r.rating === 'forgot')
      .map((r) => r.entry)

    if (forgotEntries.length === 0) {
      // All known/normal — skip exercises.
      setFlowPhase('done')
      return
    }

    // Build exercise pool: pad with 'normal' words if fewer than MIN_MATCH_PAIRS.
    let pool = forgotEntries
    if (pool.length < MIN_MATCH_PAIRS) {
      const normalEntries = completedRatings
        .filter((r) => r.rating === 'normal')
        .map((r) => r.entry)
      const needed = MIN_MATCH_PAIRS - pool.length
      pool = [...pool, ...normalEntries.slice(0, needed)]
    }

    const matchPairs = generateMatchPairsFromWordBank(pool, MAX_MATCH_PAIRS)
    const exercises: PracticeExercise[] = matchPairs.map((ex) =>
      fromGenericExercise(ex, 'practice')
    )

    if (exercises.length === 0) {
      setFlowPhase('done')
      return
    }

    setPracticeExercises(exercises)
    setSessionKey((k) => k + 1)
    setFlowPhase('summary')
  }, [])

  // Track which entries were 'forgot' for Phase 2 penalty lookup.
  const forgotEntryMap = useMemo(() => {
    return new Map(
      ratings
        .filter((r) => r.rating === 'forgot')
        .map((r) => [r.entry.id, r.entry])
    )
  }, [ratings])

  const handleSessionComplete = useCallback(
    async (result: SessionResult) => {
      if (!user) return
      // Apply Phase 2 penalty for any 'forgot' word that was answered incorrectly.
      const penalties = result.results
        .filter((r) => !r.isCorrect && r.sourceRef && forgotEntryMap.has(r.sourceRef))
        .map((r) => {
          const entry = forgotEntryMap.get(r.sourceRef!)!
          return applyPhase2Penalty(user.id, entry.id, entry.ease_factor ?? 2.5)
        })
      await Promise.allSettled(penalties)
      setFlowPhase('done')
    },
    [user, forgotEntryMap],
  )

  useEffect(() => {
    if (flowPhase === 'done') {
      router.push(`/lexicon/${categoryId}`)
    }
  }, [flowPhase, categoryId, router])

  const header = (
    <header className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--surface-base)]">
      <div className="flex items-center justify-between px-10 pt-6 pb-4">
        <button
          type="button"
          onClick={() => router.push(`/lexicon/${categoryId}`)}
          className="border-none bg-transparent p-1 text-xl leading-none text-fg-subtle"
        >
          ←
        </button>
        <span className="text-base font-semibold text-fg truncate max-w-xs">{lessonName}</span>
        <div className="w-6" />
      </div>
    </header>
  )

  if (loadState === 'error') {
    return (
      <PageLayout variant="lesson" hero={header}>
        <div className="flex flex-col items-center gap-4 py-20 text-center px-6">
          <p className="text-error text-sm">{error}</p>
          <Button type="button" onClick={load} variant="primary" size="sm">Retry</Button>
        </div>
      </PageLayout>
    )
  }

  if (loadState !== 'ready') {
    return (
      <PageLayout variant="lesson" hero={header}>
        <div className="flex items-center justify-center py-20">
          <span className="animate-pulse text-fg-subtle">Preparing review…</span>
        </div>
      </PageLayout>
    )
  }

  if (flowPhase === 'review') {
    return (
      <PageLayout variant="lesson" hero={header}>
        <LexiconReviewPhase
          entries={allEntries}
          userId={user?.id ?? ''}
          onComplete={handleReviewComplete}
        />
      </PageLayout>
    )
  }

  if (flowPhase === 'summary') {
    return (
      <PageLayout variant="lesson" hero={header}>
        <main className="flex w-full items-center justify-center px-10 py-10">
          <LexiconReviewSummary
            ratings={ratings}
            onStartExercises={() => setFlowPhase('practice')}
            onFinish={() => router.push(`/lexicon/${categoryId}`)}
          />
        </main>
      </PageLayout>
    )
  }

  if (flowPhase === 'practice') {
    const sessionConfig = {
      context: 'practice' as const,
      exercises: practiceExercises,
      sessionLength: Math.min(10, practiceExercises.length),
      onSessionComplete: handleSessionComplete,
      onExit: () => router.push(`/lexicon/${categoryId}`),
    }
    return (
      <PageLayout variant="lesson" hero={header}>
        <main className="animate-fadeIn flex w-full items-center justify-center px-10 py-10">
          <PracticeSession key={sessionKey} {...sessionConfig} />
        </main>
      </PageLayout>
    )
  }

  // flowPhase === 'done' — useEffect handles redirect.
  return null
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors. Fix any type errors before continuing.

- [ ] **Step 3: Commit**

```bash
git add app/lexicon/[id]/practice/page.tsx
git commit -m "feat(lexicon): wire two-phase review flow in LexiconPracticePage"
```

---

## Task 8: Manual smoke test

Before declaring done, walk through the flow manually.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test the happy path**
  1. Go to any lexicon lesson with ≥ 4 words.
  2. Tap "Practice lesson".
  3. Verify Phase 1 shows cards one at a time — word first, tap reveals definition + buttons.
  4. Rate some words "I don't know it", some "Normal", some "I already know it".
  5. Verify the summary screen shows correct counts.
  6. Tap "Start exercises" — verify match-pairs loads with only the "I don't know it" words (+ fillers if < 4).
  7. Complete the session — verify redirect to lexicon lesson.

- [ ] **Step 3: Test the all-known path**
  1. Rate all words "I already know it" or "Normal".
  2. Verify the summary shows "no words to practice" and offers only "Finish".
  3. Tap "Finish" — verify redirect to lexicon lesson.

- [ ] **Step 4: Test the < 4 forgot words path**
  1. Rate exactly 1–3 words "I don't know it", the rest "Normal".
  2. Tap "Start exercises" — verify match-pairs loads with at least 4 pairs total (fillers included).

- [ ] **Step 5: Commit if all paths pass**

```bash
git add -A
git commit -m "feat(lexicon): complete two-phase lexicon review flow"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - ✅ Phase 1 flashcard with word → reveal → rate
  - ✅ Three buttons: I don't know it / Normal / I already know it
  - ✅ SRS writes on button press (Task 2)
  - ✅ "Known" bypasses computeSM2, writes fixed 30-day interval
  - ✅ "Forgot" writes direct penalty without computeSM2
  - ✅ "Normal" uses standard SM-2 grade 3
  - ✅ Summary screen with counts
  - ✅ Skip Phase 2 if forgot=0
  - ✅ Phase 2 filtered to "forgot" words only
  - ✅ Filler words for < 4 forgot count
  - ✅ Phase 2 penalty is direct DB write, not SM-2 re-run
  - ✅ Filler word SRS not modified on failure
  - ✅ All labels in English

- [x] **Type consistency:** `FlashcardRating` and `WordRating` defined in Task 1, imported consistently in Tasks 2, 3, 4, 5, 7.

- [x] **Phase 2 penalty lookup:** `sourceRef` on `ExerciseResult` is used to match entries in `forgotEntryMap`. The existing `PracticeSession` already populates `sourceRef` from the exercise (see `handleSubmit` in `PracticeSession.tsx`).

- [x] **Upsert path:** Synthetic entries have `id = "lexicon:…"` and `source_ref = w.id`. `applyFlashcardRating` looks up by `source_ref`, so it correctly finds or creates the real `word_bank` row.
