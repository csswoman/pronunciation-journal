// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NotebookHomeView } from '@/components/journal/NotebookHomeView'
import type { NotebookHome } from '@/lib/journal/notebook-types'

const mockDataWithPast: NotebookHome = {
  totals: { pages: 3, sentences: 21 },
  today: {
    date: '2026-08-23',
    status: 'empty',
    topic: 'daily',
    prompt: {
      en: 'What conversation do you remember today?',
      es: '¿Qué conversación recuerdas de hoy?',
    },
  },
  pastPages: [
    {
      id: 'p-1',
      date: '22 ago',
      firstLine: 'I talked to my brother about the flights.',
      sentences: 5,
      newWords: 2,
      status: 'unreviewed',
    },
  ],
}

const mockDataFirstUse: NotebookHome = {
  totals: { pages: 0, sentences: 0 },
  today: {
    date: '2026-08-23',
    status: 'empty',
    topic: 'daily',
    prompt: {
      en: 'What was one small win from your day?',
      es: '¿Cuál fue un pequeño logro de tu día?',
    },
  },
  pastPages: [],
}

describe('NotebookHomeView ("Tu cuaderno")', () => {
  it('renders header with totals, prompt, writing area, and pronunciation card', () => {
    const onSelectMode = vi.fn()
    render(<NotebookHomeView initialData={mockDataWithPast} onSelectMode={onSelectMode} />)

    // 1. Encabezado
    expect(screen.getByRole('heading', { name: 'Tu cuaderno' })).toBeInTheDocument()
    expect(screen.getByText(/3 páginas · 21 frases en inglés/)).toBeInTheDocument()

    // 2. Tarjeta de hoy
    expect(screen.getByText('PÁGINA DE HOY')).toBeInTheDocument()
    expect(screen.getByText('What conversation do you remember today?')).toBeInTheDocument()
    expect(screen.getByText('¿Qué conversación recuerdas de hoy?')).toBeInTheDocument()

    // Acciones de prompt
    expect(screen.getByRole('button', { name: /Otra pregunta/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cambiar de tema/i })).toBeInTheDocument()

    // Control de pestañas
    expect(screen.getByRole('tab', { name: 'Con estructura' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Página en blanco' })).toBeInTheDocument()

    // Switch de teclado en inglés
    expect(screen.getByRole('switch')).toBeInTheDocument()

    // Diario de pronunciación
    expect(screen.getByRole('heading', { name: 'Diario de pronunciación' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Añadir palabra' })).toBeInTheDocument()

    // 3. Páginas anteriores
    expect(screen.getByRole('heading', { name: 'Páginas anteriores' })).toBeInTheDocument()
    expect(screen.getByText('I talked to my brother about the flights.')).toBeInTheDocument()
    expect(screen.getByText('Sin revisar')).toBeInTheDocument()
  })

  it('handles first use state cleanly without past pages or totals', () => {
    render(<NotebookHomeView initialData={mockDataFirstUse} />)

    expect(screen.getByRole('heading', { name: 'Tu cuaderno' })).toBeInTheDocument()
    // No muestra acumulado en primer uso
    expect(screen.queryByText(/frases en inglés/)).not.toBeInTheDocument()
    // Muestra copy de primera página
    expect(screen.getByText('Esta es tu primera página.')).toBeInTheDocument()
    // No muestra sección de páginas anteriores
    expect(screen.queryByRole('heading', { name: 'Páginas anteriores' })).not.toBeInTheDocument()
  })

  it('changes prompt dynamically when topic radio or shuffle button is clicked', () => {
    render(<NotebookHomeView initialData={mockDataWithPast} />)

    // Cambiar a "Ficción"
    fireEvent.click(screen.getByRole('button', { name: /Cambiar de tema/i }))
    fireEvent.click(screen.getByRole('radio', { name: 'Ficción' }))
    expect(screen.getByText(/letter from 50 years ago/i)).toBeInTheDocument()

    // Otra pregunta
    fireEvent.click(screen.getByRole('button', { name: /Otra pregunta/i }))
    expect(screen.getByText(/teleport anywhere/i)).toBeInTheDocument()
  })

  it('opens pronunciation modal when + Añadir palabra button is clicked', () => {
    render(<NotebookHomeView initialData={mockDataWithPast} />)

    fireEvent.click(screen.getByRole('button', { name: '+ Añadir palabra' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Añadir a Diario de pronunciación' })).toBeInTheDocument()
  })
})
