import { describe, expect, it } from 'vitest'
import {
  buildPerformanceRows,
  buildSessionInsight,
  formatExerciseLabel,
  formatSlugLabel,
} from '@/lib/practice/session-summary-view'
import type { ExerciseResult, SessionResult } from '@/lib/practice/types'

function makeResult(partial: {
  accuracy: number
  bySlug: SessionResult['bySlug']
  results: Array<Partial<ExerciseResult> & Pick<ExerciseResult, 'slug' | 'isCorrect'>>
}): SessionResult {
  return {
    accuracy: partial.accuracy,
    totalTimeMs: 90_000,
    bySlug: partial.bySlug,
    results: partial.results.map((r, i) => ({
      exerciseId: `e${i}`,
      exerciseTypeId: 1,
      timeMs: 1000,
      contentId: `c${i}`,
      context: 'practice' as const,
      completedAt: new Date('2026-01-01T00:00:00Z'),
      exercisePayload: r.exercisePayload,
      ...r,
    })),
  }
}

describe('formatSlugLabel', () => {
  it('maps slugs to action verbs', () => {
    expect(formatSlugLabel('odd_one_out')).toBe('Escuchar')
    expect(formatSlugLabel('pick_word')).toBe('Elegir')
    expect(formatSlugLabel('match_pairs')).toBe('Emparejar')
    expect(formatSlugLabel('speak_word')).toBe('Hablar')
  })
})

describe('formatExerciseLabel', () => {
  it('uses targetWord when present', () => {
    expect(formatExerciseLabel('dictation', { targetWord: 'house' })).toBe('house')
  })

  it('falls back to a facet label', () => {
    expect(formatExerciseLabel('sentence_dictation', null)).toBe('Escribir')
  })
})

describe('buildPerformanceRows', () => {
  it('aggregates exercise types into action facets', () => {
    const rows = buildPerformanceRows({
      pick_word: { correct: 3, total: 3 },
      odd_one_out: { correct: 1, total: 3 },
      ax_same_different: { correct: 0, total: 1 },
      dictation: { correct: 0, total: 1 },
      match_pairs: { correct: 0, total: 1 },
    } as SessionResult['bySlug'])

    expect(rows.map((r) => r.facet)).toEqual(['listen', 'match', 'write', 'choose'])
    expect(rows.find((r) => r.facet === 'listen')).toMatchObject({
      correct: 1,
      total: 4,
      needsReinforce: true,
      label: 'Escuchar',
    })
    expect(rows.find((r) => r.facet === 'choose')).toMatchObject({
      needsReinforce: false,
      label: 'Elegir',
    })
    expect(rows.find((r) => r.facet === 'match')?.label).toBe('Emparejar')
  })
})

describe('buildSessionInsight', () => {
  it('celebrates when every facet is at or above 60%', () => {
    const result = makeResult({
      accuracy: 80,
      bySlug: {
        pick_word: { correct: 2, total: 3 },
        match_pairs: { correct: 3, total: 3 },
      } as SessionResult['bySlug'],
      results: [
        { slug: 'pick_word', isCorrect: true },
        { slug: 'pick_word', isCorrect: true },
        { slug: 'pick_word', isCorrect: false },
        { slug: 'match_pairs', isCorrect: true },
        { slug: 'match_pairs', isCorrect: true },
        { slug: 'match_pairs', isCorrect: true },
      ],
    })

    expect(buildSessionInsight(result)).toBe('Buen ritmo en esta tanda.')
  })

  it('prefers target words from weak facets', () => {
    const result = makeResult({
      accuracy: 50,
      bySlug: {
        dictation: { correct: 0, total: 2 },
        pick_word: { correct: 2, total: 2 },
      } as SessionResult['bySlug'],
      results: [
        { slug: 'dictation', isCorrect: false, exercisePayload: { targetWord: 'bit' } },
        { slug: 'dictation', isCorrect: false, exercisePayload: { targetWord: 'sit' } },
        { slug: 'pick_word', isCorrect: true, exercisePayload: { targetWord: 'miss' } },
      ],
    })

    expect(buildSessionInsight(result)).toBe('Hoy conviene reforzar bit y sit.')
  })

  it('falls back to facet labels when words are unavailable', () => {
    const result = makeResult({
      accuracy: 33,
      bySlug: {
        odd_one_out: { correct: 1, total: 3 },
      } as SessionResult['bySlug'],
      results: [
        { slug: 'odd_one_out', isCorrect: false },
        { slug: 'odd_one_out', isCorrect: false },
        { slug: 'odd_one_out', isCorrect: true },
      ],
    })

    expect(buildSessionInsight(result)).toBe('Hoy conviene reforzar escuchar.')
  })
})
