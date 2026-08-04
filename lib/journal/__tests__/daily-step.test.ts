import { describe, expect, it } from 'vitest'
import {
  buildJournalDailyStep,
  shouldOfferJournalStep,
} from '@/lib/journal/daily-step'

describe('journal daily step', () => {
  it('offers every day', () => {
    expect(shouldOfferJournalStep(0)).toBe(true)
    expect(shouldOfferJournalStep(1)).toBe(true)
    expect(shouldOfferJournalStep(100)).toBe(true)
  })

  it('builds a concept link with no evaluated exercises', () => {
    const step = buildJournalDailyStep()
    expect(step.kind).toBe('concept')
    expect(step.href).toBe('/journal')
    expect(step.title).toMatch(/diario/i)
    expect(step.exercises).toEqual([])
    expect(step.estMinutes).toBe(5)
  })
})
