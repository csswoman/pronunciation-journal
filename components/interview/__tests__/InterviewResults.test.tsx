// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { InterviewResults } from '../InterviewResults'
import type { InterviewTurn } from '../InterviewSession'

const savePracticeAnswerMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-interview' } }),
}))

vi.mock('@/lib/practice/queries', () => ({
  savePracticeAnswer: (...args: unknown[]) => savePracticeAnswerMock(...args),
}))

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))

const turns: InterviewTurn[] = [
  { role: 'interviewer', text: 'Tell me about yourself.' },
  { role: 'candidate', text: 'I work in software.' },
  { role: 'interviewer', text: 'What are your strengths?' },
  { role: 'candidate', text: 'I am detail oriented.' },
]

function makeResults() {
  return new Map([
    [1, { score: { accuracy: 80, isCorrect: true, transcript: 'I work in software.', wordResults: [] }, transcript: 'I work in software.' }],
    [3, { score: { accuracy: 50, isCorrect: false, transcript: 'I am detail oriented.', wordResults: [] }, transcript: 'I am detail oriented.' }],
  ])
}

describe('InterviewResults progress persistence', () => {
  beforeEach(() => {
    savePracticeAnswerMock.mockClear()
  })

  it('persists one savePracticeAnswer call per scored candidate turn', async () => {
    render(
      <InterviewResults
        title="Mock interview"
        turns={turns}
        results={makeResults()}
        difficulty="guided"
        level="intermediate"
        onReset={() => {}}
      />,
    )

    await waitFor(() => {
      expect(savePracticeAnswerMock).toHaveBeenCalledTimes(2)
    })

    expect(savePracticeAnswerMock).toHaveBeenCalledWith(
      'user-interview',
      expect.objectContaining({
        context: 'ai_coach',
        slug: 'speak_word',
        exerciseTypeId: 10,
        contentId: 'interview:1',
        isCorrect: true,
        userAnswer: 'I work in software.',
      }),
    )

    expect(savePracticeAnswerMock).toHaveBeenCalledWith(
      'user-interview',
      expect.objectContaining({
        contentId: 'interview:3',
        isCorrect: false,
      }),
    )
  })

  it('does not duplicate saves on re-render', async () => {
    const results = makeResults()
    const { rerender } = render(
      <InterviewResults
        title="Mock interview"
        turns={turns}
        results={results}
        difficulty="guided"
        level="intermediate"
        onReset={() => {}}
      />,
    )

    await waitFor(() => {
      expect(savePracticeAnswerMock).toHaveBeenCalledTimes(2)
    })

    rerender(
      <InterviewResults
        title="Mock interview"
        turns={turns}
        results={results}
        difficulty="guided"
        level="intermediate"
        onReset={() => {}}
      />,
    )

    expect(savePracticeAnswerMock).toHaveBeenCalledTimes(2)
  })
})
