import { beforeEach, describe, expect, it, vi } from 'vitest'
import { gradeWithLocalFirst, matchesAcceptedAnswer, normalizeAcceptedAnswer } from '../grading-pipeline'
import type { ProductionGradeResult } from '../production-grade'

const aiResult: ProductionGradeResult = {
  correct: true, usedTarget: true, grammaticallyCorrect: true, constraintMet: true,
  feedback: 'Good', score: 95,
}

const gradeProduction = vi.fn(async () => aiResult)
const isAccepted = vi.fn(async () => false)
const getCached = vi.fn(async () => undefined as ProductionGradeResult | undefined)
const save = vi.fn(async () => undefined)
const deps = { gradeProduction, isAccepted, getCached, save }

function input(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'u1', exerciseKey: 'exercise-1', acceptedAnswers: ['I do not work today.'],
    fixedReference: true,
    gradeInput: {
      targetItem: 'work', taskPrompt: 'Write a sentence',
      production: "I don't work today!", modality: 'written' as const,
    },
    ...overrides,
  }
}

describe('gradeWithLocalFirst', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes punctuation and expanded contractions', () => {
    expect(normalizeAcceptedAnswer("  I DON’T work today! ")).toBe('i do not work today')
    expect(matchesAcceptedAnswer("I don't work today.", ['I do not work today'])).toBe(true)
  })

  it('rejects empty or one-word responses without AI', async () => {
    const result = await gradeWithLocalFirst(input({
      gradeInput: { ...input().gradeInput, production: 'Hello' },
    }), deps)
    expect(result.correct).toBe(false)
    expect(result.feedback).toContain('dos palabras')
    expect(gradeProduction).not.toHaveBeenCalled()
  })

  it('rejects an unchanged transformation without AI', async () => {
    const result = await gradeWithLocalFirst(input({ sourceSentence: "I don't work today" }), deps)
    expect(result.feedback).toBe('No transformaste la oración.')
    expect(gradeProduction).not.toHaveBeenCalled()
  })

  it('accepts a reference answer without AI', async () => {
    const result = await gradeWithLocalFirst(input(), deps)
    expect(result).toMatchObject({ correct: true, score: 100 })
    expect(gradeProduction).not.toHaveBeenCalled()
  })

  it('returns a cached grade without AI', async () => {
    const cached = { ...aiResult, correct: false, score: 40 }
    getCached.mockResolvedValueOnce(cached)
    const result = await gradeWithLocalFirst(input({
      acceptedAnswers: [], gradeInput: { ...input().gradeInput, production: 'I worked late yesterday' },
    }), deps)
    expect(result).toEqual(cached)
    expect(gradeProduction).not.toHaveBeenCalled()
  })

  it('accepts an answer learned by the per-user answer bank without AI', async () => {
    isAccepted.mockResolvedValueOnce(true)
    const result = await gradeWithLocalFirst(input({
      acceptedAnswers: [], gradeInput: { ...input().gradeInput, production: 'I worked late yesterday' },
    }), deps)
    expect(result).toMatchObject({ correct: true, score: 100 })
    expect(gradeProduction).not.toHaveBeenCalled()
    expect(getCached).not.toHaveBeenCalled()
  })

  it('calls AI only after local and cache misses, then stores the result', async () => {
    const result = await gradeWithLocalFirst(input({
      acceptedAnswers: [], gradeInput: { ...input().gradeInput, production: 'I worked late yesterday' },
    }), deps)
    expect(result).toEqual(aiResult)
    expect(gradeProduction).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1', exerciseKey: 'exercise-1', normalized: 'i worked late yesterday', accepted: 1,
    }))
  })
})
