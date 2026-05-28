import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { Sound, SoundWord, MinimalPair } from '@/lib/phoneme-practice/types'

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<WordBankEntry> = {}): WordBankEntry {
  const id = overrides.id ?? crypto.randomUUID()
  return {
    id,
    user_id: 'user-1',
    text: overrides.text ?? `word-${id.slice(0, 4)}`,
    meaning: 'a definition',
    translation: null,
    ipa: null,
    // example must contain the word for fill_blank + reorder
    example: overrides.example ?? `The ${overrides.text ?? `word-${id.slice(0, 4)}`} was interesting to read today.`,
    synonyms: null,
    image_prompt: null,
    difficulty: 2,
    srs_status: 'new',
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 0,
    next_review_at: null,
    last_reviewed_at: null,
    status: 'ready',
    error_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_audio: false,
    audio_url: null,
    context: null,
    audio_fetch_attempts: 0,
    review_count: 0,
    source: 'lexicon',
    source_ref: null,
    ...overrides,
  }
}

function makeSound(id: number): Sound {
  return { id, ipa: `/ɪ${id}/`, example: 'sit', category: 'vowel', type: 'short', difficulty: 1 }
}

function makeSoundWord(id: number, soundId: number): SoundWord {
  return {
    id,
    sound_id: soundId,
    word: `word${id}`,
    ipa: `/wɜːd${id}/`,
    audio_url: null,
    difficulty: 1,
    phonemes: null,
    sound_focus: null,
  }
}

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock Supabase browser client used inside daily-plan.ts
const mockSelect = vi.fn()
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from: mockFrom }),
}))

// Mock phoneme queries to avoid network calls
vi.mock('@/lib/phoneme-practice/queries', () => ({
  getAllSounds: vi.fn(),
  getAllWords: vi.fn(),
  getMinimalPairs: vi.fn(),
  getWordsBySound: vi.fn(),
}))

import {
  getAllSounds,
  getAllWords,
  getMinimalPairs,
  getWordsBySound,
} from '@/lib/phoneme-practice/queries'
import {
  buildDailyPlan,
  EmptyWordBankError,
  DAILY_SESSION_LENGTH,
  WORD_BANK_SLOT_COUNT,
  PHONEME_SLOT_COUNT,
} from '../daily-plan'

// ── Supabase query builder helpers ────────────────────────────────────────────

/**
 * Build a chainable Supabase query mock that resolves with `rows`.
 * Supports: .select().eq().or().order().limit()
 */
function chainResolving(rows: unknown[]) {
  const chain: Record<string, unknown> = {}
  const terminal = { data: rows, error: null }
  const noop = () => chain
  chain.eq = noop
  chain.neq = noop
  chain.gt = noop
  chain.or = noop
  chain.order = noop
  chain.limit = () => Promise.resolve(terminal)
  // Some paths don't call .limit() — also expose promise directly
  Object.assign(chain, Promise.resolve(terminal))
  chain.then = (onfulfilled: (v: unknown) => unknown) =>
    Promise.resolve(terminal).then(onfulfilled)
  return chain
}

/** Two-phase mock: first call resolves dueWords, second resolves []. */
function setupWordBankMock(dueWords: WordBankEntry[], newWords: WordBankEntry[] = []) {
  let callCount = 0
  mockSelect.mockImplementation(() => {
    callCount++
    return chainResolving(callCount <= 1 ? dueWords : newWords)
  })
}

/** Mock for the weakest-sound progress query (returns empty → no phoneme slot). */
function setupProgressMock(rows: unknown[]) {
  // The progress query is a separate .from('user_sound_progress') call.
  // We configure mockFrom to distinguish by table name.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockFrom as any).mockImplementation((table: string) => {
    if (table === 'user_sound_progress') {
      return { select: () => chainResolving(rows) }
    }
    return { select: mockSelect }
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildDailyPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no sound progress (new user)
    mockFrom.mockImplementation(() => ({ select: mockSelect }))
    vi.mocked(getAllSounds).mockResolvedValue([])
    vi.mocked(getAllWords).mockResolvedValue([])
    vi.mocked(getMinimalPairs).mockResolvedValue([])
    vi.mocked(getWordsBySound).mockResolvedValue([])
  })

  it('throws EmptyWordBankError when word bank is empty', async () => {
    setupProgressMock([])
    mockSelect.mockImplementation(() => chainResolving([]))

    await expect(buildDailyPlan('user-1')).rejects.toBeInstanceOf(EmptyWordBankError)
  })

  it('returns up to DAILY_SESSION_LENGTH exercises', async () => {
    const words = Array.from({ length: 12 }, (_, i) =>
      makeEntry({ id: `w-${i}`, text: `vocabulary${i}`, example: `The vocabulary${i} word is useful for reading.` })
    )
    setupProgressMock([])
    setupWordBankMock(words, [])

    const plan = await buildDailyPlan('user-1')
    expect(plan.length).toBeLessThanOrEqual(DAILY_SESSION_LENGTH)
    expect(plan.length).toBeGreaterThan(0)
  })

  it('does not repeat contentId across exercises', async () => {
    const words = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ id: `w-${i}`, text: `unique${i}`, example: `The unique${i} idea was surprising to everyone today.` })
    )
    setupProgressMock([])
    setupWordBankMock(words, [])

    const plan = await buildDailyPlan('user-1')
    const contentIds = plan.map(e => e.contentId)
    expect(new Set(contentIds).size).toBe(contentIds.length)
  })

  it('all exercises have context="daily"', async () => {
    const words = Array.from({ length: 8 }, (_, i) =>
      makeEntry({ id: `w-${i}`, text: `daily${i}`, example: `The daily${i} routine helps build good habits.` })
    )
    setupProgressMock([])
    setupWordBankMock(words, [])

    const plan = await buildDailyPlan('user-1')
    for (const ex of plan) {
      expect(ex.context).toBe('daily')
    }
  })

  it('mix includes fill_blank, sentence_dictation and reorder_words slugs', async () => {
    const words = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ id: `w-${i}`, text: `word${i}`, example: `The word${i} appears clearly in each sentence today.` })
    )
    setupProgressMock([])
    setupWordBankMock(words, [])

    const plan = await buildDailyPlan('user-1')
    const slugs = new Set(plan.map(e => e.slug))
    // At least 2 of the 3 word_bank exercise types should appear
    const wordBankSlugs = ['fill_blank', 'sentence_dictation', 'reorder_words']
    const found = wordBankSlugs.filter(s => slugs.has(s as never))
    expect(found.length).toBeGreaterThanOrEqual(2)
  })

  it('falls back to new words when fewer than WORD_BANK_SLOT_COUNT due', async () => {
    const dueWords = Array.from({ length: 2 }, (_, i) =>
      makeEntry({ id: `due-${i}`, text: `dueword${i}`, example: `The dueword${i} shows up in this long example today.` })
    )
    const newWords = Array.from({ length: 6 }, (_, i) =>
      makeEntry({ id: `new-${i}`, text: `newword${i}`, example: `The newword${i} was added recently to this vocabulary list.` })
    )
    setupProgressMock([])
    // First select call → due words; second → new words pad
    let call = 0
    mockSelect.mockImplementation(() => {
      call++
      return chainResolving(call === 1 ? dueWords : newWords)
    })

    const plan = await buildDailyPlan('user-1')
    expect(plan.length).toBeGreaterThan(0)
  })

  it('includes phoneme exercises when a weak sound exists', async () => {
    const words = Array.from({ length: 8 }, (_, i) =>
      makeEntry({ id: `w-${i}`, text: `phoneme${i}`, example: `The phoneme${i} sound is practiced often in class.` })
    )

    const sound = makeSound(1)
    const soundWords = Array.from({ length: 6 }, (_, i) => makeSoundWord(i + 1, 1))
    const allPairs: MinimalPair[] = []

    setupProgressMock([
      {
        id: 'p-1',
        user_id: 'user-1',
        sound_id: 1,
        status: 'practicing',
        total_attempts: 10,
        correct_answers: 3,
        streak: 1,
        best_streak: 2,
        last_practiced: null,
        next_review: null,
        ease_factor: 2.5,
        interval_days: 1,
        sounds: sound,
      },
    ])
    setupWordBankMock(words, [])

    vi.mocked(getAllSounds).mockResolvedValue([sound])
    vi.mocked(getAllWords).mockResolvedValue(soundWords)
    vi.mocked(getWordsBySound).mockResolvedValue(soundWords)
    vi.mocked(getMinimalPairs).mockResolvedValue(allPairs)

    const plan = await buildDailyPlan('user-1')
    const phonemeSlugs = new Set(['pick_word', 'pick_sound', 'minimal_pair', 'dictation', 'match_pairs'])
    const hasPhoneme = plan.some(e => phonemeSlugs.has(e.slug))
    expect(hasPhoneme).toBe(true)
    expect(plan.length).toBeGreaterThan(WORD_BANK_SLOT_COUNT)
  })

  it('weakest sound is the one with lowest accuracy', async () => {
    // Two sounds: sound 1 (70% accuracy), sound 2 (20% accuracy)
    // Should pick sound 2
    const words = Array.from({ length: 8 }, (_, i) =>
      makeEntry({ id: `w-${i}`, text: `word${i}`, example: `The word${i} example is used in a long sentence.` })
    )
    const sound1 = makeSound(1)
    const sound2 = makeSound(2)
    const soundWords2 = Array.from({ length: 4 }, (_, i) => makeSoundWord(i + 10, 2))

    setupProgressMock([
      {
        id: 'p-1',
        user_id: 'user-1',
        sound_id: 1,
        status: 'practicing',
        total_attempts: 10,
        correct_answers: 7, // 70%
        streak: 3,
        best_streak: 4,
        last_practiced: null,
        next_review: null,
        ease_factor: 2.5,
        interval_days: 1,
        sounds: sound1,
      },
      {
        id: 'p-2',
        user_id: 'user-1',
        sound_id: 2,
        status: 'practicing',
        total_attempts: 10,
        correct_answers: 2, // 20%
        streak: 0,
        best_streak: 1,
        last_practiced: null,
        next_review: null,
        ease_factor: 2.5,
        interval_days: 1,
        sounds: sound2,
      },
    ])
    setupWordBankMock(words, [])

    vi.mocked(getAllSounds).mockResolvedValue([sound1, sound2])
    vi.mocked(getAllWords).mockResolvedValue(soundWords2)
    vi.mocked(getWordsBySound).mockResolvedValue(soundWords2)
    vi.mocked(getMinimalPairs).mockResolvedValue([])

    await buildDailyPlan('user-1')

    // getWordsBySound should have been called with sound_id 2 (the weakest)
    expect(vi.mocked(getWordsBySound)).toHaveBeenCalledWith(2)
  })

  it('uses extra word_bank exercises when no sound progress exists (new user)', async () => {
    const words = Array.from({ length: 8 }, (_, i) =>
      makeEntry({ id: `w-${i}`, text: `fresh${i}`, example: `The fresh${i} approach was enlightening for all students.` })
    )
    setupProgressMock([])
    setupWordBankMock(words, [])

    const plan = await buildDailyPlan('user-1')
    const wordBankSlugs = ['fill_blank', 'sentence_dictation', 'reorder_words']
    const allWordBank = plan.every(e => wordBankSlugs.includes(e.slug))
    expect(allWordBank).toBe(true)
  })
})

describe('EmptyWordBankError', () => {
  it('has the correct code and message', () => {
    const err = new EmptyWordBankError()
    expect(err.code).toBe('EMPTY_WORD_BANK')
    expect(err.message).toMatch(/lexicon/i)
    expect(err).toBeInstanceOf(Error)
  })
})
