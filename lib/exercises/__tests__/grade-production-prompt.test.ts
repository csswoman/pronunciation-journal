import { describe, it, expect } from 'vitest'
import {
  GRADE_PRODUCTION_SYSTEM_PROMPT,
  buildGradeProductionUserPrompt,
} from '@/lib/ai-prompts'
import { productionGradeResponseSchema } from '@/lib/exercises/production-grade-schema'
import { z } from 'zod'

describe('GRADE_PRODUCTION_SYSTEM_PROMPT', () => {
  it('documents constraintMet in the rubric', () => {
    expect(GRADE_PRODUCTION_SYSTEM_PROMPT).toContain('constraintMet')
  })

  it('requires constraintMet for a correct verdict', () => {
    expect(GRADE_PRODUCTION_SYSTEM_PROMPT).toMatch(/correct[\s\S]*constraintMet/)
  })

  it('declares constraintMet in the structured response schema', () => {
    expect(z.toJSONSchema(productionGradeResponseSchema)).toMatchObject({
      properties: { constraintMet: { type: 'boolean' } },
    })
  })
})

describe('buildGradeProductionUserPrompt', () => {
  it('includes the constraint check when one is supplied', () => {
    const prompt = buildGradeProductionUserPrompt({
      targetItem: 'kitchen',
      taskPrompt: 'Cuenta en PASADO algo que hiciste con "kitchen".',
      production: 'I cleaned the kitchen yesterday.',
      modality: 'spoken',
      level: 'B1',
      constraintCheck: 'The response must contain at least one past simple verb.',
    })
    expect(prompt).toContain('past simple verb')
    expect(prompt).toContain('Required constraint')
  })

  it('omits the constraint block when absent', () => {
    const prompt = buildGradeProductionUserPrompt({
      targetItem: 'kitchen',
      taskPrompt: 'Use kitchen in a sentence.',
      production: 'I have a kitchen.',
      modality: 'written',
    })
    expect(prompt).not.toContain('Required constraint')
  })
})
