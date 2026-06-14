# Core 1000 Daily Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user has no word_bank words (new user) or no new/due words today, fill the `word_review` and `context_practice` daily steps with Core 1000 words instead of skipping them.

**Architecture:** Add a client-side fetcher that loads Core 1000 JSON chunks via `fetch()`, filters words to ≥4 letters, and rotates selection by day. A pure adapter converts `CoreWord` to `WordBankEntry` shape. `buildDailyPlan` calls both when `reviewWords` is empty.

**Tech Stack:** Next.js 15 (client fetch to `/public`), TypeScript, Vitest

---

## Files

| Action | Path | Responsibility |
|---|---|---|
| Create | `lib/core-1000/client-fetch.ts` | Chunk fetcher + word filter + day rotation + CoreWord→WordBankEntry adapter |
| Create | `lib/core-1000/__tests__/client-fetch.test.ts` | Unit tests for fetcher and adapter |
| Modify | `lib/practice/daily-plan.ts` | Call fallback when `reviewWords.length === 0` |
| Create | `lib/practice/__tests__/daily-plan-fallback.test.ts` | Integration test for fallback path |

---

## Task 1: `coreWordToWordBankEntry` adapter (pure, no I/O)

**Files:**
- Create: `lib/core-1000/client-fetch.ts`
- Create: `lib/core-1000/__tests__/client-fetch.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/core-1000/__tests__/client-fetch.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { coreWordToWordBankEntry } from '../client-fetch'
import type { CoreWord } from '../types'

const makeWord = (overrides: Partial<CoreWord> = {}): CoreWord => ({
  rank: 1,
  word: 'make',
  pos: 'verb',
  ipa_strong: 'meɪk',
  example_sentence: 'I want to make a plan.',
  cefr_level: 'A1',
  ...overrides,
})

describe('coreWordToWordBankEntry', () => {
  it('maps text from word', () => {
    const entry = coreWordToWordBankEntry(makeWord({ word: 'build' }))
    expect(entry.text).toBe('build')
  })

  it('maps example from example_sentence', () => {
    const entry = coreWordToWordBankEntry(makeWord({ example_sentence: 'She will build a house.' }))
    expect(entry.example).toBe('She will build a house.')
  })

  it('maps ipa from ipa_strong', () => {
    const entry = coreWordToWordBankEntry(makeWord({ ipa_strong: 'bɪld' }))
    expect(entry.ipa).toBe('bɪld')
  })

  it('maps A1 cefr_level to difficulty 1', () => {
    expect(coreWordToWordBankEntry(makeWord({ cefr_level: 'A1' })).difficulty).toBe(1)
  })

  it('maps A2 cefr_level to difficulty 1', () => {
    expect(coreWordToWordBankEntry(makeWord({ cefr_level: 'A2' })).difficulty).toBe(1)
  })

  it('maps B1 cefr_level to difficulty 2', () => {
    expect(coreWordToWordBankEntry(makeWord({ cefr_level: 'B1' })).difficulty).toBe(2)
  })

  it('maps B2 cefr_level to difficulty 2', () => {
    expect(coreWordToWordBankEntry(makeWord({ cefr_level: 'B2' })).difficulty).toBe(2)
  })

  it('maps C1 cefr_level to difficulty 3', () => {
    expect(coreWordToWordBankEntry(makeWord({ cefr_level: 'C1' })).difficulty).toBe(3)
  })

  it('sets srs_status to new', () => {
    expect(coreWordToWordBankEntry(makeWord()).srs_status).toBe('new')
  })

  it('sets status to ready', () => {
    expect(coreWordToWordBankEntry(makeWord()).status).toBe('ready')
  })

  it('generates stable id with core1k: prefix', () => {
    const entry = coreWordToWordBankEntry(makeWord({ word: 'Make' }))
    expect(entry.id).toBe('core1k:make')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test lib/core-1000/__tests__/client-fetch.test.ts
```

Expected: FAIL — "Cannot find module '../client-fetch'"

- [ ] **Step 3: Create `lib/core-1000/client-fetch.ts` with the adapter**

```ts
import type { CoreWord, CefrLevel } from './types'
import type { WordBankEntry } from '@/lib/word-bank/types'

function cefrToDifficulty(level: CefrLevel): number {
  if (level === 'C1') return 3
  if (level === 'B1' || level === 'B2') return 2
  return 1 // A1, A2
}

export function coreWordToWordBankEntry(w: CoreWord): WordBankEntry {
  return {
    id: `core1k:${w.word.toLowerCase()}`,
    user_id: '',
    text: w.word,
    meaning: null,
    translation: null,
    example: w.example_sentence,
    ipa: w.ipa_strong,
    difficulty: cefrToDifficulty(w.cefr_level),
    srs_status: 'new',
    status: 'ready',
    audio_url: null,
    audio_fetch_attempts: 0,
    context: null,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    ease_factor: 2.5,
    error_reason: null,
    has_audio: null,
    image_prompt: null,
    interval_days: 0,
    last_reviewed_at: null,
    next_review_at: null,
    repetitions: 0,
    review_count: 0,
    source: 'core1k',
    source_ref: null,
    synonyms: null,
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm test lib/core-1000/__tests__/client-fetch.test.ts
```

Expected: all 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/core-1000/client-fetch.ts lib/core-1000/__tests__/client-fetch.test.ts
git commit -m "feat(core-1000): add coreWordToWordBankEntry adapter"
```

---

## Task 2: Day-rotation helper and word filter

**Files:**
- Modify: `lib/core-1000/client-fetch.ts`
- Modify: `lib/core-1000/__tests__/client-fetch.test.ts`

- [ ] **Step 1: Add tests for the filter and rotation helpers**

Append to `lib/core-1000/__tests__/client-fetch.test.ts`:

```ts
import { filterAndRotate } from '../client-fetch'

describe('filterAndRotate', () => {
  const words: CoreWord[] = [
    makeWord({ word: 'the', rank: 1 }),   // 3 letters — excluded
    makeWord({ word: 'make', rank: 2 }),  // 4 letters — included
    makeWord({ word: 'build', rank: 3 }), // 5 letters — included
    makeWord({ word: 'run', rank: 4 }),   // 3 letters — excluded
    makeWord({ word: 'walk', rank: 5 }),  // 4 letters — included
    makeWord({ word: 'talk', rank: 6 }),  // 4 letters — included
  ]

  it('excludes words shorter than 4 characters', () => {
    const result = filterAndRotate(words, 0, 10)
    expect(result.every(w => w.word.length >= 4)).toBe(true)
  })

  it('returns up to count words', () => {
    const result = filterAndRotate(words, 0, 2)
    expect(result.length).toBe(2)
  })

  it('rotates by day — day 0 and day 4 return different slices', () => {
    // 4 eligible words: make, build, walk, talk
    const day0 = filterAndRotate(words, 0, 2)
    const day4 = filterAndRotate(words, 4, 2)
    expect(day0).not.toEqual(day4)
  })

  it('wraps around — rotation is deterministic and never goes out of bounds', () => {
    const result = filterAndRotate(words, 999, 2)
    expect(result.length).toBe(2)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm test lib/core-1000/__tests__/client-fetch.test.ts
```

Expected: FAIL — "filterAndRotate is not exported"

- [ ] **Step 3: Add `filterAndRotate` to `lib/core-1000/client-fetch.ts`**

Add after the `coreWordToWordBankEntry` function:

```ts
/**
 * From a list of CoreWords, keep only words with ≥4 characters (excludes
 * function words like "the", "a", "is"), then return a slice of `count`
 * words rotated deterministically by `day`.
 */
export function filterAndRotate(words: CoreWord[], day: number, count: number): CoreWord[] {
  const eligible = words.filter(w => w.word.length >= 4)
  if (eligible.length === 0) return []
  const start = day % eligible.length
  // Wrap-around slice: take from start, then from beginning if needed
  const result: CoreWord[] = []
  for (let i = 0; i < count && i < eligible.length; i++) {
    result.push(eligible[(start + i) % eligible.length])
  }
  return result
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm test lib/core-1000/__tests__/client-fetch.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/core-1000/client-fetch.ts lib/core-1000/__tests__/client-fetch.test.ts
git commit -m "feat(core-1000): add filterAndRotate helper with >=4 char filter"
```

---

## Task 3: Client-side chunk fetcher

**Files:**
- Modify: `lib/core-1000/client-fetch.ts`
- Modify: `lib/core-1000/__tests__/client-fetch.test.ts`

The fetcher loads `/core-1000/words-NNN.json` via `fetch()`. Each chunk has 100 words (`CHUNK_SIZE = 100`). To get `count` eligible words we may need to load more than one chunk.

- [ ] **Step 1: Add fetch test with mocked fetch**

Append to `lib/core-1000/__tests__/client-fetch.test.ts`:

```ts
import { vi, beforeEach, afterEach } from 'vitest'
import { fetchCoreWordsForDay } from '../client-fetch'

describe('fetchCoreWordsForDay', () => {
  const chunk1: CoreWord[] = Array.from({ length: 10 }, (_, i) =>
    makeWord({ word: i < 3 ? 'the' : `word${i}`, rank: i + 1 })
    // words 0-2: "the" (3 chars, filtered); words 3-9: "word3"..."word9" (5 chars, kept)
  )

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => chunk1,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns WordBankEntry array', async () => {
    const result = await fetchCoreWordsForDay(0, 3)
    expect(result).toHaveLength(3)
    expect(result[0]).toHaveProperty('text')
    expect(result[0]).toHaveProperty('example')
  })

  it('filters out words shorter than 4 chars', async () => {
    const result = await fetchCoreWordsForDay(0, 5)
    expect(result.every(e => e.text.length >= 4)).toBe(true)
  })

  it('fetches chunk 001 first', async () => {
    await fetchCoreWordsForDay(0, 3)
    expect(global.fetch).toHaveBeenCalledWith('/core-1000/words-001.json')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm test lib/core-1000/__tests__/client-fetch.test.ts
```

Expected: FAIL — "fetchCoreWordsForDay is not exported"

- [ ] **Step 3: Add `fetchCoreWordsForDay` to `lib/core-1000/client-fetch.ts`**

Add after `filterAndRotate`:

```ts
import { CHUNK_SIZE, MAX_CHUNKS } from './types'
import type { CoreWord } from './types'

function chunkUrl(n: number): string {
  return `/core-1000/words-${String(n).padStart(3, '0')}.json`
}

async function loadChunk(n: number): Promise<CoreWord[]> {
  const res = await fetch(chunkUrl(n))
  if (!res.ok) return []
  return res.json() as Promise<CoreWord[]>
}

/**
 * Fetches Core 1000 words for the given day offset, returning `count`
 * WordBankEntry items. Words shorter than 4 characters are excluded.
 * Selection rotates by `day` so different days surface different words.
 * Loads additional chunks if the first chunk doesn't yield enough eligible words.
 */
export async function fetchCoreWordsForDay(day: number, count: number): Promise<WordBankEntry[]> {
  const collected: CoreWord[] = []
  let chunkIndex = 1

  // Load chunks until we have enough eligible words or run out of chunks
  while (collected.filter(w => w.word.length >= 4).length < count && chunkIndex <= MAX_CHUNKS) {
    const words = await loadChunk(chunkIndex)
    if (words.length === 0) break
    collected.push(...words)
    chunkIndex++
  }

  return filterAndRotate(collected, day, count).map(coreWordToWordBankEntry)
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm test lib/core-1000/__tests__/client-fetch.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/core-1000/client-fetch.ts lib/core-1000/__tests__/client-fetch.test.ts
git commit -m "feat(core-1000): add fetchCoreWordsForDay client fetcher"
```

---

## Task 4: Wire fallback into `buildDailyPlan`

**Files:**
- Modify: `lib/practice/daily-plan.ts` (around line 519–526)
- Create: `lib/practice/__tests__/daily-plan-fallback.test.ts`

- [ ] **Step 1: Write a failing integration test**

Create `lib/practice/__tests__/daily-plan-fallback.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase — return empty word_bank
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            or: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }),
            neq: () => ({ lte: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) }),
            order: () => ({ limit: () => ({ data: [], error: null }) }),
          }),
          or: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }),
          gt: () => ({ data: [], error: null }),
          in: () => ({ data: [], error: null }),
        }),
      }),
    }),
  }),
}))

// Mock phoneme queries — return minimal valid data to avoid unrelated failures
vi.mock('@/lib/phoneme-practice/queries', () => ({
  getAllSounds: async () => [],
  getAllWords: async () => [],
  getMinimalPairs: async () => [],
  getWordsBySound: async () => [],
}))

// Mock Dexie
vi.mock('@/lib/db', () => ({
  db: { learningState: { get: async () => null } },
}))

// Mock connected speech and reorder generators to return null/empty
vi.mock('@/lib/exercises/generators/connected-speech', () => ({
  generateConnectedSpeechExercises: async () => null,
}))
vi.mock('@/lib/exercises/generators/reorder-from-fragments', () => ({
  fetchTextFragments: async () => [],
  generateReorderFromFragments: () => [],
}))
vi.mock('@/lib/exercises/generators/reorder-ai', () => ({
  generateReorderAI: async () => [],
}))

// Mock fetchCoreWordsForDay — return 6 realistic entries
vi.mock('@/lib/core-1000/client-fetch', () => ({
  fetchCoreWordsForDay: async (_day: number, count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `core1k:word${i}`,
      user_id: '',
      text: `word${i}`,
      meaning: null,
      translation: null,
      example: `This is word${i} in a sentence.`,
      ipa: 'wɜrd',
      difficulty: 1,
      srs_status: 'new',
      status: 'ready',
      audio_url: null,
      audio_fetch_attempts: 0,
      context: null,
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
      ease_factor: 2.5,
      error_reason: null,
      has_audio: null,
      image_prompt: null,
      interval_days: 0,
      last_reviewed_at: null,
      next_review_at: null,
      repetitions: 0,
      review_count: 0,
      source: 'core1k',
      source_ref: null,
      synonyms: null,
    })),
}))

import { buildDailyPlan } from '../daily-plan'

describe('buildDailyPlan — Core 1000 fallback', () => {
  it('includes word_review step when word_bank is empty', async () => {
    const plan = await buildDailyPlan('test-user-id')
    const step = plan.steps.find(s => s.kind === 'word_review')
    expect(step).toBeDefined()
  })

  it('sets isNewUser true when word_bank is empty and no phoneme progress', async () => {
    const plan = await buildDailyPlan('test-user-id')
    expect(plan.isNewUser).toBe(true)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm test lib/practice/__tests__/daily-plan-fallback.test.ts
```

Expected: FAIL — word_review step not found (fallback not wired yet)

- [ ] **Step 3: Add fallback import to `lib/practice/daily-plan.ts`**

At the top of the file, add the import after existing imports:

```ts
import { fetchCoreWordsForDay } from '@/lib/core-1000/client-fetch'
```

- [ ] **Step 4: Add fallback in `buildDailyPlan` after existing word-fetch block**

Find this block (around line 519–526):

```ts
  let reviewWords = await fetchNewWords(userId, WORD_REVIEW_WORD_COUNT)
  // Relleno con due si hay pocas nuevas (usuario sin palabras nuevas pendientes)
  if (reviewWords.length < WORD_REVIEW_WORD_COUNT) {
    const newIds = new Set(reviewWords.map((w) => w.id))
    const due = (await fetchDueWords(userId)).filter((w) => !newIds.has(w.id))
    reviewWords = [...reviewWords, ...due].slice(0, WORD_REVIEW_WORD_COUNT)
  }
  const hasWordBank = reviewWords.length > 0
```

Replace with:

```ts
  let reviewWords = await fetchNewWords(userId, WORD_REVIEW_WORD_COUNT)
  // Relleno con due si hay pocas nuevas (usuario sin palabras nuevas pendientes)
  if (reviewWords.length < WORD_REVIEW_WORD_COUNT) {
    const newIds = new Set(reviewWords.map((w) => w.id))
    const due = (await fetchDueWords(userId)).filter((w) => !newIds.has(w.id))
    reviewWords = [...reviewWords, ...due].slice(0, WORD_REVIEW_WORD_COUNT)
  }
  const hasWordBank = reviewWords.length > 0

  // Fallback: si el usuario no tiene palabras hoy, usar Core 1000
  if (reviewWords.length === 0) {
    reviewWords = await fetchCoreWordsForDay(dayOfYear(), WORD_REVIEW_WORD_COUNT)
  }
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
pnpm test lib/practice/__tests__/daily-plan-fallback.test.ts
```

Expected: both tests PASS

- [ ] **Step 6: Run full test suite to check for regressions**

```bash
pnpm test
```

Expected: all existing tests still PASS

- [ ] **Step 7: Type-check**

```bash
pnpm type-check
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add lib/practice/daily-plan.ts lib/practice/__tests__/daily-plan-fallback.test.ts
git commit -m "feat(daily): use Core 1000 fallback when word_bank is empty or no words due today"
```
