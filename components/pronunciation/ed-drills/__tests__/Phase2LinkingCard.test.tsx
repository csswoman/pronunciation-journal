// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const speechMocks = vi.hoisted(() => ({ useSpeechRecognition: vi.fn() }))
const capabilityMocks = vi.hoisted(() => ({ canScoreSpeech: vi.fn() }))

vi.mock('@/hooks/useSpeechRecognition', () => speechMocks)
vi.mock('@/lib/speech/adapters/webSpeechAdapter', () => capabilityMocks)
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))

import { Phase2LinkingCard } from '../Phase2LinkingCard'
import { ED_DRILL_CATALOG } from '@/lib/pronunciation/ed-drills/catalog'

function mockSpeech(overrides: Record<string, unknown> = {}) {
  speechMocks.useSpeechRecognition.mockReturnValue({
    status: 'idle', result: null, errorCode: null, isSupported: true,
    start: vi.fn(), stop: vi.fn(), reset: vi.fn(), ...overrides,
  })
  capabilityMocks.canScoreSpeech.mockReturnValue(true)
}

describe('Phase2LinkingCard', () => {
  it('ofrece shadowing sin puntuación y permite continuar cuando no se puede puntuar', () => {
    mockSpeech({ isSupported: false })
    capabilityMocks.canScoreSpeech.mockReturnValue(false)
    const onComplete = vi.fn()
    render(<Phase2LinkingCard item={ED_DRILL_CATALOG[0]} onComplete={onComplete} />)

    fireEvent.click(screen.getByRole('button', { name: /Continuar sin puntuación/i }))

    expect(screen.getByText(/no se puede puntuar/i)).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledWith({ correct: false, scored: false, suspectedEpenthesis: false })
  })

  it('muestra progreso mientras el audio se procesa', () => {
    mockSpeech({ status: 'processing' })
    render(<Phase2LinkingCard item={ED_DRILL_CATALOG[0]} onComplete={vi.fn()} />)
    expect(screen.getByText(/Estamos transcribiendo tu voz/i)).toBeInTheDocument()
  })

  it('marca fallo si falta el pasado en la transcripción', () => {
    mockSpeech({ status: 'done', result: { transcript: 'achieve it', source: 'gemini' } })
    render(<Phase2LinkingCard item={ED_DRILL_CATALOG[0]} onComplete={vi.fn()} />)
    expect(screen.getByText(/No apareció “achieved”/i)).toBeInTheDocument()
  })

  it('marca acierto si reconoce el pasado', () => {
    mockSpeech({ status: 'done', result: { transcript: 'achieved it', source: 'gemini' } })
    render(<Phase2LinkingCard item={ED_DRILL_CATALOG[0]} onComplete={vi.fn()} />)
    expect(screen.getByText(/Detectamos “achieved”/i)).toBeInTheDocument()
  })

  it('muestra la pista pedagógica de epéntesis sin convertirla en error', () => {
    mockSpeech({ status: 'done', result: { transcript: 'achieved it', source: 'gemini' } })
    render(<Phase2LinkingCard item={ED_DRILL_CATALOG[0]} onComplete={vi.fn()} suspectedEpenthesis />)
    expect(screen.getByText(/Tip de articulación/i).parentElement).toHaveClass('text-warning')
    expect(screen.queryByText(/No apareció/i)).not.toBeInTheDocument()
  })
})
