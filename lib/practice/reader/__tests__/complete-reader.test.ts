import { beforeEach, describe, expect, it, vi } from 'vitest'

const { savePracticeAnswer, recordActivitySession, flushOutbox } = vi.hoisted(() => ({
  savePracticeAnswer: vi.fn(),
  recordActivitySession: vi.fn(),
  flushOutbox: vi.fn(),
}))

vi.mock('@/lib/practice/queries', () => ({ savePracticeAnswer }))
vi.mock('@/lib/progress/activity-hub', () => ({ recordActivitySession }))
vi.mock('@/lib/sync/sync-manager', () => ({ flushOutbox }))

import { completeReader } from '../complete-reader'

describe('completeReader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(['practice', 'daily'] as const)('persists the %s completion in order', async (context) => {
    const calls: string[] = []
    savePracticeAnswer.mockImplementation(async () => { calls.push('answer') })
    recordActivitySession.mockImplementation(async () => { calls.push('activity') })
    flushOutbox.mockImplementation(async () => { calls.push('outbox') })

    await completeReader({ userId: 'u1', passageId: 'p1', correct: true, context })

    expect(calls).toEqual(['answer', 'activity', 'outbox'])
    const result = savePracticeAnswer.mock.calls[0][1]
    expect(result).toMatchObject({
      exerciseId: 'reader:p1',
      slug: 'multiple_choice',
      exerciseTypeId: 17,
      isCorrect: true,
      timeMs: 0,
      contentId: 'p1',
      context,
    })
    expect(result.completedAt).toBeInstanceOf(Date)
    expect(recordActivitySession).toHaveBeenCalledWith('u1', {
      practiceContext: context,
      source: 'practice',
      sessionResult: expect.objectContaining({ results: [result] }),
    })
  })

  it('propagates a persistence failure without running later effects', async () => {
    const error = new Error('save failed')
    savePracticeAnswer.mockRejectedValueOnce(error)

    await expect(
      completeReader({ userId: 'u1', passageId: 'p1', correct: false, context: 'practice' }),
    ).rejects.toThrow(error)
    expect(recordActivitySession).not.toHaveBeenCalled()
    expect(flushOutbox).not.toHaveBeenCalled()
  })
})
