import { describe, it, expect } from 'vitest'
import { buildWordReviewStep } from '@/lib/practice/daily-plan/step-builders'
import { SPOKEN_PRODUCTION_PER_SESSION } from '@/lib/practice/daily-plan/constants'
import { constraintsForLevel } from '@/lib/exercises/speech-constraints'
import { makeWordBankEntry } from '@/lib/exercises/__tests__/fixtures/word-bank-entry'

function spokenConstraintIds(step: ReturnType<typeof buildWordReviewStep>): string[] {
  return step!.exercises
    .filter((ex) => ex.payload.kind === 'generic' && ex.payload.data.type === 'spoken_production')
    .map((ex) => {
      const data = ex.payload.kind === 'generic' ? ex.payload.data : null
      return data && data.type === 'spoken_production' ? (data.constraint?.id ?? '') : ''
    })
}

const words = Array.from({ length: 6 }, (_, i) =>
  makeWordBankEntry({ id: `w${i}`, text: `word${i}` }),
)

describe('daily word review respects the learner level', () => {
  it('keeps every spoken constraint within reach of an A1 learner', () => {
    const step = buildWordReviewStep(words, 'daily', undefined, undefined, 'a1')
    const allowed = new Set<string>(constraintsForLevel('A1').map((c) => c.id))

    const ids = spokenConstraintIds(step)
    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) {
      expect(allowed.has(id)).toBe(true)
    }
  })

  it('drops the forced Rodeo slot for A1 but keeps it for B2', () => {
    const a1 = spokenConstraintIds(buildWordReviewStep(words, 'daily', undefined, undefined, 'a1'))
    const b2 = spokenConstraintIds(buildWordReviewStep(words, 'daily', undefined, undefined, 'b2'))

    expect(a1).not.toContain('rodeo_circumlocution')
    expect(b2).toContain('rodeo_circumlocution')
  })

  it('still fills the session volume for A1 by cycling the smaller constraint set', () => {
    const ids = spokenConstraintIds(buildWordReviewStep(words, 'daily', undefined, undefined, 'a1'))
    expect(ids).toHaveLength(SPOKEN_PRODUCTION_PER_SESSION)
  })

  it('leaves behaviour unchanged when no level is known', () => {
    const withoutLevel = spokenConstraintIds(buildWordReviewStep(words))
    expect(withoutLevel).toContain('rodeo_circumlocution')
  })
})
