// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReaderExercise } from '../ReaderExercise'
import type { ReaderPassage } from '@/lib/practice/reader/types'

vi.mock('@/lib/practice/reader/exposure', () => ({
  recordReaderExposure: vi.fn(async () => {}),
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
})

describe('ReaderExercise', () => {
  it('renders the passage text and the question', () => {
    render(<ReaderExercise passage={passage} online onComplete={vi.fn()} />)
    expect(screen.getByText('The cat went home.')).toBeInTheDocument()
    expect(screen.getByText('Where did the cat go?')).toBeInTheDocument()
  })

  it('calls onComplete with correctness when an option is chosen', async () => {
    const onComplete = vi.fn(async () => {})
    render(<ReaderExercise passage={passage} online onComplete={onComplete} />)
    fireEvent.click(screen.getByText('home'))
    expect(screen.getByRole('status')).toHaveTextContent(/saving progress/i)
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/cuenta en tu progreso/i))
  })

  it('shows actionable feedback for an incorrect answer', async () => {
    render(<ReaderExercise passage={passage} online onComplete={vi.fn(async () => {})} />)
    fireEvent.click(screen.getByText('park'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/revisa el texto/i))
  })

  it('keeps the answer visible and warns when progress save fails', async () => {
    render(<ReaderExercise passage={passage} online onComplete={vi.fn(async () => { throw new Error('offline') })} />)
    fireEvent.click(screen.getByText('home'))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/progress could not be saved/i))
    expect(screen.getByRole('status')).toHaveTextContent(/cuenta en tu progreso/i)
  })

  it('disables the listen button when offline', () => {
    render(<ReaderExercise passage={passage} online={false} onComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /escuchar/i })).toBeDisabled()
  })
})
