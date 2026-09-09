import { describe, it, expect, vi, beforeEach } from 'vitest'

const savePracticeAnswerMock = vi.fn().mockResolvedValue(undefined)
const recordActivitySessionMock = vi.fn().mockResolvedValue({ reconciledStepIds: [] })
const learningStateGetMock = vi.fn().mockResolvedValue(undefined)
const getUserLearningStateMock = vi.fn()
const persistLearningStateMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/practice/queries', () => ({
  savePracticeAnswer: (...args: unknown[]) => savePracticeAnswerMock(...args),
}))
vi.mock('@/lib/progress/activity-hub', () => ({
  recordActivitySession: (...args: unknown[]) => recordActivitySessionMock(...args),
}))
vi.mock('@/lib/db', () => ({
  db: { learningState: { get: (...args: unknown[]) => learningStateGetMock(...args) } },
}))
vi.mock('@/lib/ai-practice/load-state', () => ({
  getUserLearningState: (...args: unknown[]) => getUserLearningStateMock(...args),
}))
vi.mock('@/lib/ai-practice/queries', () => ({
  persistLearningState: (...args: unknown[]) => persistLearningStateMock(...args),
}))

import {
  buildCoachPracticeAnswer,
  buildSessionTopics,
  persistCoachExerciseResult,
  recordCoachSession,
} from '@/lib/ai-practice/coach-progress'
import { createEmptyState } from '@/lib/ai-practice/learning-state'
import type { ExerciseResult } from '@/lib/ai-practice/types'

const baseResult: ExerciseResult = {
  correct: true,
  topic: 'grammar:present_simple',
  gradedBy: 'client',
}

beforeEach(() => {
  savePracticeAnswerMock.mockClear()
  recordActivitySessionMock.mockClear()
  learningStateGetMock.mockClear()
  getUserLearningStateMock.mockClear()
  persistLearningStateMock.mockClear()
  learningStateGetMock.mockResolvedValue(undefined)
  getUserLearningStateMock.mockResolvedValue(createEmptyState('user-1', 'device-1'))
})

describe('buildSessionTopics', () => {
  it('collapses repeated topics into one entry with an accuracy rate', () => {
    const topics = buildSessionTopics(
      [
        { toolName: 'render_fill_blank', result: { ...baseResult, topic: 'Present perfect' } },
        { toolName: 'render_fill_blank', result: { ...baseResult, topic: 'Present perfect', correct: false } },
        { toolName: 'render_multiple_choice', result: { ...baseResult, topic: 'Articles' } },
      ],
      '2026-09-08T00:00:00.000Z',
    )

    expect(topics).toEqual([
      { topic: 'Present perfect', endedAt: '2026-09-08T00:00:00.000Z', exercisesCompleted: 2, correctRate: 0.5 },
      { topic: 'Articles', endedAt: '2026-09-08T00:00:00.000Z', exercisesCompleted: 1, correctRate: 1 },
    ])
  })

  it('ignores exercises with no usable topic', () => {
    const topics = buildSessionTopics(
      [{ toolName: 'render_fill_blank', result: { ...baseResult, topic: '   ' } }],
      '2026-09-08T00:00:00.000Z',
    )
    expect(topics).toEqual([])
  })
})

describe('recordCoachSession lastSessions', () => {
  it('prepends this session ahead of previous ones', async () => {
    learningStateGetMock.mockResolvedValue({
      userId: 'user-1',
      updatedAt: '2026-09-01T00:00:00.000Z',
      state: {
        ...createEmptyState('user-1', 'device-1'),
        lastSessions: [
          { topic: 'Articles', endedAt: '2026-09-01T00:00:00.000Z', exercisesCompleted: 3, correctRate: 1 },
        ],
      },
    })

    await recordCoachSession('user-1', [
      { toolName: 'render_fill_blank', result: { ...baseResult, topic: 'Present perfect' } },
    ])

    expect(persistLearningStateMock).toHaveBeenCalledTimes(1)
    const [, next] = persistLearningStateMock.mock.calls[0]
    expect(next.lastSessions.map((s: { topic: string }) => s.topic)).toEqual([
      'Present perfect',
      'Articles',
    ])
  })

  it('caps the history at ten sessions', async () => {
    learningStateGetMock.mockResolvedValue({
      userId: 'user-1',
      updatedAt: '2026-09-01T00:00:00.000Z',
      state: {
        ...createEmptyState('user-1', 'device-1'),
        lastSessions: Array.from({ length: 10 }, (_, i) => ({
          topic: `Topic ${i}`,
          endedAt: '2026-09-01T00:00:00.000Z',
          exercisesCompleted: 1,
          correctRate: 1,
        })),
      },
    })

    await recordCoachSession('user-1', [
      { toolName: 'render_fill_blank', result: { ...baseResult, topic: 'Present perfect' } },
    ])

    const [, next] = persistLearningStateMock.mock.calls[0]
    expect(next.lastSessions).toHaveLength(10)
    expect(next.lastSessions[0].topic).toBe('Present perfect')
  })

  it('preserves weak topics already stored', async () => {
    const weakTopics = [
      { topic: 'present perfect', errorRate: 0.7, sampleCount: 10, lastCoveredAt: '2026-09-01T00:00:00.000Z' },
    ]
    learningStateGetMock.mockResolvedValue({
      userId: 'user-1',
      updatedAt: '2026-09-01T00:00:00.000Z',
      state: { ...createEmptyState('user-1', 'device-1'), grammar: { weakTopics } },
    })

    await recordCoachSession('user-1', [
      { toolName: 'render_fill_blank', result: { ...baseResult, topic: 'Present perfect' } },
    ])

    const [, next] = persistLearningStateMock.mock.calls[0]
    expect(next.grammar.weakTopics).toEqual(weakTopics)
  })

  it('does not touch learning state when no widget produced an answer', async () => {
    await recordCoachSession('user-1', [
      { toolName: 'unknown_tool', result: baseResult },
    ])

    expect(persistLearningStateMock).not.toHaveBeenCalled()
  })
})

describe('recordCoachSession', () => {
  it('maps completed widgets to the shared session contract without rewriting answers', async () => {
    await recordCoachSession('user-1', [
      { toolName: 'render_fill_blank', result: baseResult },
      { toolName: 'render_multiple_choice', result: { ...baseResult, correct: false } },
    ])

    expect(savePracticeAnswerMock).not.toHaveBeenCalled()
    expect(recordActivitySessionMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        practiceContext: 'ai_coach',
        sessionResult: expect.objectContaining({
          accuracy: 50,
          results: [
            expect.objectContaining({ exerciseTypeId: 5, context: 'ai_coach' }),
            expect.objectContaining({ exerciseTypeId: 17, context: 'ai_coach' }),
          ],
        }),
      }),
    )
  })
})

describe('buildCoachPracticeAnswer', () => {
  it('maps fill_blank tool to exercise type 5 with ai_coach context', () => {
    const answer = buildCoachPracticeAnswer('render_fill_blank', baseResult)
    expect(answer).toMatchObject({
      slug: 'fill_blank',
      exerciseTypeId: 5,
      context: 'ai_coach',
      isCorrect: true,
      topic: 'grammar:present_simple',
      contentId: 'ai_coach:grammar:present simple',
    })
  })

  it('maps multiple_choice tool to exercise type 17', () => {
    const answer = buildCoachPracticeAnswer('render_multiple_choice', {
      ...baseResult,
      correct: false,
    })
    expect(answer).toMatchObject({
      slug: 'multiple_choice',
      exerciseTypeId: 17,
      context: 'ai_coach',
      isCorrect: false,
    })
  })

  it('maps speaking tool to speak_word with score scaled to 0-100', () => {
    const answer = buildCoachPracticeAnswer('render_speaking', {
      ...baseResult,
      topic: 'hello world',
      score: 0.87,
      ipa: '/həˈloʊ/',
    })
    expect(answer).toMatchObject({
      slug: 'speak_word',
      exerciseTypeId: 10,
      score: 87,
      exercisePayload: { targetWord: 'hello world', ipa: '/həˈloʊ/' },
    })
  })

  it('returns null for non-exercise tools', () => {
    expect(buildCoachPracticeAnswer('render_word_card', baseResult)).toBeNull()
    expect(buildCoachPracticeAnswer('save_word', baseResult)).toBeNull()
  })
})

describe('persistCoachExerciseResult', () => {
  it('invokes savePracticeAnswer with ai_coach context and mapped exercise type', async () => {
    await persistCoachExerciseResult('user-1', 'render_fill_blank', baseResult)

    expect(savePracticeAnswerMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ context: 'ai_coach', exerciseTypeId: 5, slug: 'fill_blank' }),
    )
  })

  it('skips save for unsupported tools', async () => {
    await persistCoachExerciseResult('user-1', 'render_word_card', baseResult)
    expect(savePracticeAnswerMock).not.toHaveBeenCalled()
  })
})
