import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  enqueueMock,
  isLessonCompleteMock,
  markLessonCompleteMock,
  markLessonIncompleteMock,
  transactionMock,
} = vi.hoisted(() => ({
  enqueueMock: vi.fn(async () => 1),
  isLessonCompleteMock: vi.fn(),
  markLessonCompleteMock: vi.fn(async () => undefined),
  markLessonIncompleteMock: vi.fn(async () => undefined),
  transactionMock: vi.fn(async (_mode: string, _tables: unknown[], callback: () => Promise<void>) => callback()),
}))

vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: enqueueMock,
}))
vi.mock('@/lib/db', () => ({
  db: { completedLessons: {}, syncOutbox: {}, transaction: transactionMock },
  isLessonComplete: isLessonCompleteMock,
  markLessonComplete: markLessonCompleteMock,
  markLessonIncomplete: markLessonIncompleteMock,
}))
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
  }),
}))
vi.mock('@/lib/word-bank/srs-queries', () => ({ enqueueWordBankSRSUpdate: vi.fn() }))
vi.mock('@/lib/practice/topic-srs-queries', () => ({ enqueueTopicSRSUpdate: vi.fn() }))
vi.mock('@/lib/practice/fragment-srs', () => ({ upsertFragmentSrs: vi.fn() }))

import {
  recordLessonComplete,
  recordLessonIncomplete,
} from '@/lib/practice/queries'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('course lesson completion', () => {
  it('does not duplicate an already completed lesson', async () => {
    isLessonCompleteMock.mockResolvedValue(true)

    await recordLessonComplete('a1', 'lesson-1')

    expect(isLessonCompleteMock).toHaveBeenCalledWith('user-1', 'a1', 'lesson-1')
    expect(markLessonCompleteMock).not.toHaveBeenCalled()
    expect(enqueueMock).not.toHaveBeenCalled()
  })

  it('records completion without creating a synthetic answer', async () => {
    isLessonCompleteMock.mockResolvedValue(false)

    await recordLessonComplete('a1', 'lesson-1')

    expect(markLessonCompleteMock).toHaveBeenCalledWith('user-1', 'a1', 'lesson-1')
    expect(transactionMock).toHaveBeenCalledWith('rw', expect.any(Array), expect.any(Function))
    expect(enqueueMock).toHaveBeenCalledWith(
      'user-1',
      'lesson_completions',
      'upsert',
      expect.objectContaining({
        user_id: 'user-1',
        course_slug: 'a1',
        lesson_slug: 'lesson-1',
      }),
      undefined,
      'user_id,course_slug,lesson_slug',
    )
    expect(enqueueMock).not.toHaveBeenCalledWith(
      'user-1',
      'answer_history',
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    )
  })

  it('removes local and remote completion when unmarked', async () => {
    await recordLessonIncomplete('a1', 'lesson-1')

    expect(markLessonIncompleteMock).toHaveBeenCalledWith('user-1', 'a1', 'lesson-1')
    expect(transactionMock).toHaveBeenCalledWith('rw', expect.any(Array), expect.any(Function))
    expect(enqueueMock).toHaveBeenCalledWith(
      'user-1',
      'lesson_completions',
      'delete',
      {},
      {
        user_id: 'user-1',
        course_slug: 'a1',
        lesson_slug: 'lesson-1',
      },
    )
  })
})
