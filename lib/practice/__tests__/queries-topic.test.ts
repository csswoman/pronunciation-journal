import { describe, it, expect, vi, beforeEach } from 'vitest'

const enqueueMock = vi.fn()
const topicSrsMock = vi.fn()

vi.mock('@/lib/sync/sync-manager', () => ({ enqueue: (...a: unknown[]) => enqueueMock(...a) }))
vi.mock('@/lib/word-bank/srs-queries', () => ({ enqueueWordBankSRSUpdate: vi.fn() }))
vi.mock('@/lib/practice/topic-srs-queries', () => ({
  enqueueTopicSRSUpdate: (...a: unknown[]) => topicSrsMock(...a),
}))
vi.mock('@/lib/db', () => ({ markLessonComplete: vi.fn() }))

import { savePracticeAnswer } from '@/lib/practice/queries'

beforeEach(() => {
  enqueueMock.mockReset()
  topicSrsMock.mockReset()
})

const base = {
  exerciseId: 'e1',
  slug: 'fill_blank' as const,
  exerciseTypeId: 5,
  isCorrect: true,
  timeMs: 1000,
  contentId: 'lesson:abc',
  context: 'courses' as const,
}

describe('savePracticeAnswer topic routing', () => {
  it('persists normalized topic and schedules topic SRS when topic present', async () => {
    await savePracticeAnswer('user-1', { ...base, topic: 'grammar:Present_Simple' })

    const insertCall = enqueueMock.mock.calls.find((c) => c[0] === 'answer_history')
    expect(insertCall?.[2]).toMatchObject({ topic: 'grammar:present simple' })
    expect(topicSrsMock).toHaveBeenCalledWith('user-1', 'grammar:present simple', expect.any(Number))
  })

  it('does not schedule topic SRS when topic absent', async () => {
    await savePracticeAnswer('user-1', { ...base })
    expect(topicSrsMock).not.toHaveBeenCalled()
    const insertCall = enqueueMock.mock.calls.find((c) => c[0] === 'answer_history')
    expect(insertCall?.[2].topic).toBeNull()
  })
})
