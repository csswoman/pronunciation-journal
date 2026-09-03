// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReaderSentenceRecorder } from '../ReaderSentenceRecorder'

const mockStart = vi.fn()
const mockStop = vi.fn()
const mockReset = vi.fn()
let mockSpeechStatus = 'idle'
let mockSpeechResult: { transcript: string; confidence: number } | null = null
let mockIsSupported = true
const mockUserAudioUrl: string | null = 'blob:http://localhost/test-audio'

vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    status: mockSpeechStatus,
    result: mockSpeechResult,
    userAudioUrl: mockUserAudioUrl,
    isSupported: mockIsSupported,
    start: mockStart,
    stop: mockStop,
    reset: mockReset,
  }),
}))

vi.mock('@/lib/pronunciation/scoring', () => ({
  scorePronunciation: vi.fn().mockResolvedValue({
    accuracy: 85,
    transcript: 'The dog ran quickly',
    wordResults: [
      { expected: 'The', got: 'The', status: 'correct' },
      { expected: 'dog', got: 'dog', status: 'correct' },
      { expected: 'ran', got: 'ran', status: 'correct' },
      { expected: 'quickly', got: 'quickly', status: 'correct' },
    ],
  }),
  getFeedbackMessage: () => ({ message: '¡Excelente pronunciación!', emoji: '🎉', color: 'text-success' }),
  calculateXP: () => 15,
}))

describe('ReaderSentenceRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSpeechStatus = 'idle'
    mockSpeechResult = null
    mockIsSupported = true
  })

  it('renders record button when speech recognition is supported', () => {
    render(
      <ReaderSentenceRecorder
        sentenceText="The dog ran quickly."
        online={true}
      />,
    )

    expect(screen.getByText('🎙️ Práctica oral de la frase')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /grabar repetición/i })).toBeInTheDocument()
  })

  it('renders unsupported message when browser lacks speech support', () => {
    mockIsSupported = false
    render(
      <ReaderSentenceRecorder
        sentenceText="The dog ran quickly."
        online={true}
      />,
    )

    expect(screen.getByText(/Tu navegador no soporta reconocimiento de voz/i)).toBeInTheDocument()
  })

  it('starts recording when record button is clicked', () => {
    render(
      <ReaderSentenceRecorder
        sentenceText="The dog ran quickly."
        online={true}
      />,
    )

    const btn = screen.getByRole('button', { name: /grabar repetición/i })
    fireEvent.click(btn)
    expect(mockStart).toHaveBeenCalled()
  })

  it('evaluates and displays feedback when recording completes', async () => {
    mockSpeechStatus = 'done'
    mockSpeechResult = { transcript: 'The dog ran quickly', confidence: 0.95 }
    const onRecorded = vi.fn()

    render(
      <ReaderSentenceRecorder
        sentenceText="The dog ran quickly."
        online={true}
        onRecorded={onRecorded}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Repetir grabación')).toBeInTheDocument()
    })

    expect(screen.getByText('Comparación de Audio')).toBeInTheDocument()
    expect(onRecorded).toHaveBeenCalledWith(85, 'The dog ran quickly', expect.any(Number))
    expect(screen.getByRole('button', { name: /repetir grabación/i })).toBeInTheDocument()
  })
})
