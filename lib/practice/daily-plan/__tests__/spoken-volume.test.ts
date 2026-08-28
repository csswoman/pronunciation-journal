import { describe, it, expect } from 'vitest'
import { buildWordReviewStep } from '@/lib/practice/daily-plan/step-builders'
import {
  SPOKEN_PRODUCTION_PER_SESSION,
  WORD_REVIEW_WORD_COUNT,
} from '@/lib/practice/daily-plan/constants'
import { makeWordBankEntry } from '@/lib/exercises/__tests__/fixtures/word-bank-entry'

function countSpoken(step: ReturnType<typeof buildWordReviewStep>): number {
  return step!.exercises.filter(
    (ex) => ex.payload.kind === 'generic' && ex.payload.data.type === 'spoken_production',
  ).length
}

describe('spoken production volume', () => {
  it('generates SPOKEN_PRODUCTION_PER_SESSION spoken items when enough words are available', () => {
    const words = Array.from({ length: 20 }, (_, i) =>
      makeWordBankEntry({ id: `w${i}`, text: `word${i}` }),
    )
    const step = buildWordReviewStep(words)
    expect(step).not.toBeNull()
    // 20 eligible words exceeds the cap, so the count should hit it exactly —
    // a weaker bound wouldn't catch a regression back to a low hardcoded value.
    expect(countSpoken(step)).toBe(SPOKEN_PRODUCTION_PER_SESSION)
  })

  it('still generates SPOKEN_PRODUCTION_PER_SESSION spoken items with only the realistic word_review pool size', () => {
    // This is the regression case: buildWordReviewStep's real callers cap the
    // word pool at WORD_REVIEW_WORD_COUNT (6) before it ever reaches spoken
    // production, so the generator must repeat words across constraints to
    // still reach the full session volume target.
    const words = Array.from({ length: WORD_REVIEW_WORD_COUNT }, (_, i) =>
      makeWordBankEntry({ id: `w${i}`, text: `word${i}` }),
    )
    const step = buildWordReviewStep(words)
    expect(step).not.toBeNull()
    expect(countSpoken(step)).toBe(SPOKEN_PRODUCTION_PER_SESSION)
  })
})
