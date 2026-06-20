// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('calls onComplete with correctness when an option is chosen', () => {
    const onComplete = vi.fn()
    render(<ReaderExercise passage={passage} online onComplete={onComplete} />)
    fireEvent.click(screen.getByText('home'))
    expect(onComplete).toHaveBeenCalledWith(true)
  })

  it('disables the listen button when offline', () => {
    render(<ReaderExercise passage={passage} online={false} onComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /escuchar/i })).toBeDisabled()
  })
})
