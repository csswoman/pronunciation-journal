import { describe, expect, it } from 'vitest'
import { limitJournalCorrectionErrors, type JournalCorrectionResult } from '../correction'

const correction: JournalCorrectionResult = {
  correctedContent: 'I went to the park.',
  errors: Array.from({ length: 8 }, (_, index) => ({
    quote: `error ${index}`,
    correction: `fix ${index}`,
    type: 'grammar',
    explanationEs: `Corrección ${index}`,
    topic: 'grammar:past simple',
  })),
  newWords: ['park'],
}

describe('journal correction error limits', () => {
  it.each([
    ['A1', 3], ['A2', 3], ['B1', 5], ['B2', 8], ['C1', 8], ['C2', 8],
  ] as const)('persists at most %s-level priority errors', (level, count) => {
    const limited = limitJournalCorrectionErrors(correction, level)

    expect(limited.errors).toHaveLength(count)
    expect(limited.errors).toEqual(correction.errors.slice(0, count))
    expect(limited.correctedContent).toBe(correction.correctedContent)
    expect(limited.newWords).toBe(correction.newWords)
  })
})
