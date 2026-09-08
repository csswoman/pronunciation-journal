// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReaderCatalog } from '../ReaderCatalog'
import type { ReaderPassage } from '@/lib/practice/reader/types'

const mockPassages: ReaderPassage[] = [
  {
    id: 'passage-1',
    userId: 'u1',
    level: 'A2',
    topic: 'Coffee Shop Adventure',
    passage: 'I went to a cozy coffee shop downtown and ordered a warm cappuccino.',
    targetItems: ['coffee', 'ordered'],
    targetSrsIds: ['srs-1', 'srs-2'],
    targetHash: 'hash-1',
    questions: [],
    createdAt: '2026-09-01T10:00:00Z',
    audioUrl: 'https://example.com/audio1.wav',
  },
  {
    id: 'passage-2',
    userId: 'u1',
    level: 'B1',
    topic: 'Space Exploration',
    passage: 'Astronauts spend months training before launching into outer space.',
    targetItems: ['astronauts', 'space'],
    targetSrsIds: ['srs-3', 'srs-4'],
    targetHash: 'hash-2',
    questions: [],
    createdAt: '2026-09-02T12:00:00Z',
    audioUrl: undefined,
  },
]

describe('ReaderCatalog', () => {
  it('renders hero title and story count correctly', () => {
    render(
      <ReaderCatalog
        passages={mockPassages}
        onSelectPassage={vi.fn()}
        onGenerateNew={vi.fn()}
        isGenerating={false}
        online={true}
      />
    )

    expect(screen.getByText('Crea una lectura personalizada')).toBeInTheDocument()
    expect(screen.getByText(/2 historias guardadas/i)).toBeInTheDocument()
    expect(screen.getByText('Coffee Shop Adventure')).toBeInTheDocument()
    expect(screen.getByText('Space Exploration')).toBeInTheDocument()
  })

  it('filters stories when clicking level buttons', async () => {
    const user = userEvent.setup()
    render(
      <ReaderCatalog
        passages={mockPassages}
        onSelectPassage={vi.fn()}
        onGenerateNew={vi.fn()}
        isGenerating={false}
        online={true}
      />
    )

    // Click on A2 filter
    await user.click(screen.getByRole('button', { name: 'A2' }))
    expect(screen.getByText('Coffee Shop Adventure')).toBeInTheDocument()
    expect(screen.queryByText('Space Exploration')).not.toBeInTheDocument()

    // Click on B1 filter
    await user.click(screen.getByRole('button', { name: 'B1' }))
    expect(screen.queryByText('Coffee Shop Adventure')).not.toBeInTheDocument()
    expect(screen.getByText('Space Exploration')).toBeInTheDocument()

    // Click back to TODOS
    await user.click(screen.getByRole('button', { name: 'TODOS' }))
    expect(screen.getByText('Coffee Shop Adventure')).toBeInTheDocument()
    expect(screen.getByText('Space Exploration')).toBeInTheDocument()
  })

  it('filters stories when typing in search input', async () => {
    const user = userEvent.setup()
    render(
      <ReaderCatalog
        passages={mockPassages}
        onSelectPassage={vi.fn()}
        onGenerateNew={vi.fn()}
        isGenerating={false}
        online={true}
      />
    )

    const searchInput = screen.getByPlaceholderText(/Buscar por tema o palabra/i)
    await user.type(searchInput, 'cappuccino')

    expect(screen.getByText('Coffee Shop Adventure')).toBeInTheDocument()
    expect(screen.queryByText('Space Exploration')).not.toBeInTheDocument()
  })

  it('shows empty state message when no stories match filter', async () => {
    const user = userEvent.setup()
    render(
      <ReaderCatalog
        passages={mockPassages}
        onSelectPassage={vi.fn()}
        onGenerateNew={vi.fn()}
        isGenerating={false}
        online={true}
      />
    )

    await user.click(screen.getByRole('button', { name: 'B2' }))
    expect(screen.getByText('No se encontraron historias con este filtro')).toBeInTheDocument()
  })

  it('triggers onSelectPassage when a card is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <ReaderCatalog
        passages={mockPassages}
        onSelectPassage={onSelect}
        onGenerateNew={vi.fn()}
        isGenerating={false}
        online={true}
      />
    )

    await user.click(screen.getByText('Coffee Shop Adventure'))
    expect(onSelect).toHaveBeenCalledWith(mockPassages[0])
  })

  it('triggers onGenerateNew when "Nueva historia ✨" button is clicked', async () => {
    const user = userEvent.setup()
    const onGenerate = vi.fn()

    render(
      <ReaderCatalog
        passages={mockPassages}
        onSelectPassage={vi.fn()}
        onGenerateNew={onGenerate}
        isGenerating={false}
        online={true}
      />
    )

    await user.click(screen.getByRole('button', { name: /Nueva historia ✨/i }))
    expect(onGenerate).toHaveBeenCalledTimes(1)
  })

  it('triggers onDeletePassage when delete button is clicked on a card', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    render(
      <ReaderCatalog
        passages={mockPassages}
        onSelectPassage={vi.fn()}
        onDeletePassage={onDelete}
        onGenerateNew={vi.fn()}
        isGenerating={false}
        online={true}
      />
    )

    const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar lectura' })
    expect(deleteButtons.length).toBe(2)
    await user.click(deleteButtons[0])
    expect(onDelete).toHaveBeenCalledWith(mockPassages[0])
  })
})
