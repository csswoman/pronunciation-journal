import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordPracticeErrorRecurrence, retractPracticeErrorRecurrence } from '../error-recurrence-sync'
import { db } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import { createEmptyState } from '@/lib/ai-practice/learning-state'

vi.mock('@/lib/db', () => ({
  db: {
    learningState: {
      get: vi.fn(),
      put: vi.fn(),
    },
    syncOutbox: {},
    transaction: vi.fn(
      async (_mode: string, _tables: unknown[], callback: () => Promise<unknown>) => callback(),
    ),
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

    const saved = await recordPracticeErrorRecurrence('u1', 'tense_present_for_past', undefined, false)
    expect(saved).toBe(true)

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

  it('returns false when the local learning-state write fails', async () => {
    vi.mocked(db.learningState.get).mockResolvedValue(undefined)
    vi.mocked(db.learningState.put).mockRejectedValueOnce(new Error('IndexedDB unavailable'))

    const saved = await recordPracticeErrorRecurrence('u1', 'spelling', undefined, false)

    expect(saved).toBe(false)
    expect(enqueue).not.toHaveBeenCalled()
  })

  it('keeps a locally saved recurrence when adding the remote outbox entry fails', async () => {
    const emptyState = createEmptyState('u1', 'client')
    vi.mocked(db.learningState.get).mockResolvedValue({
      userId: 'u1',
      state: emptyState,
      updatedAt: emptyState.updatedAt,
    })
    vi.mocked(enqueue).mockRejectedValueOnce(new Error('Outbox unavailable'))

    const saved = await recordPracticeErrorRecurrence('u1', 'spelling', undefined, false)

    expect(saved).toBe(true)
    expect(db.learningState.put).toHaveBeenCalled()
  })
})

describe('retractPracticeErrorRecurrence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing if patternId is undefined', async () => {
    await retractPracticeErrorRecurrence('u1', undefined)
    expect(db.learningState.get).not.toHaveBeenCalled()
    expect(db.learningState.put).not.toHaveBeenCalled()
  })

  it('retracts pattern from errorRecurrence and enqueues upsert to outbox', async () => {
    const emptyState = createEmptyState('u1', 'client')
    const now = 1700000000000
    emptyState.errorRecurrence = {
      entries: [
        {
          patternId: 'word_order',
          stage: 0,
          dueAt: now + 86400000,
          failCount: 1,
          lastFailedAt: now,
        },
      ],
    }

    vi.mocked(db.learningState.get).mockResolvedValue({
      userId: 'u1',
      state: emptyState,
      updatedAt: emptyState.updatedAt,
    })

    await retractPracticeErrorRecurrence('u1', 'word_order', now + 1000)

    expect(db.learningState.put).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        state: expect.objectContaining({
          errorRecurrence: expect.objectContaining({
            entries: [],
            removedAtByPattern: { word_order: now + 1000 },
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
    expect(db.transaction).toHaveBeenCalledWith(
      'rw',
      expect.arrayContaining([db.learningState, db.syncOutbox]),
      expect.any(Function),
    )
  })

  it('propagates outbox failure so the enclosing report transaction can roll back', async () => {
    const emptyState = createEmptyState('u1', 'client')
    vi.mocked(db.learningState.get).mockResolvedValue({
      userId: 'u1',
      state: emptyState,
      updatedAt: emptyState.updatedAt,
    })
    vi.mocked(enqueue).mockRejectedValueOnce(new Error('Outbox unavailable'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await expect(
      retractPracticeErrorRecurrence('u1', 'word_order', 1700000000000),
    ).rejects.toThrow('Outbox unavailable')

    expect(db.learningState.put).toHaveBeenCalled()
    warn.mockRestore()
  })
})
