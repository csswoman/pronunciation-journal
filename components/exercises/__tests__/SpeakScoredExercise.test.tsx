// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const evaluationMocks = vi.hoisted(() => ({
  evaluate: vi.fn(),
}))
const speechMocks = vi.hoisted(() => ({
  useSpeechRecognition: vi.fn(),
}))

vi.mock('@/lib/exercises/evaluation', () => ({
  defaultEvaluationEngine: evaluationMocks,
}))
vi.mock('@/lib/exercises/evaluation/word-results', () => ({
  getEvaluationWordResults: vi.fn(() => []),
}))
vi.mock('@/hooks/useSpeechRecognition', () => speechMocks)
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: null }),
}))
vi.mock('@/lib/phoneme-practice/tts', () => ({
  speak: vi.fn(),
}))
vi.mock('@/components/lesson/PronunciationFeedback', () => ({
  default: () => <div>Pronunciation feedback</div>,
}))

import { SpeakScoredExercise } from '../SpeakScoredExercise'

const exercise = {
  id: 'speak-1',
  type: 'speak_word' as const,
  prompt: 'Say the word',
  soundId: 1,
  targetWord: 'thought',
  ipa: 'θɔt',
  options: [],
  correctIds: [],
}

describe('SpeakScoredExercise', () => {
  beforeEach(() => {
    evaluationMocks.evaluate.mockReset()
    speechMocks.useSpeechRecognition.mockReset()
  })

  it('forwards the measured score when continuing after speech evaluation', async () => {
    evaluationMocks.evaluate.mockResolvedValue({ correct: true, score: 72 })
    speechMocks.useSpeechRecognition.mockReturnValue({
      status: 'done',
      result: { transcript: 'thought' },
      errorCode: null,
      isSupported: true,
      start: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn(),
    })
    const onSubmit = vi.fn()

    render(<SpeakScoredExercise exercise={exercise} onSubmit={onSubmit} />)

    // Wait for the async evaluate → scored UI path (effect + promise)
    await waitFor(() => {
      expect(evaluationMocks.evaluate).toHaveBeenCalled()
    })
    const continueBtn = await screen.findByRole('button', { name: /continuar/i }, { timeout: 3000 })
    fireEvent.click(continueBtn)

    expect(onSubmit).toHaveBeenCalledWith(true, 'thought', { score: 72 })
  })

  it('keeps the network-failure shadowing fallback unscored', async () => {
    speechMocks.useSpeechRecognition.mockReturnValue({
      status: 'error',
      result: null,
      errorCode: 'network',
      isSupported: true,
      start: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn(),
    })
    const onSubmit = vi.fn()

    render(<SpeakScoredExercise exercise={exercise} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(false, '', { status: 'unscored' }))
    // Never a correct answer, never a score — cannot affect accuracy/SRS/mastery.
    expect(onSubmit).not.toHaveBeenCalledWith(true, expect.anything(), expect.anything())
  })

  it('keeps the unsupported-browser fallback unscored and completable', async () => {
    speechMocks.useSpeechRecognition.mockReturnValue({
      status: 'idle',
      result: null,
      errorCode: null,
      isSupported: false,
      start: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn(),
    })
    const onSubmit = vi.fn()

    render(<SpeakScoredExercise exercise={exercise} onSubmit={onSubmit} />)

    expect(screen.getByText(/no admite puntuación por voz/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(false, '', { status: 'unscored' }))
  })

  it('falls back to an unscored shadowing result when evaluation rejects', async () => {
    evaluationMocks.evaluate.mockRejectedValue(new Error('evaluator exploded'))
    speechMocks.useSpeechRecognition.mockReturnValue({
      status: 'done',
      result: { transcript: 'thought' },
      errorCode: null,
      isSupported: true,
      start: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn(),
    })
    const onSubmit = vi.fn()

    render(<SpeakScoredExercise exercise={exercise} onSubmit={onSubmit} />)

    await waitFor(() => expect(evaluationMocks.evaluate).toHaveBeenCalled())
    const continueBtn = await screen.findByRole('button', { name: /continuar/i }, { timeout: 3000 })
    fireEvent.click(continueBtn)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(false, '', { status: 'evaluator_failed' }))
  })
})
