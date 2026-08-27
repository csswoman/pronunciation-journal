// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { gradeProduction, ProductionGradeError, PRODUCTION_AI_UNAVAILABLE_MESSAGE } from '@/lib/exercises/grade-production-client'
import type { GradeProductionInput } from '@/lib/exercises/production-grade'

const input: GradeProductionInput = {
  targetItem: 'negotiate',
  targetMeaning: 'discuss to reach an agreement',
  taskPrompt: 'Use the word in a sentence.',
  production: 'I negotiate the price.',
  modality: 'written',
}

describe('gradeProduction', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('hides provider details from failed grading responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Gemini stack trace: api key invalid' }),
      }),
    )

    await expect(gradeProduction(input)).rejects.toMatchObject({
      name: 'ProductionGradeError',
      code: 'server',
      message: PRODUCTION_AI_UNAVAILABLE_MESSAGE,
    } satisfies Partial<ProductionGradeError>)
  })

  it('keeps quota failures public and actionable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Resource exhausted: quota exceeded' }),
      }),
    )

    await expect(gradeProduction(input)).rejects.toMatchObject({
      code: 'server',
      message: expect.stringMatching(/temporarily limited/i),
    })
  })
})
