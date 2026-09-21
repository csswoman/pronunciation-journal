// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { FocusDialogueBody } from '../FocusDialogueBody'
import type { DialogueBody } from '@/lib/focus/types'

const mockOpenCoach = vi.fn()

vi.mock('@/lib/stores/aiCoachStore', () => ({
  useAICoachStore: (selector: (state: { openCoach: typeof mockOpenCoach }) => unknown) =>
    selector({ openCoach: mockOpenCoach }),
}))

const mockDialogueBody: DialogueBody = {
  context: 'Dos compañeros de trabajo hablan sobre su rutina y el fin de semana.',
  turns: [
    { speaker: 'A', text: 'Hi Sarah, how is your day going so far?' },
    { speaker: 'B', text: 'It is busy! I usually drink three cups of coffee every morning.' },
    { speaker: 'A', text: 'That is a lot! I only drink one cup at home.' },
    { speaker: 'B', text: 'I need the energy. What did you do last weekend?' },
    { speaker: 'A', text: 'I visited my parents in the countryside.' },
    { speaker: 'B', text: 'That sounds nice. Did you walk in the forest?' },
  ],
}

describe('FocusDialogueBody', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('muestra solo 4 turnos por página inicialmente y permite navegar con paginación', () => {
    render(<FocusDialogueBody body={mockDialogueBody} />)

    // Primeros 4 turnos visibles
    expect(screen.getByText(/how is your day going so far/i)).toBeInTheDocument()
    expect(screen.getByText(/three cups of coffee every morning/i)).toBeInTheDocument()
    expect(screen.getByText(/I only drink one cup at home/i)).toBeInTheDocument()
    expect(screen.getByText(/What did you do last weekend/i)).toBeInTheDocument()

    // Turnos 5 y 6 no visibles en página 1
    expect(screen.queryByText(/I visited my parents in the countryside/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Did you walk in the forest/i)).not.toBeInTheDocument()

    // Avanzar a la página 2
    const nextButton = screen.getByRole('button', { name: /Siguientes/i })
    fireEvent.click(nextButton)

    // Turnos 5 y 6 visibles
    expect(screen.getByText(/I visited my parents in the countryside/i)).toBeInTheDocument()
    expect(screen.getByText(/Did you walk in the forest/i)).toBeInTheDocument()
    expect(screen.queryByText(/how is your day going so far/i)).not.toBeInTheDocument()

    // Regresar a la página 1
    const prevButton = screen.getByRole('button', { name: /Anteriores/i })
    fireEvent.click(prevButton)
    expect(screen.getByText(/how is your day going so far/i)).toBeInTheDocument()
  })

  it('invoca onStartPractice al pulsar Ir a preguntas', () => {
    const onStartPractice = vi.fn()
    render(<FocusDialogueBody body={mockDialogueBody} onStartPractice={onStartPractice} />)

    const practiceButton = screen.getByRole('button', { name: /Ir a preguntas/i })
    fireEvent.click(practiceButton)
    expect(onStartPractice).toHaveBeenCalledTimes(1)
  })

  it('abre el coach prellenado para practicar el diálogo en voz alta', () => {
    render(<FocusDialogueBody body={mockDialogueBody} />)

    const coachButton = screen.getByRole('button', { name: /Practicar diálogo con el Coach/i })
    fireEvent.click(coachButton)

    expect(mockOpenCoach).toHaveBeenCalledWith(
      expect.objectContaining({
        tab: 'chat',
        prefill: expect.stringContaining('Persona A'),
      })
    )
  })

  it('abre la pestaña de misiones orales al pulsar Misiones orales', () => {
    render(<FocusDialogueBody body={mockDialogueBody} />)

    const missionsButton = screen.getByRole('button', { name: /Misiones orales/i })
    fireEvent.click(missionsButton)

    expect(mockOpenCoach).toHaveBeenCalledWith({ tab: 'missions' })
  })

  it('en modo isPracticing muestra el diálogo colapsable sin CTAs que interrumpan la sesión', () => {
    render(<FocusDialogueBody body={mockDialogueBody} isPracticing={true} onStartPractice={vi.fn()} />)

    expect(screen.getByText(/Diálogo de referencia/i)).toBeInTheDocument()
    const consultButton = screen.getByRole('button', { name: /Consultar diálogo/i })
    expect(consultButton).toBeInTheDocument()

    fireEvent.click(consultButton)
    expect(screen.getByText(/how is your day going so far/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ir a preguntas/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Practicar diálogo con el Coach/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Misiones orales/i })).not.toBeInTheDocument()
  })
})
