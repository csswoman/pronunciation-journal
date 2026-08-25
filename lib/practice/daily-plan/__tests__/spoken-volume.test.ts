import { describe, it, expect } from 'vitest'
import { buildWordReviewStep } from '@/lib/practice/daily-plan/step-builders'
import { SPOKEN_PRODUCTION_PER_SESSION } from '@/lib/practice/daily-plan/constants'
import { makeWordBankEntry } from '@/lib/exercises/__tests__/fixtures/word-bank-entry'

describe('spoken production volume', () => {
  it('generates up to SPOKEN_PRODUCTION_PER_SESSION spoken items when enough words are available', () => {
    const words = Array.from({ length: 20 }, (_, i) =>
      makeWordBankEntry({ id: `w${i}`, text: `word${i}` }),
    )
    const step = buildWordReviewStep(words)
    expect(step).not.toBeNull()
    const spokenCount = step!.exercises.filter(
      (ex) => ex.payload.kind === 'generic' && ex.payload.data.type === 'spoken_production',
    ).length
    expect(spokenCount).toBeGreaterThan(1)
    expect(spokenCount).toBeLessThanOrEqual(SPOKEN_PRODUCTION_PER_SESSION)
  })
})
