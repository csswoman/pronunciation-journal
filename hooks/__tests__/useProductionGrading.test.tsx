// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AI_GRADES_SPENT_MESSAGE, REPEATED_ATTEMPT_MESSAGE } from '@/lib/exercises/grading-attempts'
import type { GradeProductionInput, ProductionGradeResult } from '@/lib/exercises/production-grade'

const gradingMocks = vi.hoisted(() => ({ gradeProduction: vi.fn() }))

vi.mock('@/components/auth/AuthProvider', () => ({ useAuthOptional: () => null }))
vi.mock('@/lib/exercises/grade-production-client', () => ({
  gradeProduction: gradingMocks.gradeProduction,
  isOnline: () => navigator.onLine,
  ProductionGradeError: class ProductionGradeError extends Error {
    constructor(message: string, readonly code?: string) {
      super(message)
      this.name = 'ProductionGradeError'
    }
  },
}))

import { useProductionGrading } from '@/hooks/useProductionGrading'

const aiResult: ProductionGradeResult = {
  correct: false, usedTarget: true, grammaticallyCorrect: false, constraintMet: true,
  feedback: 'Check the tense.', score: 55,
}

function input(production: string): GradeProductionInput {
  return { targetItem: 'park', taskPrompt: 'Write a sentence', production, modality: 'written' }
}

function setup() {
  return renderHook(() => useProductionGrading({ exerciseKey: 'exercise-1' }))
}

describe('useProductionGrading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    gradingMocks.gradeProduction.mockResolvedValue(aiResult)
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('grades the same text once and serves the cached result afterwards', async () => {
    const { result } = setup()
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await act(async () => {
        await result.current.grade(input('I go to the park every morning'))
      })
    }
    expect(gradingMocks.gradeProduction).toHaveBeenCalledTimes(1)
    expect(result.current.aiGrades).toBe(1)
    expect(result.current.error).toBeNull()
  })

  it('answers a barely edited retry locally', async () => {
    const { result } = setup()
    await act(async () => {
      await result.current.grade(input('I go to the park every morning'))
    })
    let second: ProductionGradeResult | null = aiResult
    await act(async () => {
      second = await result.current.grade(input('I go to the parks every morning'))
    })
    expect(second).toBeNull()
    expect(result.current.error).toBe(REPEATED_ATTEMPT_MESSAGE)
    expect(gradingMocks.gradeProduction).toHaveBeenCalledTimes(1)
  })

  it('spends at most two AI calls per exercise and then asks for self-assessment', async () => {
    const { result } = setup()
    const attempts = [
      'I go to the park every morning',
      'She visited her grandmother yesterday',
      'They will travel to Berlin next summer',
      'We were watching a documentary about whales',
    ]
    for (const production of attempts) {
      await act(async () => {
        await result.current.grade(input(production))
      })
    }
    expect(gradingMocks.gradeProduction).toHaveBeenCalledTimes(2)
    expect(result.current.aiBudgetSpent).toBe(true)
    expect(result.current.error).toBe(AI_GRADES_SPENT_MESSAGE)
  })

  it('keeps the AI out of it when offline and reports the exercise message', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const { result } = renderHook(() =>
      useProductionGrading({ exerciseKey: 'exercise-1', offlineMessage: 'Sin conexión. Referencia: X.' }),
    )
    await act(async () => {
      await result.current.grade(input('I go to the park every morning'))
    })
    expect(gradingMocks.gradeProduction).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Sin conexión. Referencia: X.')
    expect(result.current.aiGrades).toBe(0)
  })

  it('accepts a declared answer without any request, even offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const { result } = renderHook(() =>
      useProductionGrading({
        exerciseKey: 'exercise-1',
        acceptedAnswers: ['I go to the park every morning.'],
        fixedReference: true,
      }),
    )
    let graded: ProductionGradeResult | null = null
    await act(async () => {
      graded = await result.current.grade(input('i go to the park every morning'))
    })
    expect(graded).toMatchObject({ correct: true, score: 100 })
    expect(gradingMocks.gradeProduction).not.toHaveBeenCalled()
  })
})
