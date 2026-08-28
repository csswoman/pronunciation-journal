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
    render(<ScriptTranscript script={SCRIPT} currentIndex={2} />)

    expect(screen.getByText(SCRIPT[0].text)).toBeInTheDocument()
    expect(screen.getByText(SCRIPT[1].text)).toBeInTheDocument()
    // La linea actual la renderiza el runner (Coach/LearnerLine), no el historial.
    expect(screen.queryByText(SCRIPT[2].text)).not.toBeInTheDocument()
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

  it('es solo lectura: no ofrece ningun control de entrada', () => {
    render(<ScriptTranscript script={SCRIPT} currentIndex={3} />)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
