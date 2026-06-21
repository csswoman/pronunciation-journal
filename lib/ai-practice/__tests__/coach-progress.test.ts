import { describe, it, expect, vi, beforeEach } from 'vitest'

const savePracticeAnswerMock = vi.fn().mockResolvedValue(undefined)
const recordActivitySessionMock = vi.fn().mockResolvedValue({ reconciledStepIds: [] })

vi.mock('@/lib/practice/queries', () => ({
  savePracticeAnswer: (...args: unknown[]) => savePracticeAnswerMock(...args),
}))
vi.mock('@/lib/progress/activity-hub', () => ({
  recordActivitySession: (...args: unknown[]) => recordActivitySessionMock(...args),
}))

import {
  buildCoachPracticeAnswer,
  persistCoachExerciseResult,
  recordCoachSession,
} from '@/lib/ai-practice/coach-progress'
import type { ExerciseResult } from '@/lib/ai-practice/types'

const baseResult: ExerciseResult = {
  correct: true,
  topic: 'grammar:present_simple',
  gradedBy: 'client',
}

beforeEach(() => {
  savePracticeAnswerMock.mockClear()
  recordActivitySessionMock.mockClear()
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
