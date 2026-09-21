// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FocusDrillBody } from '../FocusDrillBody'
import type { DrillBody } from '@/lib/focus/types'

const mockDrillBody: DrillBody = {
  sentences: [
    { text: 'Yesterday I walked to the park.', translation: 'Ayer caminé al parque.', gapWord: 'walked' },
    { text: 'She visited her grandmother last week.', translation: 'Ella visitó a su abuela la semana pasada.', gapWord: 'visited' },
    { text: 'They stayed at a quiet hotel.', translation: 'Ellos se quedaron en un hotel tranquilo.', gapWord: 'stayed' },
    { text: 'We played soccer in the afternoon.', translation: 'Jugamos fútbol por la tarde.', gapWord: 'played' },
    { text: 'He cooked a delicious dinner yesterday.', translation: 'Él cocinó una cena deliciosa ayer.', gapWord: 'cooked' },
  ],
}

describe('FocusDrillBody', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('muestra solo 3 frases de vista previa y permite navegar con paginación Siguientes / Anteriores', () => {
    render(<FocusDrillBody body={mockDrillBody} />)

    // Debe mostrar las primeras 3 frases
    expect(screen.getByText(/to the park\./)).toBeInTheDocument()
    expect(screen.getByText(/her grandmother last week\./)).toBeInTheDocument()
    expect(screen.getByText(/at a quiet hotel\./)).toBeInTheDocument()

    // No debe mostrar la 4ta ni 5ta en la página 1
    expect(screen.queryByText(/soccer in the afternoon\./)).not.toBeInTheDocument()
    expect(screen.queryByText(/delicious dinner yesterday\./)).not.toBeInTheDocument()

    // Botón de paginación siguiente
    const nextButton = screen.getByRole('button', { name: /Siguientes/i })
    expect(nextButton).toBeInTheDocument()

    // Al hacer clic en Siguientes, muestra la página 2 con las siguientes frases
    fireEvent.click(nextButton)
    expect(screen.getByText(/soccer in the afternoon\./)).toBeInTheDocument()
    expect(screen.getByText(/delicious dinner yesterday\./)).toBeInTheDocument()
    expect(screen.queryByText(/to the park\./)).not.toBeInTheDocument()

    // Al hacer clic en Anteriores, vuelve a la página 1
    const prevButton = screen.getByRole('button', { name: /Anteriores/i })
    fireEvent.click(prevButton)
    expect(screen.getByText(/to the park\./)).toBeInTheDocument()
  })

  it('resalta y subraya el objetivo (gapWord) en un elemento mark', () => {
    const { container } = render(<FocusDrillBody body={mockDrillBody} />)

    const markElements = container.querySelectorAll('mark')
    expect(markElements.length).toBeGreaterThan(0)
    expect(markElements[0].textContent).toBe('walked')
    expect(markElements[0].className).toContain('underline')
    expect(markElements[0].className).toContain('text-primary')
  })

  it('trata los caracteres de expresión regular del objetivo como texto literal', () => {
    const { container } = render(<FocusDrillBody body={{ sentences: [{ text: 'Use [brackets] literally.', translation: 'Usa corchetes literalmente.', gapWord: '[brackets]' }] }} />)

    expect(container.querySelector('mark')).toHaveTextContent('[brackets]')
  })

  it('permite copiar las frases, confirma el éxito y llama a navigator.clipboard', async () => {
    render(<FocusDrillBody body={mockDrillBody} />)

    const copyButton = screen.getByRole('button', { name: /Copiar frases/i })
    fireEvent.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('1. Yesterday I walked to the park.')
    )
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('[Objetivo: walked]')
    )
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Frases copiadas.'))
  })

  it('informa si el portapapeles rechaza la copia', async () => {
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('denied'))
    render(<FocusDrillBody body={mockDrillBody} />)

    fireEvent.click(screen.getByRole('button', { name: /Copiar frases/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron copiar las frases.'))
  })

  it('invoca onStartPractice al pulsar Practicar o Ir a los ejercicios', () => {
    const onStartPractice = vi.fn()
    render(<FocusDrillBody body={mockDrillBody} onStartPractice={onStartPractice} />)

    const practiceButtons = screen.getAllByRole('button', { name: /Practicar|Ir a los ejercicios/i })
    expect(practiceButtons.length).toBeGreaterThan(0)

    fireEvent.click(practiceButtons[0])
    expect(onStartPractice).toHaveBeenCalledTimes(1)
  })

  it('en modo isPracticing muestra el panel de referencia colapsable sin acciones que interrumpan la sesión', () => {
    render(<FocusDrillBody body={mockDrillBody} isPracticing={true} onStartPractice={vi.fn()} />)

    expect(screen.getByText(/Frases de referencia del drill/i)).toBeInTheDocument()
    const consultButton = screen.getByRole('button', { name: /Consultar frases/i })
    expect(consultButton).toBeInTheDocument()

    // Al pulsar consultar, se despliega la lista con las primeras 3
    fireEvent.click(consultButton)
    expect(screen.getByText(/to the park\./)).toBeInTheDocument()
    expect(screen.queryByText(/soccer in the afternoon\./)).not.toBeInTheDocument()

    // Navegación paginada dentro del panel de referencia
    const nextButton = screen.getByRole('button', { name: /Siguientes/i })
    fireEvent.click(nextButton)
    expect(screen.getByText(/soccer in the afternoon\./)).toBeInTheDocument()
    expect(screen.queryByText(/to the park\./)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Practicar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Copiar frases/i })).not.toBeInTheDocument()
  })
})
