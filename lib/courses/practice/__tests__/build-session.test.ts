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
  db: {
    srsData: {
      where: vi.fn().mockReturnValue({
        startsWith: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
    },
  },
}))
vi.mock('../vocab-selector', () => ({
  selectNewWordsForLevel: vi.fn().mockReturnValue([]),
}))
vi.mock('../word-exercise-builder', () => ({
  buildWordExercises: vi.fn().mockReturnValue([]),
}))
vi.mock('@/lib/practice/adapters', () => ({
  fromGenericExercise: vi.fn((ex: unknown) => ({
    id: (ex as { id: string }).id,
    slug: 'fill_blank',
    exerciseTypeId: 5,
    contentId: (ex as { id: string }).id,
    context: 'courses',
    payload: { kind: 'generic', data: ex },
    sourceRef: (ex as { sourceRef: unknown }).sourceRef,
  })),
}))

import { buildCoursePracticeSession } from '../build-session'
import { fetchFragmentsForDeck } from '@/lib/exercises/generators/reorder-from-fragments'
import { generateMixedFromFragments } from '@/lib/exercises/generators/mixed-from-fragments'
import { fetchCoreWords } from '@/lib/core-1000/client'
import { selectNewWordsForLevel } from '../vocab-selector'
import { buildWordExercises } from '../word-exercise-builder'
import type { CoreWord } from '@/lib/core-1000/types'

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
    const fakeWord: CoreWord = { rank: 1, word: 'run', pos: 'verb', ipa_strong: '/rʌn/', example_sentence: 'I run every day.', cefr_level: 'A1' }
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
