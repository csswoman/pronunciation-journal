import { describe, expect, it } from 'vitest'
import { makeWordBankEntry } from '@/lib/exercises/__tests__/fixtures/word-bank-entry'
import { buildWordReviewStep } from '@/lib/practice/daily-plan/step-builders'
import { constraintIdsForDuePatterns } from '@/lib/practice/daily-plan/composer'
import { EMPTY_RECURRENCE_QUEUE, recordErrorPattern } from '@/lib/practice/error-recurrence'

const T0 = new Date('2026-08-24T10:00:00.000Z').getTime()
const DAY = 86_400_000
const words = Array.from({ length: 6 }, (_, index) =>
  makeWordBankEntry({ id: `repair-word-${index}`, text: `word${index}` }),
)

function spokenConstraintIds(step: ReturnType<typeof buildWordReviewStep>): string[] {
  return (step?.exercises ?? [])
    .filter((exercise) => exercise.slug === 'spoken_production')
    .map((exercise) => (exercise.payload as { kind: 'generic'; data: { constraintId?: string } }).data.constraintId ?? '')
}

describe('daily word review repair constraints', () => {
  it('prioritizes the due journal repair in spoken production', () => {
    const queue = recordErrorPattern(EMPTY_RECURRENCE_QUEUE, 'tense_present_for_past', T0)
    const repairConstraints = constraintIdsForDuePatterns(queue, T0 + 2 * DAY)

    const step = buildWordReviewStep(words, 'daily', undefined, undefined, 'a2', repairConstraints)

    expect(repairConstraints).toContain('past_simple_narrative')
    expect(spokenConstraintIds(step)[0]).toBe('past_simple_narrative')
  })

  it('keeps the default spoken constraints when no journal repair is due', () => {
    const step = buildWordReviewStep(words, 'daily', undefined, undefined, 'b2', [])
    const constraints = spokenConstraintIds(step)

    expect(constraints).toContain('rodeo_circumlocution')
    expect(constraints).toContain('spoken_verb_transform')
  })
})
