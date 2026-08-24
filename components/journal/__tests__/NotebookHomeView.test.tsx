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
  it('renders header with totals and two equal entry cards in empty state', () => {
    const onSelectMode = vi.fn()
    render(<NotebookHomeView initialData={mockDataWithPast} onSelectMode={onSelectMode} />)

    // 1. Encabezado
    expect(screen.getByRole('heading', { name: 'Tu cuaderno' })).toBeInTheDocument()
    expect(screen.getByText(/3 páginas · 21 frases en inglés/)).toBeInTheDocument()

    // 2. Tarjeta de hoy
    expect(screen.getByText('Página de hoy')).toBeInTheDocument()
    expect(screen.getByText('What conversation do you remember today?')).toBeInTheDocument()
    expect(screen.getByText('¿Qué conversación recuerdas de hoy?')).toBeInTheDocument()

    // Selector de tema: colapsado por defecto, solo el tema activo + "Cambiar tema"
    expect(screen.queryByRole('radiogroup', { name: 'Tema de hoy' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar tema' }))
    expect(screen.getByRole('radiogroup', { name: 'Tema de hoy' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Tu día' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Opinión' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Ficción' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Situaciones' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Vocabulario' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Tema libre' })).toBeInTheDocument()

    // Dos tarjetas de entrada iguales
    expect(screen.getByText('Completar frases')).toBeInTheDocument()
    expect(screen.getByText('Página en blanco')).toBeInTheDocument()

    // Clic en modo guiado
    fireEvent.click(screen.getByText('Completar frases'))
    expect(onSelectMode).toHaveBeenCalledWith('guided')

    // 3. Páginas anteriores
    expect(screen.getByRole('heading', { name: 'Páginas anteriores' })).toBeInTheDocument()
    expect(screen.getByText('I talked to my brother about the flights.')).toBeInTheDocument()
    expect(screen.getByText(/5 frases · 2 palabras nuevas/)).toBeInTheDocument()
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

  it('renders in_progress state with serif preview and resume button', () => {
    const inProgressData: NotebookHome = {
      ...mockDataWithPast,
      today: {
        ...mockDataWithPast.today,
        status: 'in_progress',
        preview: 'I started writing about my morning walk...',
      },
    }

    render(<NotebookHomeView initialData={inProgressData} />)

    expect(screen.getByText('En progreso')).toBeInTheDocument()
    expect(screen.getByText(/I started writing about my morning walk.../)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Seguir editando' })).toBeInTheDocument()
    // No muestra las 2 tarjetas de entrada en este estado
    expect(screen.queryByText('Completar frases')).not.toBeInTheDocument()
  })

  it('renders done state with page stats and view page button', () => {
    const doneData: NotebookHome = {
      ...mockDataWithPast,
      today: {
        ...mockDataWithPast.today,
        status: 'done',
        sentences: 7,
        newWords: 4,
      },
    }

    render(<NotebookHomeView initialData={doneData} />)

    expect(screen.getByText('Terminada')).toBeInTheDocument()
    expect(screen.getByText(/7 frases · 4 palabras nuevas/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver página' })).toBeInTheDocument()
  })

  it('changes prompt dynamically when topic radio or shuffle button is clicked', () => {
    render(<NotebookHomeView initialData={mockDataWithPast} />)

    // Cambiar a "Ficción"
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar tema' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Ficción' }))
    expect(screen.getByText(/letter from 50 years ago/i)).toBeInTheDocument()

    // Barajar
    fireEvent.click(screen.getByRole('button', { name: 'Otra idea' }))
    expect(screen.getByText(/teleport anywhere/i)).toBeInTheDocument()
  })
})
