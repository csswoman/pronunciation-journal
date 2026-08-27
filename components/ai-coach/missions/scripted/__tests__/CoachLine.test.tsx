// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { CoachLine } from '../CoachLine'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

const speak = vi.fn()
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: (...args: unknown[]) => speak(...args) }))

const line: ScriptLine = { id: 'l1', speaker: 'coach', text: 'How are you?' }

/** El texto ya no es un solo nodo: SpokenLine lo parte en spans por palabra. */
function endSpeech() {
  const opts = speak.mock.calls[0]?.[1] as { onEnd?: () => void } | undefined
  act(() => opts?.onEnd?.())
}

describe('CoachLine', () => {
  beforeEach(() => speak.mockClear())

  it('muestra el texto de la línea', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    expect(screen.getByTestId('spoken-script-line')).toHaveTextContent('How are you?')
  })

  it('reproduce la línea al pulsar repetir', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    endSpeech()
    speak.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /repetir/i }))
    expect(speak).toHaveBeenCalled()
  })

  it('habla sola al aparecer la linea, sin esperar un click', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    expect(speak).toHaveBeenCalledOnce()
    expect(speak).toHaveBeenCalledWith('How are you?', expect.anything())
  })

  it('resalta la primera palabra en cuanto el coach empieza a hablar', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    // El autoplay ya arranco la locucion al montar.
    const first = screen.getByText(line.text.split(' ')[0] as string)
    expect(first).toHaveAttribute('data-active', 'true')
  })

  it('permite volver a reproducir despues del autoplay', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    // El autoplay deja el boton deshabilitado hasta que la voz termina.
    endSpeech()
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
