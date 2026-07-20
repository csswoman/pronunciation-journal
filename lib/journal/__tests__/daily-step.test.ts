import { describe, expect, it } from 'vitest'
import {
  buildJournalDailyStep,
  JOURNAL_STEP_CADENCE_DAYS,
  shouldOfferJournalStep,
} from '@/lib/journal/daily-step'

describe('journal daily step', () => {
  it('offers on the cadence and skips otherwise', () => {
    expect(shouldOfferJournalStep(JOURNAL_STEP_CADENCE_DAYS)).toBe(true)
    expect(shouldOfferJournalStep(JOURNAL_STEP_CADENCE_DAYS * 2)).toBe(true)
    expect(shouldOfferJournalStep(JOURNAL_STEP_CADENCE_DAYS + 1)).toBe(false)
  })

  it('builds a concept link with no evaluated exercises', () => {
    const step = buildJournalDailyStep()
    expect(step.kind).toBe('concept')
    expect(step.href).toBe('/journal')
    expect(step.exercises).toEqual([])
    expect(step.estMinutes).toBe(5)
  })
})
