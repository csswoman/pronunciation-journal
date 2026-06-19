import { describe, it, expect, vi, beforeEach } from 'vitest'

const enqueueMock = vi.fn()
const topicSrsMock = vi.fn()
const wordBankSrsMock = vi.fn()
const fragmentSrsMock = vi.fn()

vi.mock('@/lib/sync/sync-manager', () => ({ enqueue: (...a: unknown[]) => enqueueMock(...a) }))
vi.mock('@/lib/word-bank/srs-queries', () => ({
  enqueueWordBankSRSUpdate: (...a: unknown[]) => wordBankSrsMock(...a),
}))
vi.mock('@/lib/practice/topic-srs-queries', () => ({
  enqueueTopicSRSUpdate: (...a: unknown[]) => topicSrsMock(...a),
}))
vi.mock('@/lib/practice/fragment-srs', () => ({
  upsertFragmentSrs: (...a: unknown[]) => fragmentSrsMock(...a),
}))
vi.mock('@/lib/db', () => ({ markLessonComplete: vi.fn() }))

import { savePracticeAnswer } from '@/lib/practice/queries'

beforeEach(() => {
  enqueueMock.mockReset()
  topicSrsMock.mockReset()
  wordBankSrsMock.mockReset()
  fragmentSrsMock.mockReset()
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

describe('savePracticeAnswer source SRS routing', () => {
  it('schedules fragment SRS for text_fragments-sourced answers', async () => {
    await savePracticeAnswer('user-1', {
      ...base,
      sourceRef: { source: 'text_fragments', id: 'frag-9' },
    })

    expect(fragmentSrsMock).toHaveBeenCalledWith('frag-9', expect.any(Number))
    expect(wordBankSrsMock).not.toHaveBeenCalled()
  })

  it('schedules word_bank SRS (not fragment) for word_bank-sourced answers', async () => {
    await savePracticeAnswer('user-1', {
      ...base,
      sourceRef: { source: 'word_bank', id: 'wb-3' },
    })

    expect(wordBankSrsMock).toHaveBeenCalledWith('user-1', 'wb-3', expect.any(Number))
    expect(fragmentSrsMock).not.toHaveBeenCalled()
  })

  it('schedules no source SRS when sourceRef is absent', async () => {
    await savePracticeAnswer('user-1', { ...base })
    expect(fragmentSrsMock).not.toHaveBeenCalled()
    expect(wordBankSrsMock).not.toHaveBeenCalled()
  })
})
