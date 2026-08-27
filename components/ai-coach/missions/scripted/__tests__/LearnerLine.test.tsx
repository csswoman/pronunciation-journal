// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LearnerLine } from '../LearnerLine'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

const speechState = {
  status: 'idle' as string,
  result: null as { transcript: string } | null,
}

vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    status: speechState.status, result: speechState.result,
    userAudioUrl: null, errorCode: null,
    isSupported: true, start: vi.fn(), stop: vi.fn(), reset: vi.fn(),
  }),
}))

vi.mock('@/lib/exercises/evaluation', () => ({
  defaultEvaluationEngine: {
    evaluate: async () => ({
      score: 60,
      wordResults: [
        { expected: 'I', got: 'I', status: 'correct' },
        { expected: 'would', got: 'wood', status: 'incorrect' },
      ],
    }),
  },
}))
vi.mock('@/lib/exercises/evaluation/word-results', () => ({
  getEvaluationWordResults: (result: { wordResults: unknown[] }) => result.wordResults,
}))

const line: ScriptLine = { id: 'l2', speaker: 'learner', text: 'I would like a coffee.' }

describe('LearnerLine', () => {
  it('muestra la línea que hay que decir', () => {
    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)
    expect(screen.getByText('I would like a coffee.')).toBeInTheDocument()
  })

  it('ofrece grabar cuando el reconocimiento está disponible', () => {
    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /hablar|grabar/i })).toBeInTheDocument()
  })
})

describe('LearnerLine — feedback despues de hablar', () => {
  afterEach(() => {
    speechState.status = 'idle'
    speechState.result = null
  })

  it('colorea cada palabra segun su estado, tambien las correctas', async () => {
    speechState.status = 'done'
    speechState.result = { transcript: 'I wood like a coffee.' }
    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)

    // El bug: solo se pintaban las falladas, asi que un acierto se veia
    // igual que un fallo y no habia color en ninguna parte.
    expect(await screen.findByLabelText('I: bien')).toBeInTheDocument()
    expect(screen.getByLabelText('would: mal')).toBeInTheDocument()
  })

  it('muestra la puntuacion de la linea', async () => {
    speechState.status = 'done'
    speechState.result = { transcript: 'I wood like a coffee.' }
    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)

    expect(await screen.findByText(/60%/)).toBeInTheDocument()
  })
})
