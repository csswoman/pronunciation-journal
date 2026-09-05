/* eslint-disable max-lines */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { Sound, SoundWord } from '@/lib/phoneme-practice/types'
import {
  fillBlankExampleSentence,
  makeLexiconWordBankEntry,
} from '@/lib/exercises/__tests__/fixtures/word-bank-entry'

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

vi.mock('@/lib/review/client-queries', () => ({
  fetchRecentFailedSentences: vi.fn().mockResolvedValue([]),
  fetchFailedSentenceWords: vi.fn().mockResolvedValue([]),
}))

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/word-bank/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/word-bank/queries')>()
  return {
    ...actual,
    getDueWordsForDaily: vi.fn(),
    getNewWordsForDaily: vi.fn(),
    getSavedOrFamiliarWordsForDaily: vi.fn(),
    getDueReviewWordsForDaily: vi.fn(),
    getWeakWordsForReview: vi.fn(),
  }
})

vi.mock('@/lib/sounds/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/sounds/queries')>()
  return {
    ...actual,
    getWeakestSoundByProgress: vi.fn(),
    getDueSoundsForReview: vi.fn(),
  }
})

// Mock phoneme queries to avoid network calls
vi.mock('@/lib/phoneme-practice/queries', () => ({
  getAllSounds: vi.fn(),
  getSessionDataset: vi.fn(),
  getSessionDatasets: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    learningState: { get: vi.fn().mockResolvedValue(null) },
    completedLessons: { toArray: vi.fn().mockResolvedValue([]) },
  },
  getSRSData: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/exercises/generators/connected-speech', () => ({
  generateConnectedSpeechExercises: vi.fn().mockResolvedValue(null),
  todaysDeckSlug: vi.fn().mockReturnValue('cs-linking'),
}))

vi.mock('@/lib/exercises/generators/reorder-from-fragments', () => ({
  fetchTextFragments: vi.fn().mockResolvedValue([]),
  generateReorderFromFragments: vi.fn().mockReturnValue([]),
}))

vi.mock('@/lib/practice/daily-plan/selectors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/practice/daily-plan/selectors')>()
  return {
    ...actual,
    dayOfYear: vi.fn().mockReturnValue(2),
  }
})

vi.mock('@/lib/exercises/generators/reorder-ai', () => ({
  generateReorderAI: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/essential-words/client-fetch', () => ({
  fetchEssentialWordsForDay: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/practice/daily-plan/reader-targets', () => ({
  fetchReaderTargetRows: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/practice/daily-plan/async-step-builders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/practice/daily-plan/async-step-builders')>()
  return {
    ...actual,
    buildReaderStep: vi.fn().mockResolvedValue(null),
  }
})

vi.mock('@/lib/journal/daily-step', () => ({
  shouldOfferJournalStep: () => false,
  buildJournalDailyStep: vi.fn(),
}))

import {
  getDueWordsForDaily,
  getNewWordsForDaily,
  getSavedOrFamiliarWordsForDaily,
  getDueReviewWordsForDaily,
  getWeakWordsForReview,
} from '@/lib/word-bank/queries'
import { getWeakestSoundByProgress, getDueSoundsForReview } from '@/lib/sounds/queries'
import {
  getAllSounds,
  getSessionDataset,
  getSessionDatasets,
} from '@/lib/phoneme-practice/queries'
import { db } from '@/lib/db'
import {
  buildDailyPlan,
  EmptyWordBankError,
  DAILY_PLAN_STEP_COUNT,
} from '../daily-plan/index'
import { MAX_PRONUNCIATION_STEPS } from '../daily-plan/constants'
import { buildReaderStep } from '../daily-plan/async-step-builders'
import type { PracticeExercise } from '../types'

/** Aplana todos los ejercicios de todos los pasos de un plan. */
function allExercises(plan: { steps: { exercises: PracticeExercise[] }[] }): PracticeExercise[] {
  return plan.steps.flatMap((s) => s.exercises)
}

/** Catálogo de seed razonable: varios sonidos con palabras, para llenar 5 pasos. */
function seedCatalog() {
  const sounds = Array.from({ length: 6 }, (_, i) => makeSound(i + 1))
  const words = sounds.flatMap((s) =>
    Array.from({ length: 5 }, (_, i) => makeSoundWord(s.id * 100 + i, s.id)),
  )
  return { sounds, words }
}

// ── Query mock helpers ────────────────────────────────────────────────────────

function setupWordBankMock(newWords: WordBankEntry[], dueWords: WordBankEntry[] = []) {
  vi.mocked(getNewWordsForDaily).mockResolvedValue(newWords)
  vi.mocked(getDueWordsForDaily).mockResolvedValue(dueWords)
}

function setupProgressMock(weakest: Sound | null) {
  vi.mocked(getWeakestSoundByProgress).mockResolvedValue(weakest)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildDailyPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupProgressMock(null)
    setupWordBankMock([], [])
    vi.mocked(getSavedOrFamiliarWordsForDaily).mockResolvedValue([])
    vi.mocked(getDueReviewWordsForDaily).mockResolvedValue([])
    vi.mocked(getWeakWordsForReview).mockResolvedValue([])
    vi.mocked(getDueSoundsForReview).mockResolvedValue([])
    const { sounds, words } = seedCatalog()
    vi.mocked(getAllSounds).mockResolvedValue(sounds)
    const makeDataset = (soundId: number) => {
      const targetSound = sounds.find((sound) => sound.id === soundId)!
      const datasetSounds = sounds.filter((sound) => Math.abs(sound.id - soundId) <= 1)
      const wordsBySoundId = new Map(datasetSounds.map((sound) => [
        sound.id,
        words.filter((word) => word.sound_id === sound.id),
      ]))
      return { targetSound, sounds: datasetSounds, wordsBySoundId, minimalPairs: [] }
    }
    vi.mocked(getSessionDataset).mockImplementation((soundId: number) => Promise.resolve(makeDataset(soundId)))
    vi.mocked(getSessionDatasets).mockImplementation((soundIds: number[]) => Promise.resolve(
      new Map(soundIds.map((soundId) => [soundId, makeDataset(soundId)])),
    ))
  })

  it('usuario nuevo (sin word_bank ni progreso): respeta el tope de pronunciación sin lanzar error', async () => {
    const plan = await buildDailyPlan('user-1')

    expect(plan.isNewUser).toBe(true)
    // Sin word_bank no debe haber paso de repaso de palabras.
    expect(plan.steps.some((s) => s.kind === 'word_review')).toBe(false)
    expect(plan.steps.some((s) => s.kind === 'reader')).toBe(false)
    expect(vi.mocked(buildReaderStep)).not.toHaveBeenCalled()
    const pronunciation = plan.steps.filter((s) =>
      ['phoneme_focus', 'minimal_pairs', 'listening', 'connected_speech'].includes(s.kind),
    )
    expect(pronunciation.length).toBeLessThanOrEqual(MAX_PRONUNCIATION_STEPS)
  })

  it('respeta el tope de pronunciación cuando hay seed', async () => {
    const plan = await buildDailyPlan('user-1')
    const pronunciation = plan.steps.filter((s) =>
      ['phoneme_focus', 'minimal_pairs', 'listening', 'connected_speech'].includes(s.kind),
    )
    expect(pronunciation.length).toBeLessThanOrEqual(MAX_PRONUNCIATION_STEPS)
  })

  it('populates arc with the primary sound IPA and session words', async () => {
    const words = Array.from({ length: 6 }, (_, i) =>
      makeLexiconWordBankEntry({ id: `w-${i}`, text: `word${i}`, example: fillBlankExampleSentence(`word${i}`) }),
    )
    setupWordBankMock(words, [])

    const plan = await buildDailyPlan('user-1')

    expect(plan.arc).toBeDefined()
    expect(plan.arc).toHaveProperty('topicLabel')
    expect(plan.arc).toHaveProperty('soundIpa')
    expect(Array.isArray(plan.arc?.sessionWords)).toBe(true)
    // word_review exercises carry targetWord, so session words should be non-empty.
    expect(plan.arc!.sessionWords.length).toBeGreaterThan(0)
  })

  it('no repite contentId dentro de un mismo paso', async () => {
    const plan = await buildDailyPlan('user-1')
    for (const step of plan.steps) {
      const ids = step.exercises.map((e) => e.contentId)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('todos los ejercicios tienen context="daily"', async () => {
    const plan = await buildDailyPlan('user-1')
    for (const ex of allExercises(plan)) {
      expect(ex.context).toBe('daily')
    }
  })

  it('incluye un paso de repaso de palabras cuando hay word_bank', async () => {
    const words = Array.from({ length: 6 }, (_, i) =>
      makeLexiconWordBankEntry({ id: `w-${i}`, text: `word${i}`, example: fillBlankExampleSentence(`word${i}`) }),
    )
    setupWordBankMock(words, [])

    const plan = await buildDailyPlan('user-1')
    expect(plan.steps.some((s) => s.kind === 'word_review')).toBe(true)
    expect(plan.isNewUser).toBe(false)
  })

  it('word_review en plan diario excluye match_pairs e incluye fill_blank (B3)', async () => {
    const words = Array.from({ length: 6 }, (_, i) =>
      makeLexiconWordBankEntry({ id: `w-${i}`, text: `word${i}`, example: fillBlankExampleSentence(`word${i}`) }),
    )
    setupWordBankMock(words, [])

    const plan = await buildDailyPlan('user-1')
    const reviewStep = plan.steps.find((s) => s.kind === 'word_review')
    expect(reviewStep).toBeDefined()
    // B3: match_pairs is reserved for free practice and excluded from daily plan
    expect(reviewStep!.exercises.some((e) => e.slug === 'match_pairs')).toBe(false)
    expect(reviewStep!.exercises.some((e) => e.slug === 'fill_blank')).toBe(true)
  })

  it('el paso de fonema usa el sonido más débil cuando hay progreso', async () => {
    // /ɪ1/ contrasts with /ɪ2/ (70% accuracy), and /ɪ2/ contrasts with /ɪ3/ (20%).
    // Both phonemes in a contrast are counted — /ɪ2/ accumulates: 7+2=9 correct /
    // 10+10=20 attempts = 45%, lower than /ɪ1/ (7/10=70%) or /ɪ3/ (2/10=20%).
    // Actually the weakest single phoneme across all contrasts is /ɪ2/ (only appears
    // in the low-accuracy row with 2/10=20%) so makeSound(2) should be chosen.
    // Simplest setup: one contrast row where /ɪ2/ has very low accuracy.
    // /ɪ1/ at 70%, /ɪ2/ at 20% → /ɪ2/ is weakest phoneme, sound id=2 should be primary.
    // makeSound(id) produces ipa = `/ɪ${id}/`
    const { sounds } = seedCatalog()
    const sound2 = sounds.find(s => s.id === 2)!
    setupProgressMock(sound2)

    const plan = await buildDailyPlan('user-1')

    expect(vi.mocked(getSessionDataset)).toHaveBeenCalledWith(2)
    expect(plan.steps.some((s) => s.id === 'phoneme_focus:2')).toBe(true)
    expect(plan.isNewUser).toBe(false)
  })

  it('respeta el tope de pronunciación aunque el word_bank esté vacío', async () => {
    const plan = await buildDailyPlan('user-1')
    const pronunciation = plan.steps.filter((s) =>
      ['phoneme_focus', 'minimal_pairs', 'listening', 'connected_speech'].includes(s.kind),
    )
    expect(pronunciation.length).toBeLessThanOrEqual(MAX_PRONUNCIATION_STEPS)
  })

  it('context_practice aparece cuando hay palabras con oraciones de ejemplo', async () => {
    const words = Array.from({ length: 4 }, (_, i) =>
      makeLexiconWordBankEntry({ id: `w-${i}`, text: `word${i}`, example: `We saw word${i} in the sentence today.` }),
    )
    setupWordBankMock(words, [])

    const plan = await buildDailyPlan('user-1')
    expect(plan.steps.some((s) => s.kind === 'context_practice')).toBe(true)
    const contextStep = plan.steps.find((s) => s.kind === 'context_practice')
    expect(contextStep!.exercises.every((e) => e.slug === 'sentence_context')).toBe(true)
  })

  it('usa el sonido del AI Coach cuando Sound Lab no tiene progreso', async () => {
    const { sounds } = seedCatalog()
    const sound3 = sounds.find((s) => s.id === 3)!
    // Mock learningState with a struggling sound matching sound3's IPA
    vi.mocked(db.learningState.get).mockResolvedValue({
      userId: 'user-1',
      updatedAt: new Date().toISOString(),
      state: {
        pronunciation: {
          strugglingSounds: [{ ipa: sound3.ipa, avgAccuracy: 40, attempts: 5 }],
          averageAccuracy: 40,
        },
        grammar: { weakTopics: [] },
        level: { cefrEstimate: 'B1', confidence: 0.5 },
        vocabulary: { knownCount: 0, strugglingWords: [], savedWords: [] },
        lastSessions: [],
        userId: 'user-1',
        deviceId: 'dev',
      },
    } as never)
    setupProgressMock(null)
    setupWordBankMock([], [])

    const plan = await buildDailyPlan('user-1')
    expect(vi.mocked(getSessionDataset)).toHaveBeenCalledWith(3)
    expect(plan.steps.some((s) => s.id === `phoneme_focus:${sound3.id}`)).toBe(true)
    vi.mocked(db.learningState.get).mockResolvedValue(null)
  })

  it('context_practice no aparece cuando ninguna palabra tiene oración de ejemplo', async () => {
    const words = Array.from({ length: 6 }, (_, i) =>
      makeLexiconWordBankEntry({ id: `w-${i}`, text: `word${i}`, example: null }),
    )
    setupWordBankMock(words, [])

    const plan = await buildDailyPlan('user-1')
    expect(plan.steps.some((s) => s.kind === 'context_practice')).toBe(false)
  })

  it('batches session datasets for review sounds', async () => {
    const { sounds } = seedCatalog()
    vi.mocked(getDueSoundsForReview).mockResolvedValue([sounds[0], sounds[1]])

    await buildDailyPlan('user-1')

    expect(vi.mocked(getSessionDatasets)).toHaveBeenCalledWith([1, 2])
  })

  it('study_deck usa el nivel de focus efectivo cuando el focus está pinned', async () => {
    vi.mocked(db.learningState.get).mockResolvedValue({
      userId: 'user-1',
      updatedAt: new Date().toISOString(),
      state: {
        pronunciation: { averageAccuracy: 0, strugglingSounds: [] },
        grammar: { weakTopics: [] },
        level: { cefrEstimate: 'A2', confidence: 0.5 },
        vocabulary: { knownCount: 0, strugglingWords: [], savedWords: [] },
        lastSessions: [],
        userId: 'user-1',
        deviceId: 'dev',
        focus: {
          level: 'b1',
          thread: null,
          pinned: true,
          suggested: { level: 'a2', thread: null, source: 'profile' },
          source: 'manual',
          updatedAt: '2026-08-12T12:00:00.000Z',
        },
      },
    } as never)
    setupProgressMock(null)
    setupWordBankMock([], [])

    const plan = await buildDailyPlan('user-1')
    const studyDeck = plan.steps.find((s) => s.kind === 'study_deck')
    expect(studyDeck).toBeDefined()
    expect(studyDeck!.href).toContain('level=b1')
    expect(studyDeck!.href).not.toContain('level=a2')
    vi.mocked(db.learningState.get).mockResolvedValue(null)
  })

  it('incluye paso reader cuando hay word_bank y buildReaderStep devuelve paso', async () => {
    const words = Array.from({ length: 4 }, (_, i) =>
      makeLexiconWordBankEntry({ id: `w-${i}`, text: `word${i}`, example: `We saw word${i} today.` }),
    )
    setupWordBankMock(words, [])

    const readerStep = {
      kind: 'reader' as const,
      id: 'reader',
      title: 'Lectura',
      subtitle: 'Tus palabras recientes, en contexto',
      icon: 'BookOpen' as const,
      exercises: [],
      estMinutes: 3,
      readerPassage: {
        id: 'p1',
        userId: 'user-1',
        targetItems: ['word0'],
        targetSrsIds: ['wb:w-0'],
        targetHash: 'hash',
        topic: 'daily',
        passage: 'Hello world',
        questions: [],
        level: 'A2' as const,
        createdAt: new Date().toISOString(),
      },
    }
    vi.mocked(buildReaderStep).mockResolvedValueOnce(readerStep)

    const plan = await buildDailyPlan('user-1')
    expect(vi.mocked(buildReaderStep)).toHaveBeenCalled()
    expect(plan.steps).toHaveLength(DAILY_PLAN_STEP_COUNT)
    expect(plan.steps.find((s) => s.kind === 'reader')?.readerPassage?.id).toBe('p1')
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
