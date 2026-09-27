// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isDailyStepAlreadyRecorded, recordActivitySession } from '@/lib/progress/activity-hub'
import { buildSessionResult } from '@/lib/practice/session-result'
import type { ExerciseResult } from '@/lib/practice/types'

const { enqueueMock } = vi.hoisted(() => ({ enqueueMock: vi.fn() }))

vi.mock('@/lib/sync/sync-manager', () => ({ enqueue: enqueueMock }))
vi.mock('@/lib/courses/assessment-profile', () => ({
  updateConceptSignalsWithEvidence: vi.fn().mockResolvedValue({}),
}))

const answer: ExerciseResult = {
  exerciseId: 'ex-1', slug: 'multiple_choice', exerciseTypeId: 17, isCorrect: true, timeMs: 900,
  contentId: 'ex-1', context: 'daily', status: 'answered', completedAt: new Date('2026-09-27T12:00:00Z'),
}

beforeEach(() => {
  window.localStorage.clear()
  enqueueMock.mockClear().mockResolvedValue(1)
})

describe('daily checklist vs real session (plan 050)', () => {
  it('a Daily session reconciles its exact step, so the manual row is redundant', async () => {
    await recordActivitySession('user-1', {
      practiceContext: 'daily',
      sessionResult: buildSessionResult([answer]),
      activitySessionId: 'daily-session-1',
      explicitReconciledStepIds: ['grammar_focus:3'],
    })

    expect(enqueueMock).toHaveBeenCalledWith(
      'user-1', 'activity_sessions', 'upsert',
      expect.objectContaining({ id: 'daily-session-1', reconciled_step_ids: ['grammar_focus:3'] }),
      undefined, 'id',
    )
    expect(isDailyStepAlreadyRecorded('user-1', 'grammar_focus:3')).toBe(true)
  })

  it('a manual-only step (no session) still needs its checklist row', () => {
    expect(isDailyStepAlreadyRecorded('user-1', 'word_intro:1')).toBe(false)
  })

  it('a Daily session without a step id reconciles nothing', async () => {
    await recordActivitySession('user-1', {
      practiceContext: 'daily',
      sessionResult: buildSessionResult([answer]),
    })

    expect(isDailyStepAlreadyRecorded('user-1', 'grammar_focus:3')).toBe(false)
  })
})
