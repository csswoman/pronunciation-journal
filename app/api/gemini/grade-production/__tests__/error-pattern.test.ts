import { describe, it, expect } from 'vitest'
import { GRADE_PRODUCTION_SYSTEM_PROMPT } from '@/lib/ai-prompts'
import { ERROR_PATTERN_IDS } from '@/lib/exercises/error-patterns'

describe('grade production prompt: error pattern', () => {
  it('asks for an errorPattern label', () => {
    expect(GRADE_PRODUCTION_SYSTEM_PROMPT).toContain('errorPattern')
  })

  it('lists every allowed pattern id so the model cannot invent one', () => {
    for (const id of ERROR_PATTERN_IDS) {
      expect(GRADE_PRODUCTION_SYSTEM_PROMPT, `missing ${id}`).toContain(id)
    }
  })

  it('declares errorPattern in the JSON shape', () => {
    expect(GRADE_PRODUCTION_SYSTEM_PROMPT).toContain('"errorPattern"')
  })
})
