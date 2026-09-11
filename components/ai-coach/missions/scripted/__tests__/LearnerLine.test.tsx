// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LearnerLine } from '../LearnerLine'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

import type { LearnerCaptureState, LearnerSpeechErrorCode } from '@/hooks/useLearnerSpeechCapture'

const captureState: {
  status: 'idle' | 'listening' | 'processing' | 'done' | 'error' | 'unsupported'
  transcript: string | null
  userAudioUrl: string | null
  micStream: MediaStream | null
  errorCode: LearnerSpeechErrorCode
  canScore: boolean
  captureState: LearnerCaptureState
  isCapturing: boolean
  hasRecording: boolean
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  reset: ReturnType<typeof vi.fn>
} = {
  status: 'idle',
  transcript: null,
  userAudioUrl: null,
  micStream: null,
  errorCode: null,
  canScore: true,
  captureState: 'inactive',
  isCapturing: false,
  hasRecording: false,
  start: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn(),
}

vi.mock('@/hooks/useSharedMicStream', () => ({
  useSharedMicStream: () => ({
    getStream: vi.fn().mockResolvedValue({}),
    release: vi.fn(),
  }),
}))

vi.mock('@/hooks/useLearnerSpeechCapture', () => ({
  useLearnerSpeechCapture: () => captureState,
}))

vi.mock('@/hooks/useVoiceLevel', () => ({
  useVoiceLevel: () => ({
    getSamples: () => new Uint8Array(200).fill(128),
    peak: 0,
  }),
}))

vi.mock('@/hooks/useMissionLineAudio', () => ({
  useMissionLineAudio: () => ({ hdAudioUrl: undefined }),
}))

// El osciloscopio se dibuja en un bucle de requestAnimationFrame que en jsdom
// no para nunca: aqui se prueba el estado del turno, no el trazado. Tiene su
// propio test en ScrollingWaveform.test.tsx.
vi.mock('../ScrollingWaveform', () => ({
  ScrollingWaveform: () => null,
}))

const evaluation = {
  score: 60,
  wordResults: [
    { expected: 'I', got: 'I', status: 'correct' },
    { expected: 'would', got: 'wood', status: 'incorrect' },
  ] as unknown[],
}

vi.mock('@/lib/exercises/evaluation', () => ({
  defaultEvaluationEngine: { evaluate: async () => evaluation },
}))

vi.mock('@/lib/exercises/evaluation/word-results', () => ({
  getEvaluationWordResults: (result: { wordResults: unknown[] }) => result.wordResults,
}))

const line: ScriptLine = { id: 'l2', speaker: 'learner', text: 'I would like a coffee.' }

describe('LearnerLine', () => {
  beforeEach(() => {
    captureState.status = 'idle'
    captureState.transcript = null
    captureState.userAudioUrl = null
    captureState.micStream = null
    captureState.errorCode = null
    captureState.canScore = true
    captureState.captureState = 'inactive'
    captureState.isCapturing = false
    captureState.hasRecording = false
    captureState.start.mockReset()
    captureState.stop.mockReset()
    captureState.reset.mockReset()
  })

  it('muestra ShadowingPanel con las palabras de la frase y botón escuchar', () => {
    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /escuchar frase/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escuchar I' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escuchar coffee.' })).toBeInTheDocument()
  })

  it('ofrece botón Hablar cuando está en reposo', () => {
    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /hablar/i })).toBeInTheDocument()
  })

  it('muestra estado de grabación y botón Detener cuando listening', () => {
    captureState.status = 'listening'
    captureState.isCapturing = true
    captureState.captureState = 'recording'
    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)

    expect(screen.getByTestId('recording-indicator')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /detener/i })).toBeInTheDocument()
  })
})

describe('LearnerLine — feedback después de hablar', () => {
  afterEach(() => {
    captureState.status = 'idle'
    captureState.transcript = null
    captureState.hasRecording = false
    captureState.captureState = 'inactive'
  })

  it('colorea cada palabra y muestra puntuación', async () => {
    captureState.status = 'done'
    captureState.transcript = 'I wood like a coffee.'
    captureState.hasRecording = true
    captureState.captureState = 'stopped'
    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)

    expect(await screen.findByLabelText('I: bien')).toBeInTheDocument()
    expect(screen.getByLabelText('would: mal')).toBeInTheDocument()
    expect(await screen.findByText(/60%/)).toBeInTheDocument()
  })

  it('explica el fallo anclado a la palabra si hay fallo', async () => {
    evaluation.wordResults = [
      {
        expected: 'yes',
        got: 'jes',
        status: 'incorrect',
        phonemes: {
          expected: [],
          got: [],
          tip: null,
          alignment: [
            { phoneme: 'Y', ipa: 'j', status: 'incorrect', got: 'JH', gotIpa: 'dʒ' },
            { phoneme: 'EH', ipa: 'ɛ', status: 'correct' },
            { phoneme: 'S', ipa: 's', status: 'correct' },
          ],
        },
      },
    ]
    captureState.status = 'done'
    captureState.transcript = 'jes'
    captureState.hasRecording = true
    captureState.captureState = 'stopped'

    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)
    const matches = await screen.findAllByText(/deslizamiento suave/i)
    expect(matches.length).toBeGreaterThan(0)
  })
})

describe('LearnerLine — modo práctica sin STT', () => {
  beforeEach(() => {
    captureState.status = 'idle'
    captureState.transcript = null
    captureState.userAudioUrl = null
    captureState.micStream = null
    captureState.errorCode = null
    captureState.canScore = true
    captureState.captureState = 'inactive'
    captureState.isCapturing = false
    captureState.hasRecording = false
    captureState.start.mockReset()
    captureState.stop.mockReset()
    captureState.reset.mockReset()
  })

  it('ofrece botón Continuar que invoca onLineComplete(null) si canScore es false', () => {
    captureState.canScore = false
    const onLineComplete = vi.fn()

    render(<LearnerLine line={line} onLineComplete={onLineComplete} />)

    const continueBtn = screen.getByRole('button', { name: /continuar/i })
    expect(continueBtn).toBeInTheDocument()
    fireEvent.click(continueBtn)
    expect(onLineComplete).toHaveBeenCalledWith(null)
  })

  it('muestra SelfPlaybackAudioBar y RetryAndContinue si grabó en modo práctica', () => {
    captureState.canScore = false
    captureState.userAudioUrl = 'blob:http://localhost/practica.webm'
    captureState.hasRecording = true
    captureState.captureState = 'stopped'
    const onLineComplete = vi.fn()

    render(<LearnerLine line={line} onLineComplete={onLineComplete} />)

    expect(screen.getByText('Mi voz')).toBeInTheDocument()
    const continueBtn = screen.getByRole('button', { name: /continuar/i })
    fireEvent.click(continueBtn)
    expect(onLineComplete).toHaveBeenCalledWith(null)

  })

  // --- Regresiones: no puntuar sin grabación real, y poder reescuchar ---

  it('no evalúa ni muestra puntuación si no hubo grabación real', async () => {
    captureState.status = 'done'
    captureState.transcript = 'I would like a coffee'
    captureState.hasRecording = false
    captureState.captureState = 'error'

    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)

    await new Promise((r) => setTimeout(r, 0))

    expect(screen.queryByText(/60%/)).not.toBeInTheDocument()
  })

  it('evalúa y muestra la puntuación cuando sí hubo grabación', async () => {
    captureState.status = 'done'
    captureState.transcript = 'I would like a coffee'
    captureState.hasRecording = true
    captureState.captureState = 'stopped'
    captureState.userAudioUrl = 'blob:http://localhost/a'

    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)

    expect(await screen.findByText(/60%/)).toBeInTheDocument()
  })

  it('ofrece reescuchar la propia voz cuando hay grabación tras puntuar', async () => {
    captureState.status = 'done'
    captureState.transcript = 'I would like a coffee'
    captureState.hasRecording = true
    captureState.captureState = 'stopped'
    captureState.userAudioUrl = 'blob:http://localhost/a'

    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)

    await screen.findByText(/60%/)
    const replay = screen.getByLabelText('Escuchar mi propia voz grabada')
    expect(replay).not.toBeDisabled()
  })

  it('muestra "Grabando" solo cuando el micrófono captura de verdad', () => {
    captureState.status = 'listening'
    captureState.isCapturing = false
    captureState.captureState = 'starting'

    const { rerender } = render(<LearnerLine line={line} onLineComplete={vi.fn()} />)
    expect(screen.queryByTestId('recording-indicator')).not.toBeInTheDocument()

    captureState.isCapturing = true
    captureState.captureState = 'recording'
    rerender(<LearnerLine line={line} onLineComplete={vi.fn()} />)
    expect(screen.getByTestId('recording-indicator')).toBeInTheDocument()
  })
})
