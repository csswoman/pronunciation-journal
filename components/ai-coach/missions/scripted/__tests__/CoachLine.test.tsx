// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { CoachLine } from '../CoachLine'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

const speak = vi.fn()
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: (...args: unknown[]) => speak(...args) }))

const line: ScriptLine = { id: 'l1', speaker: 'coach', text: 'How are you?' }

describe('CoachLine', () => {
  beforeEach(() => speak.mockClear())

  it('muestra el texto de la línea', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    expect(screen.getByText('How are you?')).toBeInTheDocument()
  })

  it('reproduce la línea al pulsar repetir', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    act(() => speak.mock.calls[0]?.[1]?.())
    speak.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /repetir/i }))
    expect(speak).toHaveBeenCalled()
  })

  it('habla sola al aparecer la linea, sin esperar un click', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    expect(speak).toHaveBeenCalledOnce()
    expect(speak).toHaveBeenCalledWith('How are you?', expect.anything())
  })

  it('permite volver a reproducir despues del autoplay', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    // El autoplay deja el boton deshabilitado hasta que la voz termina.
    act(() => speak.mock.calls[0]?.[1]?.())
    speak.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /repetir/i }))
    expect(speak).toHaveBeenCalledOnce()
  })

  it('no repite el autoplay si la linea no cambia', () => {
    const { rerender } = render(<CoachLine line={line} onContinue={vi.fn()} />)
    rerender(<CoachLine line={line} onContinue={vi.fn()} />)
    expect(speak).toHaveBeenCalledOnce()
  })

  it('avanza al pulsar continuar', () => {
    const onContinue = vi.fn()
    render(<CoachLine line={line} onContinue={onContinue} />)
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onContinue).toHaveBeenCalledOnce()
  })
})
