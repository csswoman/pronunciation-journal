import { describe, it, expect } from 'vitest'
import { answerToGrade } from '../grade'
import type { PracticeAnswer } from '../types'

type GradeInput = Pick<PracticeAnswer, 'isCorrect' | 'timeMs' | 'score' | 'slug'>

function input(overrides: Partial<GradeInput> = {}): GradeInput {
  return {
    slug: 'pick_word',
    isCorrect: true,
    timeMs: 1000,
    ...overrides,
  }
}

describe('answerToGrade', () => {
  describe('speak_word with score', () => {
    const cases: Array<[number, number]> = [
      [100, 5],
      [95, 5],
      [94, 4],
      [80, 4],
      [79, 3],
      [60, 3],
      [59, 2],
      [40, 2],
      [39, 1],
      [20, 1],
      [19, 0],
      [0, 0],
    ]
    it.each(cases)('score %i → grade %i', (score, expected) => {
      expect(answerToGrade(input({ slug: 'speak_word', score, isCorrect: false }))).toBe(expected)
    })

    it('uses accuracy mapping even when isCorrect is true', () => {
      expect(answerToGrade(input({ slug: 'speak_word', score: 10, isCorrect: true }))).toBe(0)
    })
  })

  describe('speak_word without score falls through to time/correctness rules', () => {
    it('score undefined + incorrect → 1', () => {
      expect(
        answerToGrade(input({ slug: 'speak_word', score: undefined, isCorrect: false })),
      ).toBe(1)
    })

    it('score undefined + correct + fast → 5', () => {
      expect(
        answerToGrade(input({ slug: 'speak_word', score: undefined, isCorrect: true, timeMs: 100 })),
      ).toBe(5)
    })
  })

  describe('non speak_word slugs', () => {
    it('incorrect answer → 1 regardless of time', () => {
      expect(answerToGrade(input({ isCorrect: false, timeMs: 0 }))).toBe(1)
      expect(answerToGrade(input({ isCorrect: false, timeMs: 999_999 }))).toBe(1)
    })

    it('correct + timeMs = 0 → 5 (fast)', () => {
      expect(answerToGrade(input({ isCorrect: true, timeMs: 0 }))).toBe(5)
    })

    it('correct + timeMs just under FAST_THRESHOLD (4999) → 5', () => {
      expect(answerToGrade(input({ isCorrect: true, timeMs: 4999 }))).toBe(5)
    })

    it('correct + timeMs at FAST_THRESHOLD (5000) → 4', () => {
      expect(answerToGrade(input({ isCorrect: true, timeMs: 5000 }))).toBe(4)
    })

    it('correct + timeMs just under NORMAL_THRESHOLD (14999) → 4', () => {
      expect(answerToGrade(input({ isCorrect: true, timeMs: 14_999 }))).toBe(4)
    })

    it('correct + timeMs at NORMAL_THRESHOLD (15000) → 3', () => {
      expect(answerToGrade(input({ isCorrect: true, timeMs: 15_000 }))).toBe(3)
    })

    it('correct + very slow → 3', () => {
      expect(answerToGrade(input({ isCorrect: true, timeMs: 60_000 }))).toBe(3)
    })
  })

  describe('production slugs with score', () => {
    it.each(['written_production', 'spoken_production'] as const)(
      '%s maps score to SM-2 grade',
      (slug) => {
        expect(answerToGrade(input({ slug, score: 95, isCorrect: true }))).toBe(5)
        expect(answerToGrade(input({ slug, score: 30, isCorrect: false }))).toBe(1)
      },
    )
  })

  describe('score on non speak_word slug is ignored', () => {
    it('pick_word with score=10 + correct + fast → 5 (not 0)', () => {
      expect(answerToGrade(input({ slug: 'pick_word', score: 10, isCorrect: true, timeMs: 100 }))).toBe(5)
    })
  })
})
