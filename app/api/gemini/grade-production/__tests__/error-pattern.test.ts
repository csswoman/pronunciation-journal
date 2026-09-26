import { describe, it, expect } from 'vitest'
import { GRADE_PRODUCTION_SYSTEM_PROMPT } from '@/lib/ai-prompts'
import { ERROR_PATTERN_IDS } from '@/lib/exercises/error-patterns'
import { productionGradeResponseSchema } from '@/lib/exercises/production-grade-schema'
import { z } from 'zod'

describe('grade production prompt: error pattern', () => {
  it('asks for an errorPattern label', () => {
    expect(GRADE_PRODUCTION_SYSTEM_PROMPT).toContain('errorPattern')
  })

  it('lists every allowed pattern id so the model cannot invent one', () => {
    for (const id of ERROR_PATTERN_IDS) {
      expect(GRADE_PRODUCTION_SYSTEM_PROMPT, `missing ${id}`).toContain(id)
    }
  })

  it('declares errorPattern in the structured response schema', () => {
    expect(z.toJSONSchema(productionGradeResponseSchema)).toMatchObject({
      properties: { errorPattern: { type: 'string' } },
    })
  })
})
