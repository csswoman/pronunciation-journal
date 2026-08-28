// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SentenceContextExercise } from '../SentenceContextExercise'
import type { SentenceContextExercise as SentenceContextExerciseType } from '@/lib/exercises/types'

vi.mock('@/hooks/useUISounds', () => ({
  useUISounds: () => ({
    playTap: vi.fn(),
    playCorrect: vi.fn(),
    playWrong: vi.fn(),
  }),
}))

describe('SentenceContextExercise', () => {
  const sampleExercise: SentenceContextExerciseType = {
    id: 'test-sc-1',
    type: 'sentence_context',
    sourceRef: { source: 'word_bank', id: 'wb-1' },
    sentence: 'The weather was ___ yesterday.',
    fullSentence: 'The weather was pleasant yesterday.',
    answer: 'pleasant',
    definition: 'enjoyable, attractive, or agreeable',
    options: [
      { id: 'opt-1', word: 'pleasant' },
      { id: 'opt-2', word: 'pleased' },
      { id: 'opt-3', word: 'pleasing' },
      { id: 'opt-4', word: 'pleasure' },
    ],
  }

  let onResultMock = vi.fn<
    (isCorrect: boolean, userAnswer: string, timeMs: number, extras?: { feedback?: unknown }) => void
  >()

  beforeEach(() => {
    onResultMock = vi.fn()
    vi.stubGlobal('speechSynthesis', {
      speak: vi.fn(),
      cancel: vi.fn(),
    })
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      lang = ''
      rate = 1
      onstart: (() => void) | null = null
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor(public text: string) {}
    })
  })

  it('renders sentence prompt, audio button, and 4 option buttons', () => {
    render(<SentenceContextExercise exercise={sampleExercise} onResult={onResultMock} />)

    expect(screen.getByText(/The weather was/)).toBeInTheDocument()
    expect(screen.getByText(/yesterday\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Escuchar oración/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1. pleasant' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2. pleased' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3. pleasing' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '4. pleasure' })).toBeInTheDocument()
  })

  it('plays audio when clicking the listen button', () => {
    render(<SentenceContextExercise exercise={sampleExercise} onResult={onResultMock} />)

    const listenBtn = screen.getByRole('button', { name: /Escuchar oración/i })
    fireEvent.click(listenBtn)

    expect(window.speechSynthesis.speak).toHaveBeenCalled()
  })

  it('handles selecting the correct answer', () => {
    render(<SentenceContextExercise exercise={sampleExercise} onResult={onResultMock} />)

    fireEvent.click(screen.getByRole('button', { name: '1. pleasant' }))

    expect(onResultMock).toHaveBeenCalledWith(
      true,
      'pleasant',
      expect.any(Number),
      expect.objectContaining({
        feedback: expect.objectContaining({
          immediate: 'Esa opción encaja en la oración.',
          correction: 'The weather was pleasant yesterday.',
        }),
      }),
    )

    // Definition card should be visible
    expect(screen.getByText(/Definición ·/)).toBeInTheDocument()
    expect(screen.getByText('enjoyable, attractive, or agreeable')).toBeInTheDocument()
  })

  it('handles selecting an incorrect answer', () => {
    render(<SentenceContextExercise exercise={sampleExercise} onResult={onResultMock} />)

    fireEvent.click(screen.getByRole('button', { name: '2. pleased' }))

    expect(onResultMock).toHaveBeenCalledWith(
      false,
      'pleased',
      expect.any(Number),
      expect.objectContaining({
        feedback: expect.objectContaining({
          immediate: 'Lee la oración completa y vuelve a revisar el significado.',
          expectedAnswer: 'pleasant',
        }),
      }),
    )

    // Definition card should still be revealed to teach the learner
    expect(screen.getByText(/Definición ·/)).toBeInTheDocument()
    expect(screen.getByText('enjoyable, attractive, or agreeable')).toBeInTheDocument()
  })

  it('supports number keyboard shortcuts (1-4)', () => {
    render(<SentenceContextExercise exercise={sampleExercise} onResult={onResultMock} />)

    fireEvent.keyDown(window, { key: '1' })

    expect(onResultMock).toHaveBeenCalledWith(
      true,
      'pleasant',
      expect.any(Number),
      expect.anything(),
    )
  })
})
