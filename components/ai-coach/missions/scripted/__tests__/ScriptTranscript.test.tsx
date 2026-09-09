// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScriptTranscript } from '../ScriptTranscript'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

const SCRIPT: ScriptLine[] = [
  { id: 'l1', speaker: 'coach', text: 'Hi there! What can I get for you?' },
  { id: 'l2', speaker: 'learner', text: "I'd like a large coffee, please." },
  { id: 'l3', speaker: 'coach', text: 'Sure. Room for milk?' },
]

describe('ScriptTranscript', () => {
  it('muestra solo las lineas ya recorridas, no las futuras', () => {
    const { container } = render(<ScriptTranscript script={SCRIPT} currentIndex={2} />)

    // Las lineas del coach se pintan palabra a palabra, asi que se comprueba
    // sobre el texto plano del historial, no sobre un unico nodo.
    const shown = container.textContent ?? ''
    expect(shown).toContain(SCRIPT[0].text)
    expect(shown).toContain(SCRIPT[1].text)
    // La linea actual la renderiza el runner (Coach/LearnerLine), no el historial.
    expect(shown).not.toContain(SCRIPT[2].text)
  })

  it('no renderiza nada antes de la primera linea', () => {
    const { container } = render(<ScriptTranscript script={SCRIPT} currentIndex={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('distingue quien habla en cada burbuja', () => {
    render(<ScriptTranscript script={SCRIPT} currentIndex={2} />)

    expect(screen.getByText('Coach')).toBeInTheDocument()
    expect(screen.getByText('Tú')).toBeInTheDocument()
  })

  it('no avanza la mision: su unica accion es volver a oir una linea', () => {
    render(<ScriptTranscript script={SCRIPT} currentIndex={3} />)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    // Cada linea del coach se puede volver a escuchar; las del alumno no.
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    for (const button of buttons) {
      expect(button).toHaveAccessibleName(/volver a escuchar/i)
    }
  })

  it('permite volver a escuchar una linea del coach ya recorrida', () => {
    render(<ScriptTranscript script={SCRIPT} currentIndex={3} />)

    expect(
      screen.getByRole('button', { name: `Volver a escuchar: ${SCRIPT[0].text}` }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: `Volver a escuchar: ${SCRIPT[1].text}` }),
    ).not.toBeInTheDocument()
  })
})
