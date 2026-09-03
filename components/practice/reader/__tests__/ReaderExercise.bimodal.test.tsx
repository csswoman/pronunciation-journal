// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReaderExercise } from '../ReaderExercise'
import type { ReaderPassage } from '@/lib/practice/reader/types'

vi.mock('@/lib/practice/reader/exposure', () => ({
  recordReaderExposure: vi.fn().mockResolvedValue(undefined),
}))

describe('ReaderExercise Bimodal Reading', () => {
  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', {
      speak: vi.fn(),
      cancel: vi.fn(),
    })

    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class MockSpeechSynthesisUtterance {
        text: string
        lang: string = 'en-US'
        rate: number = 1.0
        onend: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor(text: string) {
          this.text = text
        }
      },
    )
  })

  const mockPassage: ReaderPassage = {
    id: 'bimodal-test-1',
    userId: 'u1',
    targetHash: 'h1',
    createdAt: '2026-09-02T00:00:00.000Z',
    passage: 'First sentence here. Second sentence follows.',
    level: 'B1',
    topic: 'general',
    targetSrsIds: [],
    targetItems: [],
    questions: [
      {
        prompt: 'What is this passage about?',
        options: ['Testing', 'Cooking'],
        correctIndex: 0,
      },
    ],
  }

  it('renders sentence spans and playback controls for bimodal reading', () => {
    render(
      <ReaderExercise
        passage={mockPassage}
        online={true}
        onComplete={vi.fn()}
      />,
    )

    // Verify sentences are rendered
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()

    // Verify playback bar is available
    expect(screen.getByText(/Iniciar Shadowing/i)).toBeInTheDocument()
    expect(screen.getByText('0.75x')).toBeInTheDocument()
    expect(screen.getByText('1x')).toBeInTheDocument()
  })

  it('triggers sentence audio when clicking a sentence', () => {
    render(
      <ReaderExercise
        passage={mockPassage}
        online={true}
        onComplete={vi.fn()}
      />,
    )

    const firstWord = screen.getByText('First')
    const sentenceSpan = firstWord.closest('span[title="Toca para escuchar esta oración"]')
    expect(sentenceSpan).not.toBeNull()

    if (sentenceSpan) {
      fireEvent.click(sentenceSpan)
      expect(window.speechSynthesis.speak).toHaveBeenCalled()
    }
  })
})
