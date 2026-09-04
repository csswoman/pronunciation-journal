import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordPracticeErrorRecurrence } from '../error-recurrence-sync'
import { db } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import { createEmptyState } from '@/lib/ai-practice/learning-state'

vi.mock('@/lib/db', () => ({
  db: {
    learningState: {
      get: vi.fn(),
      put: vi.fn(),
    },
  },
}))

vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: vi.fn().mockResolvedValue(undefined),
}))

describe('recordPracticeErrorRecurrence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing if no errorPattern or rehearsedPattern is provided', async () => {
    await recordPracticeErrorRecurrence('u1', undefined, undefined, true)
    expect(db.learningState.get).not.toHaveBeenCalled()
    expect(db.learningState.put).not.toHaveBeenCalled()
  })

  it('records error pattern on failure and updates learning state', async () => {
    const emptyState = createEmptyState('u1', 'client')
    vi.mocked(db.learningState.get).mockResolvedValue({
      userId: 'u1',
      state: emptyState,
      updatedAt: emptyState.updatedAt,
    })

    await recordPracticeErrorRecurrence('u1', 'tense_present_for_past', undefined, false)

    expect(db.learningState.put).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        state: expect.objectContaining({
          errorRecurrence: expect.objectContaining({
            entries: expect.arrayContaining([
              expect.objectContaining({
                patternId: 'tense_present_for_past',
                failCount: 1,
                stage: 0,
              }),
            ]),
          }),
        }),
      }),
    )

    expect(enqueue).toHaveBeenCalledWith(
      'u1',
      'user_learning_state',
      'upsert',
      expect.objectContaining({
        user_id: 'u1',
      }),
      { user_id: 'u1' },
    )
  })

  it('marks pattern as rehearsed on success', async () => {
    const emptyState = createEmptyState('u1', 'client')
    const now = Date.now()
    emptyState.errorRecurrence = {
      entries: [
        {
          patternId: 'subject_verb_agreement',
          stage: 0,
          dueAt: now - 1000,
          failCount: 1,
          lastFailedAt: now - 86_400_000,
        },
      ],
    }

    vi.mocked(db.learningState.get).mockResolvedValue({
      userId: 'u1',
      state: emptyState,
      updatedAt: emptyState.updatedAt,
    })

    await recordPracticeErrorRecurrence('u1', undefined, 'subject_verb_agreement', true)

    expect(db.learningState.put).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        state: expect.objectContaining({
          errorRecurrence: expect.objectContaining({
            entries: expect.arrayContaining([
              expect.objectContaining({
                patternId: 'subject_verb_agreement',
                stage: 1,
              }),
            ]),
          }),
        }),
      }),
    )
  })
})
