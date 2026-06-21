import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  enqueueMock,
  isLessonCompleteMock,
  markLessonCompleteMock,
  markLessonIncompleteMock,
} = vi.hoisted(() => ({
  enqueueMock: vi.fn(async () => 1),
  isLessonCompleteMock: vi.fn(),
  markLessonCompleteMock: vi.fn(async () => undefined),
  markLessonIncompleteMock: vi.fn(async () => undefined),
}))

vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: enqueueMock,
}))
vi.mock('@/lib/db', () => ({
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

    expect(markLessonCompleteMock).not.toHaveBeenCalled()
    expect(enqueueMock).not.toHaveBeenCalled()
  })

  it('removes local and remote completion when unmarked', async () => {
    await recordLessonIncomplete('a1', 'lesson-1')

    expect(markLessonIncompleteMock).toHaveBeenCalledWith('a1', 'lesson-1')
    expect(enqueueMock).toHaveBeenCalledWith(
      'answer_history',
      'delete',
      {},
      {
        user_id: 'user-1',
        context: 'courses',
        content_id: 'a1:lesson-1',
      },
    )
  })
})
