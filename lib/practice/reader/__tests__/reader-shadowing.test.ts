import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordReaderShadowingAttempt } from '../reader-shadowing'
import { enqueue } from '@/lib/sync/sync-manager'
import { recordActivitySession } from '@/lib/progress/activity-hub'

vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/progress/activity-hub', () => ({
  recordActivitySession: vi.fn().mockResolvedValue(undefined),
}))

describe('recordReaderShadowingAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists oral shadowing attempt to answer_history and activity_sessions', async () => {
    await recordReaderShadowingAttempt('user-123', {
      passageId: 'passage-01',
      sentenceText: 'She walks to the park every morning.',
      accuracy: 85,
      transcript: 'She walks to the park every morning.',
      timeMs: 3200,
    })

    expect(enqueue).toHaveBeenCalledTimes(1)
    const [userId, table, op, row] = vi.mocked(enqueue).mock.calls[0]
    expect(userId).toBe('user-123')
    expect(table).toBe('answer_history')
    expect(op).toBe('upsert')
    expect(row).toMatchObject({
      user_id: 'user-123',
      exercise_type_id: 16,
      is_correct: true,
      score: 85,
      target_word: 'She walks to the park every morning.',
      user_answer: 'She walks to the park every morning.',
      time_ms: 3200,
      context: 'practice',
      topic: 'shadowing',
    })

    expect(recordActivitySession).toHaveBeenCalledTimes(1)
    expect(recordActivitySession).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({
        practiceContext: 'practice',
        source: 'practice',
        sessionResult: expect.objectContaining({
          accuracy: 85,
          totalTimeMs: 3200,
        }),
      }),
    )
  })

  it('marks is_correct as false when accuracy is below 70', async () => {
    await recordReaderShadowingAttempt('user-123', {
      passageId: 'passage-02',
      sentenceText: 'They arrived late.',
      accuracy: 50,
      transcript: 'They arrive late.',
      timeMs: 2500,
    })

    const [, , , row] = vi.mocked(enqueue).mock.calls[0]
    expect(row).toMatchObject({
      is_correct: false,
      score: 50,
    })
  })
})
