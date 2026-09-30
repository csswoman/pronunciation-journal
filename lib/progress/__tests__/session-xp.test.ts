import { describe, expect, it, vi } from 'vitest'
vi.mock('@/lib/sync/sync-manager', () => ({ enqueue: vi.fn() }))
vi.mock('@/lib/courses/assessment-profile', () => ({ updateConceptSignalsWithEvidence: vi.fn() }))
import { sessionXp } from '../activity-hub'
import { buildSessionResult } from '@/lib/practice/session-result'
import type { ExerciseResult } from '@/lib/practice/types'

function answer(extra: Partial<ExerciseResult> = {}): ExerciseResult {
  return { exerciseId: 'one', slug: 'multiple_choice', exerciseTypeId: 17,
    isCorrect: false, timeMs: 100, contentId: 'one', context: 'practice', completedAt: new Date(), ...extra }
}

describe('session XP eligibility', () => {
  it('retains credit for evaluated wrong answers', () => {
    expect(sessionXp(buildSessionResult([answer({ status: 'answered' })]))).toBe(2)
  })
  it.each(['skipped', 'unscored', 'evaluator_failed'] as const)(
    'does not award XP for %s even if a stale score exists', (status) => {
      expect(sessionXp(buildSessionResult([answer({ status, score: 100, isCorrect: true })]))).toBe(0)
    },
  )
  it('does not reward a legacy skip', () => {
    expect(sessionXp(buildSessionResult([answer({ userAnswer: 'skip' })]))).toBe(0)
  })
})
