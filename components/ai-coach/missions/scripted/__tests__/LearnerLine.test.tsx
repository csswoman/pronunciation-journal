// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LearnerLine } from '../LearnerLine'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    status: 'idle', result: null, userAudioUrl: null, errorCode: null,
    isSupported: true, start: vi.fn(), stop: vi.fn(), reset: vi.fn(),
  }),
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
