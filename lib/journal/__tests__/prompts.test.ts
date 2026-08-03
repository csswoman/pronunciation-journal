import { describe, expect, it } from 'vitest'
import { JOURNAL_PROMPTS, journalPromptForDate } from '@/lib/journal/prompts'

describe('journal prompts', () => {
  it('returns a structured, stable prompt for a date', () => {
    expect(journalPromptForDate('2026-08-03')).toEqual(JOURNAL_PROMPTS[3])
  })

  it('contains the metadata needed by writing support without appended interests', () => {
    for (const prompt of JOURNAL_PROMPTS) {
      expect(prompt).toMatchObject({
        id: expect.any(String),
        text: expect.any(String),
        target_length: expect.any(Number),
        cefr_min: expect.any(String),
      })
      expect(prompt.text).not.toContain('You can write about')
    }
  })
})
