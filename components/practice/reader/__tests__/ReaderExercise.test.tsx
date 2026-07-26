// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReaderExercise } from '../ReaderExercise'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import { previewWord } from '@/lib/word-bank/queries'

vi.mock('@/lib/practice/reader/exposure', () => ({
  recordReaderExposure: vi.fn(async () => {}),
}))

vi.mock('@/lib/word-bank/queries', () => ({
  previewWord: vi.fn(async () => ({
    enrichment: {
      meaning: 'a group of things held together',
      translation: 'conjunto',
      ipa: '/ˈbʌndəl/',
      example: 'She carried a bundle of books.',
      synonyms: ['group'],
      image_prompt: 'books tied together',
    },
    source: 'dictionary',
    alreadySaved: false,
  })),
  quickAddWord: vi.fn(async () => ({})),
}))

const passage: ReaderPassage = {
  id: 'p1', userId: 'u1', targetItems: ['go'], targetSrsIds: ['c1k:go'], targetHash: 'h', topic: 'animals',
  passage: 'The cat went home.',
  questions: [{ prompt: 'Where did the cat go?', options: ['home', 'park', 'shop', 'school'], correctIndex: 0 }],
  level: 'B1', createdAt: '2030-01-01T00:00:00.000Z',
}

beforeEach(() => {
  // jsdom has no speechSynthesis; stub it so speak() never throws.
  vi.stubGlobal('speechSynthesis', { speak: vi.fn() })
  vi.stubGlobal('SpeechSynthesisUtterance', class { lang = '' })
  vi.mocked(previewWord).mockResolvedValue({
    enrichment: {
      meaning: 'a group of things held together',
      translation: 'conjunto',
      ipa: '/ˈbʌndəl/',
      example: 'She carried a bundle of books.',
      synonyms: ['group'],
      image_prompt: 'books tied together',
    },
    source: 'dictionary',
    alreadySaved: false,
  })
})

describe('ReaderExercise', () => {
  it('renders the passage text and the question', () => {
    const { container } = render(<ReaderExercise passage={passage} online onComplete={vi.fn()} />)
    expect(container.querySelector('.text-lg')?.textContent).toBe('The cat went home.')
    expect(screen.getByText('Toca cualquier palabra para ver su significado.')).toBeInTheDocument()
    expect(screen.getByText('Where did the cat go?')).toBeInTheDocument()
  })

  it('keeps inactive words visually quiet and highlights only the open word', () => {
    render(<ReaderExercise passage={passage} online onComplete={vi.fn()} />)
    const cat = screen.getByRole('button', { name: 'Opciones para cat' })
    expect(cat).not.toHaveClass('underline')
    fireEvent.click(cat)
    expect(cat).toHaveClass('bg-primary-soft')
  })

  it('calls onComplete with correctness when an option is chosen', async () => {
    const onComplete = vi.fn(async () => {})
    render(<ReaderExercise passage={passage} online onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: 'home' }))
    expect(screen.getByRole('status')).toHaveTextContent(/saving progress/i)
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/cuenta en tu progreso/i))
  })

  it('shows actionable feedback for an incorrect answer', async () => {
    render(<ReaderExercise passage={passage} online onComplete={vi.fn(async () => {})} />)
    fireEvent.click(screen.getByRole('button', { name: 'park' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/revisa el texto/i))
  })

  it('keeps the answer visible and warns when progress save fails', async () => {
    render(<ReaderExercise passage={passage} online onComplete={vi.fn(async () => { throw new Error('offline') })} />)
    fireEvent.click(screen.getByRole('button', { name: 'home' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/progress could not be saved/i))
    expect(screen.getByRole('status')).toHaveTextContent(/cuenta en tu progreso/i)
  })

  it('disables the listen button when offline', () => {
    render(<ReaderExercise passage={passage} online={false} onComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /escuchar/i })).toBeDisabled()
  })

  it('offers to save a passage word and keeps its sentence as context', async () => {
    const { quickAddWord } = await import('@/lib/word-bank/queries')
    render(<ReaderExercise passage={passage} online onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Opciones para cat' }))
    await waitFor(() => expect(screen.getByText('a group of things held together')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(quickAddWord).toHaveBeenCalledWith({
      text: 'cat', context: 'The cat went home.', source: 'reader', enrichment: expect.objectContaining({ translation: 'conjunto' }),
    }))
    expect(screen.getByRole('button', { name: 'Ya guardada' })).toBeDisabled()
  })

  it('shows an English definition and Spanish translation before saving', async () => {
    render(<ReaderExercise passage={passage} online onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Opciones para cat' }))
    expect(await screen.findByText('a group of things held together')).toBeInTheDocument()
    expect(screen.getByText('conjunto')).toBeInTheDocument()
  })

  it('does not offer a second save for a word already in My Words', async () => {
    const { previewWord } = await import('@/lib/word-bank/queries')
    vi.mocked(previewWord).mockResolvedValueOnce({
      enrichment: { meaning: 'a pet animal', translation: 'gato', ipa: '', example: '', synonyms: [], image_prompt: '' },
      source: 'my_words',
      alreadySaved: true,
    })
    render(<ReaderExercise passage={passage} online onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Opciones para cat' }))
    expect(await screen.findByText('En Mis palabras')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ya guardada' })).toBeDisabled()
  })

  it('closes the active word card before opening another one', () => {
    render(<ReaderExercise passage={passage} online onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Opciones para cat' }))
    expect(screen.getByRole('dialog', { name: 'Guardar cat' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Opciones para went' }))
    expect(screen.queryByRole('dialog', { name: 'Guardar cat' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Guardar went' })).toBeInTheDocument()
  })

  it('renders Markdown bold markers as emphasis instead of visible asterisks', () => {
    const emphasizedPassage = { ...passage, passage: 'A **bundle** is many bricks together.' }
    const { container } = render(<ReaderExercise passage={emphasizedPassage} online onComplete={vi.fn()} />)
    expect(container.querySelector('.text-lg')?.textContent).toBe('A bundle is many bricks together.')
    expect(screen.getByRole('button', { name: 'Opciones para bundle' }).closest('strong')).not.toBeNull()
  })

  it('explains that saving needs a connection', () => {
    render(<ReaderExercise passage={passage} online={false} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Opciones para cat' }))
    expect(screen.getByText(/requiere conexión/i)).toBeInTheDocument()
  })
})
