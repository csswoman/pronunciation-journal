import { describe, expect, it } from 'vitest'
import {
  computeFluencyScores,
  fluencyComparisonLabel,
  type FluencyRawAnswer,
} from '@/lib/progress/fluency-scores'

const emptyWords = { new: 0, learning: 0, review: 0, mastered: 0 }

const baseInput = {
  wordsByStatus: emptyWords,
  contrastCorrect: 0,
  contrastTotal: 0,
  core1000Practiced: 0,
  lessonsCompleted: 0,
}

function answer(
  partial: Partial<FluencyRawAnswer> & Pick<FluencyRawAnswer, 'exerciseTypeId'>,
): FluencyRawAnswer {
  return {
    context: partial.context ?? 'sound_lab',
    isCorrect: partial.isCorrect ?? true,
    grade: partial.grade ?? null,
    ...partial,
  }
}

describe('computeFluencyScores', () => {
  it('returns zeros when there is no data', () => {
    const scores = computeFluencyScores({ ...baseInput, answers: [] })
    expect(scores.pronunciation).toBe(0)
    expect(scores.vocabulary).toBe(0)
  })

  it('scores pronunciation from phoneme answers', () => {
    const answers = Array.from({ length: 10 }, () =>
      answer({ exerciseTypeId: 3, context: 'sound_lab', isCorrect: true }),
    )
    const scores = computeFluencyScores({ ...baseInput, answers })
    expect(scores.pronunciation).toBeGreaterThan(0)
    expect(scores.listening).toBeGreaterThan(0)
  })

  it('scores vocabulary from essential-words context', () => {
    const answers = Array.from({ length: 8 }, () =>
      answer({ exerciseTypeId: 10, context: 'essential-words', exercisePayload: { mode: 'speak_sentence' }, isCorrect: true }),
    )
    const scores = computeFluencyScores({
      ...baseInput,
      answers,
      core1000Practiced: 12,
    })
    expect(scores.vocabulary).toBeGreaterThan(50)
    expect(scores.speaking).toBeGreaterThan(0)
  })

  it('uses word bank retention for vocabulary', () => {
    const scores = computeFluencyScores({
      ...baseInput,
      answers: [answer({ exerciseTypeId: 5, context: 'practice' })],
      wordsByStatus: { new: 2, learning: 3, review: 5, mastered: 10 },
    })
    expect(scores.vocabulary).toBeGreaterThan(0)
  })

  it('does not turn lesson completion into grammar or reading evidence', () => {
    const scores = computeFluencyScores({ ...baseInput, answers: [], lessonsCompleted: 10 })
    expect(scores.grammar).toBe(0)
    expect(scores.reading).toBe(0)
  })

  it('uses the canonical ids for modern exercise types', () => {
    const scores = computeFluencyScores({
      ...baseInput,
      answers: [19, 20, 21, 22, 23].map((exerciseTypeId) => answer({ exerciseTypeId, context: 'practice' })),
    })
    expect(scores.grammar).toBeGreaterThan(0)
    expect(scores.vocabulary).toBeGreaterThan(0)
    expect(scores.speaking).toBeGreaterThan(0)
  })

  it('does not infer reading from course context alone', () => {
    const scores = computeFluencyScores({
      ...baseInput,
      answers: [answer({ exerciseTypeId: 10, context: 'courses' })],
    })
    expect(scores.reading).toBe(0)
  })
})

describe('fluencyComparisonLabel', () => {
  it('detects improvement', () => {
    const prev = {
      pronunciation: 20,
      grammar: 20,
      vocabulary: 20,
      listening: 20,
      speaking: 20,
      reading: 20,
    }
    const cur = { ...prev, pronunciation: 50, vocabulary: 50 }
    expect(fluencyComparisonLabel(cur, prev)).toBe('Improving this week')
  })
})
