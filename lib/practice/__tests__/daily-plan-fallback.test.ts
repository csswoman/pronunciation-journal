import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/word-bank/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/word-bank/queries')>()
  return {
    ...actual,
    getDueWordsForDaily: vi.fn().mockResolvedValue([]),
    getNewWordsForDaily: vi.fn().mockResolvedValue([]),
    getDueReviewWordsForDaily: vi.fn().mockResolvedValue([]),
  }
})

vi.mock('@/lib/sounds/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/sounds/queries')>()
  return {
    ...actual,
    getWeakestSoundByProgress: vi.fn().mockResolvedValue(null),
    getDueSoundsForReview: vi.fn().mockResolvedValue([]),
  }
})

vi.mock('@/lib/phoneme-practice/queries', () => ({
  getAllSounds: async () => [],
  getSessionDataset: async () => ({
    targetSound: { id: 0, ipa: '/x/', example: 'x', category: 'consonant', type: 'other', difficulty: 1 },
    sounds: [],
    wordsBySoundId: new Map(),
    minimalPairs: [],
  }),
  getSessionDatasets: async () => new Map(),
}))

vi.mock('@/lib/db', () => ({
  db: { learningState: { get: async () => null } },
}))

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

import { buildDailyPlan } from '../daily-plan/index'

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
