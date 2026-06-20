# Course Mixed Practice + Shared Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sentence-only practice button in grammar deck lessons with a mixed session (lesson fragments + Core 1000 new words + optional phoneme exercises) that writes vocabulary progress to the same SRS entry as Essential Words.

**Architecture:** A new client-side assembler `buildCoursePracticeSession` combines three exercise sources into one `PracticeExercise[]`. A progress dispatcher added to `handleSubmit` in `useSessionState.ts` routes each answer to the correct SRS system based on `sourceRef.source`. The phoneme source is online-only and degrades gracefully when unavailable.

**Tech Stack:** Next.js 15 App Router · Dexie (IndexedDB SRS) · Supabase (phoneme progress) · Vitest · TypeScript

---

## File Map

| Status | Path | Responsibility |
|--------|------|----------------|
| CREATE | `lib/courses/practice/vocab-selector.ts` | Pure function: pick ~3–5 unseen Core 1000 words for a CEFR level |
| CREATE | `lib/courses/practice/vocab-selector.test.ts` | Unit tests for vocab-selector |
| CREATE | `lib/courses/practice/word-exercise-builder.ts` | Generate `GenericExercise[]` from `CoreWord[]` |
| CREATE | `lib/courses/practice/word-exercise-builder.test.ts` | Unit tests for word-exercise-builder |
| CREATE | `lib/courses/practice/build-session.ts` | Assemble all 3 sources into `PracticeExercise[]` |
| CREATE | `lib/courses/practice/build-session.test.ts` | Unit tests for build-session |
| MODIFY | `components/courses/grammar-deck/GrammarStudyDeck.tsx` | Call `buildCoursePracticeSession` instead of only `generateMixedFromFragments` |
| MODIFY | `components/courses/grammar-deck/DeckDoneScreen.tsx` | Hide button when session is empty |
| MODIFY | `components/practice/session/useSessionState.ts` | Add progress dispatcher for `core1k` source in `handleSubmit` |

---

## Task 1: Vocab selector — pure function

**Files:**
- Create: `lib/courses/practice/vocab-selector.ts`
- Create: `lib/courses/practice/vocab-selector.test.ts`

The selector takes a CEFR level + the set of wordIds already in Dexie SRS, filters Core 1000 words to that level and those **without** an existing SRS entry, and returns the first `limit` sorted by `rank`.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/courses/practice/vocab-selector.test.ts
import { describe, it, expect } from 'vitest'
import { selectNewWordsForLevel } from './vocab-selector'
import type { CoreWord } from '@/lib/core-1000/types'

const makeWord = (rank: number, word: string, cefr_level: CoreWord['cefr_level']): CoreWord => ({
  rank,
  word,
  pos: 'noun',
  ipa_strong: '/wɜːd/',
  example_sentence: `Use ${word} in a sentence.`,
  cefr_level,
})

describe('selectNewWordsForLevel', () => {
  const words: CoreWord[] = [
    makeWord(1, 'house', 'A1'),
    makeWord(2, 'water', 'A1'),
    makeWord(3, 'eat', 'A1'),
    makeWord(4, 'run', 'A1'),
    makeWord(5, 'city', 'A2'),
  ]

  it('returns only words matching the CEFR level', () => {
    const result = selectNewWordsForLevel(words, 'A1', new Set(), 5)
    expect(result.every((w) => w.cefr_level === 'A1')).toBe(true)
  })

  it('excludes words already in SRS (seen set)', () => {
    const seen = new Set(['c1k:house', 'c1k:water'])
    const result = selectNewWordsForLevel(words, 'A1', seen, 5)
    expect(result.map((w) => w.word)).toEqual(['eat', 'run'])
  })

  it('respects the limit parameter', () => {
    const result = selectNewWordsForLevel(words, 'A1', new Set(), 2)
    expect(result).toHaveLength(2)
  })

  it('returns words sorted ascending by rank', () => {
    const result = selectNewWordsForLevel(words, 'A1', new Set(), 5)
    const ranks = result.map((w) => w.rank)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it('returns [] when all words of that level are already seen', () => {
    const seen = new Set(['c1k:house', 'c1k:water', 'c1k:eat', 'c1k:run'])
    expect(selectNewWordsForLevel(words, 'A1', seen, 5)).toEqual([])
  })

  it('returns [] when no words match the level', () => {
    expect(selectNewWordsForLevel(words, 'B1', new Set(), 5)).toEqual([])
  })
})
```

- [ ] **Step 2: Run to confirm they fail**

```bash
pnpm test lib/courses/practice/vocab-selector.test.ts
```
Expected: FAIL — `vocab-selector` module not found.

- [ ] **Step 3: Implement the selector**

```typescript
// lib/courses/practice/vocab-selector.ts
import type { CoreWord, CefrLevel } from '@/lib/core-1000/types'
import { core1000WordId } from '@/lib/core-1000/types'

/**
 * Returns up to `limit` Core 1000 words for the given CEFR level that have
 * no existing SRS entry. Only introduces new vocabulary — never due/review words.
 */
export function selectNewWordsForLevel(
  words: CoreWord[],
  level: CefrLevel,
  seenWordIds: Set<string>,
  limit: number,
): CoreWord[] {
  return words
    .filter((w) => w.cefr_level === level && !seenWordIds.has(core1000WordId(w.word)))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
pnpm test lib/courses/practice/vocab-selector.test.ts
```
Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/courses/practice/vocab-selector.ts lib/courses/practice/vocab-selector.test.ts
git commit -m "feat(courses): vocab-selector — pick new Core 1000 words by CEFR level"
```

---

## Task 2: Word exercise builder

**Files:**
- Create: `lib/courses/practice/word-exercise-builder.ts`
- Create: `lib/courses/practice/word-exercise-builder.test.ts`

Converts `CoreWord[]` into `GenericExercise[]`. Each word becomes one `fill_blank` exercise using its `example_sentence`, blanking the target word. Uses the same `blankWord` utility the fragment generator uses. Falls back to `sentence_dictation` when `blankWord` can't find the word in the sentence.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/courses/practice/word-exercise-builder.test.ts
import { describe, it, expect } from 'vitest'
import { buildWordExercises } from './word-exercise-builder'
import type { CoreWord } from '@/lib/core-1000/types'

const word: CoreWord = {
  rank: 1,
  word: 'house',
  pos: 'noun',
  ipa_strong: '/haʊs/',
  example_sentence: 'I live in a house on Maple Street.',
  cefr_level: 'A1',
}

describe('buildWordExercises', () => {
  it('produces one exercise per word', () => {
    expect(buildWordExercises([word])).toHaveLength(1)
  })

  it('produces a fill_blank with sourceRef.source = core1k', () => {
    const [ex] = buildWordExercises([word])
    expect(ex.type).toBe('fill_blank')
    expect(ex.sourceRef.source).toBe('core1k')
  })

  it('sourceRef.id is the c1k: prefixed word id', () => {
    const [ex] = buildWordExercises([word])
    expect(ex.sourceRef.id).toBe('c1k:house')
  })

  it('blanks the target word in the sentence', () => {
    const [ex] = buildWordExercises([word])
    expect(ex.type).toBe('fill_blank')
    if (ex.type === 'fill_blank') {
      expect(ex.sentence).toContain('___')
      expect(ex.answer.toLowerCase()).toBe('house')
    }
  })

  it('provides 4 options including the correct answer', () => {
    const words: CoreWord[] = [
      word,
      { ...word, rank: 2, word: 'water', example_sentence: 'Drink water every day.' },
      { ...word, rank: 3, word: 'eat', example_sentence: 'I eat breakfast at 8.' },
      { ...word, rank: 4, word: 'run', example_sentence: 'She can run fast.' },
    ]
    const [ex] = buildWordExercises(words)
    if (ex.type === 'fill_blank') {
      expect(ex.options).toHaveLength(4)
      expect(ex.options).toContain(ex.answer)
    }
  })

  it('returns [] for empty input', () => {
    expect(buildWordExercises([])).toEqual([])
  })
})
```

- [ ] **Step 2: Run to confirm they fail**

```bash
pnpm test lib/courses/practice/word-exercise-builder.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the builder**

```typescript
// lib/courses/practice/word-exercise-builder.ts
import type { CoreWord } from '@/lib/core-1000/types'
import { core1000WordId } from '@/lib/core-1000/types'
import type { FillBlankExercise, SentenceDictationExercise, GenericExercise } from '@/lib/exercises/types'
import { blankWord, exerciseId, pick, shuffle } from '@/lib/exercises/utils'

const FILL_BLANK_OPTIONS = 4

/**
 * Converts CoreWord[] into GenericExercise[].
 * Each word becomes a fill_blank using its example_sentence.
 * sourceRef.source = 'core1k' so the progress dispatcher can route to gradeCore1000Word.
 */
export function buildWordExercises(words: CoreWord[]): GenericExercise[] {
  if (words.length === 0) return []

  // Pool of distractor words — all target words except self
  const allTargets = words.map((w) => w.word)

  return words.flatMap((word): GenericExercise[] => {
    const wordId = core1000WordId(word.word)
    const blanked = blankWord(word.example_sentence, word.word)

    if (blanked) {
      const distractors = pick(
        allTargets.filter((t) => t.toLowerCase() !== word.word.toLowerCase()),
        FILL_BLANK_OPTIONS - 1,
      )
      // When there aren't enough other words for distractors, skip fill_blank
      if (distractors.length < FILL_BLANK_OPTIONS - 1) {
        return [buildDictation(word, wordId)]
      }
      const ex: FillBlankExercise = {
        id: exerciseId('fill_blank', wordId, word.word),
        type: 'fill_blank',
        exerciseType: { domain: 'vocabulary', mode: 'fill_blank', variant: 'sentence' },
        sourceRef: { source: 'core1k', id: wordId },
        sentence: blanked,
        answer: word.word,
        options: shuffle([word.word, ...distractors]),
        hints: {
          level1: `Empieza con "${word.word.charAt(0).toUpperCase()}"`,
          level2: `La palabra es: ${word.word}`,
        },
      }
      return [ex]
    }

    return [buildDictation(word, wordId)]
  })
}

function buildDictation(word: CoreWord, wordId: string): SentenceDictationExercise {
  return {
    id: exerciseId('sentence_dictation', wordId, word.example_sentence),
    type: 'sentence_dictation',
    exerciseType: { domain: 'vocabulary', mode: 'sentence_dictation' },
    sourceRef: { source: 'core1k', id: wordId },
    sentence: word.example_sentence,
    audioUrl: null,
    targetWord: word.word,
  }
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
pnpm test lib/courses/practice/word-exercise-builder.test.ts
```
Expected: all 6 tests PASS.

- [ ] **Step 5: Type-check**

```bash
pnpm type-check 2>&1 | grep -E "word-exercise-builder|vocab-selector" | head -20
```
Expected: no errors for these files.

- [ ] **Step 6: Commit**

```bash
git add lib/courses/practice/word-exercise-builder.ts lib/courses/practice/word-exercise-builder.test.ts
git commit -m "feat(courses): word-exercise-builder — fill_blank from CoreWord example sentences"
```

---

## Task 3: Session assembler — `buildCoursePracticeSession`

**Files:**
- Create: `lib/courses/practice/build-session.ts`
- Create: `lib/courses/practice/build-session.test.ts`

Async function that gathers all 3 exercise sources, converts them to `PracticeExercise[]`, and interleaves them for variety. Target: 8–10 exercises total. If all sources are empty → returns `[]`.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/courses/practice/build-session.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock async dependencies before importing the module under test
vi.mock('@/lib/exercises/generators/reorder-from-fragments', () => ({
  fetchFragmentsForDeck: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/lib/exercises/generators/mixed-from-fragments', () => ({
  generateMixedFromFragments: vi.fn().mockReturnValue([]),
}))
vi.mock('@/lib/core-1000/client', () => ({
  fetchCoreWords: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/lib/db', () => ({
  getSRSData: vi.fn(),
  getCore1000SrsEntries: vi.fn().mockResolvedValue([]),
}))
vi.mock('./vocab-selector', () => ({
  selectNewWordsForLevel: vi.fn().mockReturnValue([]),
}))
vi.mock('./word-exercise-builder', () => ({
  buildWordExercises: vi.fn().mockReturnValue([]),
}))
vi.mock('@/lib/practice/adapters', () => ({
  fromGenericExercise: vi.fn((ex: unknown) => ({ id: (ex as { id: string }).id, slug: 'fill_blank', exerciseTypeId: 5, contentId: (ex as { id: string }).id, context: 'courses', payload: { kind: 'generic', data: ex }, sourceRef: { source: 'core1k', id: (ex as { id: string }).id } })),
}))

import { buildCoursePracticeSession } from './build-session'
import { fetchFragmentsForDeck } from '@/lib/exercises/generators/reorder-from-fragments'
import { generateMixedFromFragments } from '@/lib/exercises/generators/mixed-from-fragments'
import { fetchCoreWords } from '@/lib/core-1000/client'
import { selectNewWordsForLevel } from './vocab-selector'
import { buildWordExercises } from './word-exercise-builder'

const mockFetchFragments = vi.mocked(fetchFragmentsForDeck)
const mockGenerateMixed = vi.mocked(generateMixedFromFragments)
const mockFetchCore = vi.mocked(fetchCoreWords)
const mockSelectNew = vi.mocked(selectNewWordsForLevel)
const mockBuildWord = vi.mocked(buildWordExercises)

describe('buildCoursePracticeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchFragments.mockResolvedValue([])
    mockGenerateMixed.mockReturnValue([])
    mockFetchCore.mockResolvedValue([])
    mockSelectNew.mockReturnValue([])
    mockBuildWord.mockReturnValue([])
  })

  it('returns [] when all sources are empty', async () => {
    const result = await buildCoursePracticeSession({ deckSlug: 'a1-test', cefrLevel: 'A1' })
    expect(result).toEqual([])
  })

  it('returns exercises from fragments when only fragments are available', async () => {
    const fakeEx = { id: 'ex1', type: 'fill_blank', sourceRef: { source: 'text_fragments', id: 'f1' }, sentence: 'Hello ___', answer: 'world', options: ['world', 'a', 'b', 'c'] }
    mockGenerateMixed.mockReturnValue([fakeEx] as ReturnType<typeof generateMixedFromFragments>)
    const result = await buildCoursePracticeSession({ deckSlug: 'a1-test', cefrLevel: 'A1' })
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes vocab exercises when selectNewWordsForLevel returns words', async () => {
    const fakeWord = { rank: 1, word: 'run', pos: 'verb', ipa_strong: '/rʌn/', example_sentence: 'I run every day.', cefr_level: 'A1' as const }
    const fakeEx = { id: 'ex2', type: 'fill_blank', sourceRef: { source: 'core1k', id: 'c1k:run' }, sentence: 'I ___ every day.', answer: 'run', options: ['run', 'a', 'b', 'c'] }
    mockFetchCore.mockResolvedValue([fakeWord])
    mockSelectNew.mockReturnValue([fakeWord])
    mockBuildWord.mockReturnValue([fakeEx] as ReturnType<typeof buildWordExercises>)
    const result = await buildCoursePracticeSession({ deckSlug: 'a1-test', cefrLevel: 'A1' })
    expect(result.some((r) => r.sourceRef?.source === 'core1k')).toBe(true)
  })

  it('caps output at TARGET_SIZE exercises', async () => {
    const manyEx = Array.from({ length: 20 }, (_, i) => ({
      id: `ex${i}`,
      type: 'fill_blank' as const,
      sourceRef: { source: 'text_fragments' as const, id: `f${i}` },
      sentence: `Sentence ${i} ___.`,
      answer: 'word',
      options: ['word', 'a', 'b', 'c'],
    }))
    mockGenerateMixed.mockReturnValue(manyEx as ReturnType<typeof generateMixedFromFragments>)
    const result = await buildCoursePracticeSession({ deckSlug: 'a1-test', cefrLevel: 'A1' })
    expect(result.length).toBeLessThanOrEqual(10)
  })
})
```

- [ ] **Step 2: Run to confirm they fail**

```bash
pnpm test lib/courses/practice/build-session.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Check how Dexie exposes SRS entries for Core 1000**

```bash
grep -rn "getCore1000SrsEntries\|getSRSData" "d:/proyectos/english-journal/lib/db" --include="*.ts" | head -15
```

Note the exact function name and import path, then use it in the implementation below.

- [ ] **Step 4: Implement `buildCoursePracticeSession`**

```typescript
// lib/courses/practice/build-session.ts
'use client'

import { fetchFragmentsForDeck } from '@/lib/exercises/generators/reorder-from-fragments'
import { generateMixedFromFragments } from '@/lib/exercises/generators/mixed-from-fragments'
import { fetchCoreWords } from '@/lib/core-1000/client'
import { fromGenericExercise } from '@/lib/practice/adapters'
import type { PracticeExercise } from '@/lib/practice/types'
import type { CefrLevel } from '@/lib/core-1000/types'
import { core1000WordId } from '@/lib/core-1000/types'
import { selectNewWordsForLevel } from './vocab-selector'
import { buildWordExercises } from './word-exercise-builder'

// The Dexie SRS table is `db.srsData` (indexed on `wordId`), defined in lib/db/index.ts.
import { db } from '@/lib/db'

const TARGET_SIZE = 10
const FRAGMENT_SLOTS = 5
const VOCAB_SLOTS = 4

export interface BuildCourseSessionOptions {
  deckSlug: string
  cefrLevel: CefrLevel
}

/**
 * Assembles a mixed PracticeExercise[] for a grammar deck lesson.
 * Sources: sentence fragments (reorder/dictation/fill-blank), new Core 1000
 * vocabulary for the CEFR level, and optionally phoneme exercises (future).
 * Returns [] when all sources are empty — caller should hide the practice button.
 */
export async function buildCoursePracticeSession({
  deckSlug,
  cefrLevel,
}: BuildCourseSessionOptions): Promise<PracticeExercise[]> {
  // ── Source 1: sentence fragments ──────────────────────────────────────────
  const fragmentExercises = await (async () => {
    try {
      const fragments = await fetchFragmentsForDeck(deckSlug, 30)
      return generateMixedFromFragments(fragments, FRAGMENT_SLOTS).map((ex) =>
        fromGenericExercise(ex, 'courses'),
      )
    } catch {
      return []
    }
  })()

  // ── Source 2: new Core 1000 words for this CEFR level ────────────────────
  const vocabExercises = await (async () => {
    try {
      const [allWords, seenEntries] = await Promise.all([
        fetchCoreWords(),
        db.srsData.where('wordId').startsWith('c1k:').toArray(),
      ])
      const seenIds = new Set(seenEntries.map((e) => e.wordId))
      const newWords = selectNewWordsForLevel(allWords, cefrLevel, seenIds, VOCAB_SLOTS)
      return buildWordExercises(newWords).map((ex) => fromGenericExercise(ex, 'courses'))
    } catch {
      return []
    }
  })()

  // ── Interleave: fragment, vocab, fragment, vocab… ─────────────────────────
  const interleaved: PracticeExercise[] = []
  const fq = [...fragmentExercises]
  const vq = [...vocabExercises]
  while (interleaved.length < TARGET_SIZE && (fq.length > 0 || vq.length > 0)) {
    if (fq.length > 0) interleaved.push(fq.shift()!)
    if (interleaved.length < TARGET_SIZE && vq.length > 0) interleaved.push(vq.shift()!)
  }

  return interleaved
}
```

> **Note:** If `db.srsData` is not the correct Dexie table name, check `lib/db/schema.ts` and replace with the actual table reference (e.g., `db.srsEntries`). The pattern `.where('wordId').startsWith('c1k:').toArray()` should work with any Dexie table that has a `wordId` indexed field.

- [ ] **Step 5: Fix the `db` import if needed**

```bash
grep -n "srsData\|srsEntries\|wordId" "d:/proyectos/english-journal/lib/db/schema.ts" | head -15
```

Adjust the import and query in `build-session.ts` to match the actual table/field name before running tests.

- [ ] **Step 6: Run tests — confirm they pass**

```bash
pnpm test lib/courses/practice/build-session.test.ts
```
Expected: all 4 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/courses/practice/build-session.ts lib/courses/practice/build-session.test.ts
git commit -m "feat(courses): buildCoursePracticeSession — mixed session from fragments + vocab"
```

---

## Task 4: Progress dispatcher in `useSessionState`

**Files:**
- Modify: `components/practice/session/useSessionState.ts` (lines ~145–150, inside `handleSubmit`)

After `savePracticeAnswer` is called, add a branch that calls `gradeCore1000Word` when the exercise's `sourceRef.source` is `'core1k'`. This is the single change that makes vocab progress shared with Essential Words.

> **CRITICAL — do not pass `userId` to `gradeCore1000Word` here.** `gradeCore1000Word(word, quality, extras, userId)` writes to `answer_history` itself when `userId` is provided ([lib/core-1000/grade.ts:47-58](../../../lib/core-1000/grade.ts)). But `handleSubmit` already wrote this answer to `answer_history` at line ~146 via `savePracticeAnswer`. Passing `user?.id` would log the same event twice (once with `context: 'courses'`, once with `context: 'core-1000'`), inflating streak/accuracy. We only want the **shared Dexie SRS write** here, so call `gradeCore1000Word(word, quality, {})` with no userId. The answer history is owned by the existing `savePracticeAnswer` call.

- [ ] **Step 1: Read the exact surrounding code**

Open `components/practice/session/useSessionState.ts` at line 121–170 and confirm the structure matches what the plan shows. Look for the block:

```typescript
if (user) {
  void savePracticeAnswer(user.id, result).catch(...)
}
```

The dispatcher goes **after** this block.

- [ ] **Step 2: Add the dispatcher**

In `components/practice/session/useSessionState.ts`, add the import at the top of the file (after existing imports):

```typescript
import { gradeCore1000Word } from '@/lib/core-1000/grade'
```

Then, after the `savePracticeAnswer` block (around line 149), add:

```typescript
      // Route vocab exercises from courses to the shared Core 1000 SRS entry.
      // quality: SM-2 scale 0–5. correct→4 (remembered well), wrong→2 (hard).
      if (result.sourceRef?.source === 'core1k') {
        const word = result.sourceRef.id.replace(/^c1k:/, '')
        const quality = result.isCorrect ? 4 : 2
        // No userId: answer_history is already written above by savePracticeAnswer.
        // This call only updates the shared Dexie SRS entry (c1k:<word>).
        void gradeCore1000Word(word, quality, {}).catch((err) => {
          console.error('[PracticeSession] gradeCore1000Word failed', err)
        })
      }
```

The full `handleSubmit` block around the insertion point should look like:

```typescript
      if (user) {
        void savePracticeAnswer(user.id, result).catch((err) => {
          console.error('[PracticeSession] savePracticeAnswer failed', err)
        })
      }
      // Route vocab exercises from courses to the shared Core 1000 SRS entry.
      if (result.sourceRef?.source === 'core1k') {
        const word = result.sourceRef.id.replace(/^c1k:/, '')
        const quality = result.isCorrect ? 4 : 2
        // No userId: answer_history is already written above by savePracticeAnswer.
        // This call only updates the shared Dexie SRS entry (c1k:<word>).
        void gradeCore1000Word(word, quality, {}).catch((err) => {
          console.error('[PracticeSession] gradeCore1000Word failed', err)
        })
      }
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check 2>&1 | grep useSessionState | head -10
```
Expected: no errors.

> **On testing the dispatcher:** The spec asks for a unit test ("`core1k` invokes `gradeCore1000Word`; `text_fragments` does not"). The dispatcher lives inside `handleSubmit`'s `useCallback`, which depends on the full hook state — unit-testing it in isolation would require either refactoring the routing into a standalone pure function or a heavy hook-render test. The lowest-cost faithful verification is the manual IndexedDB check in Task 6 Step 4 (confirms `c1k:<word>` is created from a course session, and that `text_fragments` answers create no such entry). If a regression-proof unit test is wanted later, extract the routing into `routeProgressForResult(result): void` and test that directly — out of scope for this plan.

- [ ] **Step 4: Commit**

```bash
git add components/practice/session/useSessionState.ts
git commit -m "feat(courses): dispatch core1k SRS update from course vocab exercises"
```

---

## Task 5: Wire `GrammarStudyDeck` to use `buildCoursePracticeSession`

**Files:**
- Modify: `components/courses/grammar-deck/GrammarStudyDeck.tsx`
- Modify: `components/courses/grammar-deck/DeckDoneScreen.tsx`

Replace the existing `handleStartSentencePractice` implementation that calls `fetchFragmentsForDeck` + `generateMixedFromFragments` directly with a call to `buildCoursePracticeSession`. Also thread the CEFR level down from the page.

- [ ] **Step 1: Add `cefrLevel` prop to `GrammarStudyDeck`**

In `components/courses/grammar-deck/GrammarStudyDeck.tsx`, add `cefrLevel?: CefrLevel` to the props interface. Use `CefrLevel` from `@/lib/core-1000/types` (the type `buildCoursePracticeSession` expects — `'A1'..'C1'`), NOT `CEFRLevel` from `@/lib/exercises/cefr`:

```typescript
import type { CefrLevel } from '@/lib/core-1000/types'

interface GrammarStudyDeckProps {
  deck: GrammarStudyDeckData;
  backHref?: string;
  backLabel?: string;
  courseTitle?: string;
  levelId?: CoursePathTrackId;
  lessonId?: string;
  deckSlug?: string;
  relatedLinks?: GrammarRelatedLink[];
  cefrLevel?: CefrLevel;  // ← add this
}
```

Then add `cefrLevel` to the destructured props in the function signature, and use it directly (no inline `import('...')` type needed since it's now imported at top):

- [ ] **Step 2: Replace `handleStartSentencePractice` body**

Remove the existing body and replace with a call to `buildCoursePracticeSession`. The full updated callback (replace lines 108–128):

```typescript
  const handleStartSentencePractice = useCallback(async () => {
    if (!deck.meta || practiceLoading) return
    setPracticeLoading(true)
    setPracticeError(false)
    try {
      const resolvedSlug = (deckSlug ?? lessonId) ?? ''
      // cefrLevel defaults to 'A1' when not provided (most grammar decks are A1)
      const level: CefrLevel = cefrLevel ?? 'A1'
      const exercises = await buildCoursePracticeSession({ deckSlug: resolvedSlug, cefrLevel: level })
      if (exercises.length > 0) {
        setPracticeExercises(exercises)
      } else {
        setPracticeError(true)
      }
    } catch {
      setPracticeError(true)
    } finally {
      setPracticeLoading(false)
    }
  }, [deck.meta, lessonId, deckSlug, cefrLevel, practiceLoading])
```

Add the import at the top of the file:

```typescript
import { buildCoursePracticeSession } from '@/lib/courses/practice/build-session'
```

Remove the now-unused imports:
```typescript
// DELETE these two lines:
import { fetchFragmentsForDeck } from '@/lib/exercises/generators/reorder-from-fragments'
import { generateMixedFromFragments } from '@/lib/exercises/generators/mixed-from-fragments'
```

- [ ] **Step 3: Hide the practice button when session is known-empty**

In `components/courses/grammar-deck/DeckDoneScreen.tsx`, the button already shows an error when `practiceError` is true. Additionally, the spec says "if `buildCoursePracticeSession` returns `[]`, do not render the button."

The existing code shows the error message `"No hay ejercicios disponibles para esta lección aún."` when `practiceError` is true. This is the correct behavior — no extra change needed. However, to avoid the button appearing disabled for no visible reason, make the button section conditional on `!practiceError` after the first error:

The existing JSX block (lines 64–84) already handles this. Confirm the condition `lessonId &&` still wraps the whole button+error block. No change needed unless the button section renders outside that condition.

- [ ] **Step 4: Remove the Sound Lab link from `DeckDoneScreen`**

Per the spec, the standalone "Practica estos sonidos → Sound Lab" link is now replaced by embedded phoneme exercises. Remove lines 86–98 in `DeckDoneScreen.tsx`:

```tsx
// DELETE this entire block:
{deck.sounds && deck.sounds.length > 0 && (
  <Link
    href={`/practice/sounds?focus=${encodeURIComponent(deck.sounds.join(","))}`}
    className="grammar-deck__done-soundlab"
  >
    <Headphones size={16} className="grammar-deck__done-soundlab-ico" aria-hidden />
    <span className="grammar-deck__done-soundlab-text">
      <span>Practica estos sonidos</span>
      <em>{deck.sounds.join(" · ")}</em>
    </span>
    <ArrowRight size={14} className="grammar-deck__done-soundlab-arrow" aria-hidden />
  </Link>
)}
```

Also remove the unused `Headphones` import from the import line.

- [ ] **Step 5: Pass `cefrLevel` from the page**

In `app/courses/study/[n]/page.tsx`, `GrammarStudyDeck` is rendered with `levelId={trackId}` (around line 38–43). `trackId` is a `CoursePathTrackId` = `CefrLevelId ('a1'..'c1')` **or** an `ElectiveTrackId ('purposes' | 'business' | 'connected-speech')` (see `lib/courses/types.ts`). There is no `lesson.cefrLevel` field and no `trackCefrLevel` helper — derive the level inline.

Add a small derivation above the JSX return and pass it as a prop:

```tsx
import type { CefrLevel } from "@/lib/core-1000/types";

// CEFR tracks map straight to Core 1000 levels; elective tracks have no CEFR
// level, so default them to A1 (introduces the most common new vocabulary).
const CEFR_TRACKS = ["a1", "a2", "b1", "b2", "c1"] as const;
const cefrLevel: CefrLevel = (CEFR_TRACKS as readonly string[]).includes(trackId)
  ? (trackId.toUpperCase() as CefrLevel)
  : "A1";
```

Then add the prop to the existing element:

```tsx
<GrammarStudyDeck
  // ...existing props (deck, levelId={trackId}, lessonId, etc.)...
  cefrLevel={cefrLevel}
/>
```

- [ ] **Step 6: Type-check the whole app**

```bash
pnpm type-check 2>&1 | head -40
```
Expected: no errors. Fix any type mismatches before continuing.

- [ ] **Step 7: Commit**

```bash
git add components/courses/grammar-deck/GrammarStudyDeck.tsx components/courses/grammar-deck/DeckDoneScreen.tsx app/courses/study/[n]/page.tsx
git commit -m "feat(courses): wire buildCoursePracticeSession into deck done screen"
```

---

## Task 6: Verify end-to-end in the browser

This is a manual smoke test. No automated test replaces checking that the full flow works.

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Navigate to a grammar deck and complete it**

Go to `/courses`, pick any A1 lesson (e.g., "Verbos comunes"), flip through all cards, and reach the done screen.

- [ ] **Step 3: Verify the practice button behavior**

Click "Practica los ejercicios de esta lección". Expect:
- A mixed session loads with both sentence-type exercises AND fill_blank exercises for new Core 1000 words.
- No "No hay ejercicios disponibles" error.
- The Sound Lab link is gone from the done screen.

- [ ] **Step 4: Verify shared progress**

After completing the session, navigate to `/practice/review` or Essential Words. Confirm that any Core 1000 words practiced in the course session now appear as "introduced" (SRS entry exists). Open browser DevTools → Application → IndexedDB → `srsData` table → check for `c1k:<word>` entries for the vocab words you saw.

Also confirm the **negative case** (no double-logging): the sentence/`text_fragments` exercises must NOT create `c1k:` entries, and `answer_history` should have exactly one row per answered exercise (not two for vocab). Check the network tab / Supabase `answer_history` for the session — vocab answers should appear once with `context: 'courses'`, never a duplicate `context: 'core-1000'` row.

- [ ] **Step 5: Commit a final type-check + lint pass**

```bash
pnpm type-check && pnpm lint
```
Expected: no errors. Fix any lint warnings before closing the PR.

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| `buildCoursePracticeSession` assembles 3 sources | Task 3 |
| Vocab selector: level CEFR, only new words, by rank | Task 1 |
| Word exercise builder: `fill_blank` with `sourceRef.source = 'core1k'` | Task 2 |
| Progress dispatcher: `core1k` → `gradeCore1000Word(word, quality)` | Task 4 (no userId → SRS-only, avoids answer_history double-write) |
| No reviews in courses — only new words | Task 1 (`selectNewWordsForLevel` excludes seen) |
| Hide button when session returns `[]` | Task 5 (error state already covers this) |
| Remove standalone Sound Lab link | Task 5 step 4 |
| Phoneme exercises: online-only, graceful degrade | Not in this plan — phoneme integration is a separate follow-up. The assembler is structured to add it later (interleave loop). |
| Offline: vocab + fragments work offline; sounds degrade | Inherits from existing behavior: `fetchCoreWords` uses static JSON files which are HTTP-cacheable |

> **Gap noted:** Phoneme exercise embedding (`deck.sounds` → `generatePickWord`) is deferred. The spec marks this as optional ("if `deck.sounds` exists"). The assembler's interleave loop is designed to accept a third source queue when that work is done.

### Type consistency check

- `CefrLevel` from `lib/core-1000/types.ts` (`'A1' | 'A2' | 'B1' | 'B2' | 'C1'`) — used in Tasks 1, 2, 3, 5. Consistent.
- `CEFRLevel` from `lib/exercises/cefr.ts` is a different type used in `PracticeExercise.level`. These are different — `CefrLevel` (Core 1000) vs `CEFRLevel` (exercises). Task 5 uses the Core 1000 one for the selector; the exercise's `.level` field uses the exercises one. No conflict.
- `sourceRef.source = 'core1k'` — already defined in `ExerciseSource` in `lib/exercises/types.ts`. Consistent.
- `gradeCore1000Word(word, quality, {}, userId)` — signature matches `lib/core-1000/grade.ts`. Consistent.
- `core1000WordId(word)` → `'c1k:' + word` — used in Task 2 and reversed in Task 4 with `.replace(/^c1k:/, '')`. Consistent.
