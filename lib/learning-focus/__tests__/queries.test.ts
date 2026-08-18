import { beforeEach, describe, expect, it, vi } from 'vitest'

const persistMock = vi.fn()
const getStateMock = vi.fn()

vi.mock('@/lib/ai-practice/queries', () => ({
  persistLearningState: (...args: unknown[]) => persistMock(...args),
}))

vi.mock('@/lib/ai-practice/load-state', () => ({
  getUserLearningState: (...args: unknown[]) => getStateMock(...args),
}))

vi.mock('@/lib/db', () => ({
  db: { learningState: { get: vi.fn() } },
  ensureDbReady: vi.fn().mockResolvedValue(undefined),
}))

import { db } from '@/lib/db'
import { pinFocus, claimTheoryTopics, refreshSuggestedFocus } from '../queries'

describe('learning-focus queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getStateMock.mockResolvedValue({
      userId: 'u1',
      updatedAt: '2026-08-12T00:00:00.000Z',
      deviceId: 'd1',
      level: { cefrEstimate: 'A1', confidence: 0.5 },
      vocabulary: { knownCount: 0, strugglingWords: [], savedWords: [] },
      grammar: { weakTopics: [] },
      theory: { concepts: [] },
      pronunciation: { averageAccuracy: 0, strugglingSounds: [] },
      lastSessions: [],
      focus: null,
    })
    ;(db.learningState.get as ReturnType<typeof vi.fn>).mockResolvedValue(null)
  })

  it('pinFocus sets pinned override without wiping suggested', async () => {
    const focus = await pinFocus('u1', {
      level: 'b1',
      thread: { kind: 'theory', topicId: 'articles-a-an-the' },
    })
    expect(focus.pinned).toBe(true)
    expect(focus.level).toBe('b1')
    expect(persistMock).toHaveBeenCalled()
    const saved = persistMock.mock.calls[0][1]
    expect(saved.focus.pinned).toBe(true)
    expect(saved.focus.source).toBe('manual')
  })

  it('refreshSuggestedFocus skips persist when suggested is unchanged', async () => {
    const existingFocus = {
      level: 'a1' as const,
      thread: null,
      pinned: false,
      suggested: { level: 'a1' as const, thread: null, source: 'profile' as const },
      source: 'profile' as const,
      updatedAt: '2026-08-12T00:00:00.000Z',
    }
    ;(db.learningState.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'u1',
      updatedAt: '2026-08-12T00:00:00.000Z',
      state: {
        userId: 'u1',
        updatedAt: '2026-08-12T00:00:00.000Z',
        deviceId: 'd1',
        level: { cefrEstimate: 'A1', confidence: 0.5 },
        vocabulary: { knownCount: 0, strugglingWords: [], savedWords: [] },
        grammar: { weakTopics: [] },
        theory: { concepts: [] },
        pronunciation: { averageAccuracy: 0, strugglingSounds: [] },
        lastSessions: [],
        focus: existingFocus,
      },
    })

    const result = await refreshSuggestedFocus('u1', {
      profileLevel: 'A1',
      routeLevel: null,
      recentTheoryLessonSlug: null,
      weakSoundKey: null,
    })

    expect(persistMock).not.toHaveBeenCalled()
    expect(result).toEqual(existingFocus)
  })

  it('claimTheoryTopics writes review signals that are not mastered', async () => {
    await claimTheoryTopics('u1', [
      { lessonSlug: 'articles-a-an-the', level: 'a1', title: 'Artículos' },
    ])
    const saved = persistMock.mock.calls.at(-1)?.[1]
    const signal = saved.theory.concepts.find(
      (c: { lessonSlug: string }) => c.lessonSlug === 'articles-a-an-the',
    )
    expect(signal.status).toBe('review')
    expect(signal.verificationDueAt).toBeTruthy()
  })
})
