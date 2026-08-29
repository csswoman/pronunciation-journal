// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LexiconFlashcard } from '../LexiconFlashcard'

vi.mock('@/lib/phoneme-practice/tts', () => ({
  speak: vi.fn(),
}))

describe('LexiconFlashcard', () => {
  const defaultProps = {
    word: 'hello',
    definition: 'a greeting',
    cardNumber: 1,
    totalCards: 5,
    onRate: vi.fn(),
  }

  it('renders front of card initially and reveals back on click', () => {
    render(<LexiconFlashcard {...defaultProps} />)
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.queryByText('a greeting')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('hello'))
    expect(screen.getByText('a greeting')).toBeInTheDocument()
  })

  it('invokes onRate without resetting revealed state prematurely when a rating option is clicked', () => {
    const onRate = vi.fn()
    render(<LexiconFlashcard {...defaultProps} onRate={onRate} />)

    // Reveal card
    fireEvent.click(screen.getByText('hello'))
    expect(screen.getByText('a greeting')).toBeInTheDocument()

    // Click rating button
    fireEvent.click(screen.getByRole('button', { name: /la domino/i }))
    expect(onRate).toHaveBeenCalledWith('known')
    // Card back remains visible until parent component changes card key/props
    expect(screen.getByText('a greeting')).toBeInTheDocument()
  })

  it('disables rating buttons and ignores clicks when disabled is true', () => {
    const onRate = vi.fn()
    render(<LexiconFlashcard {...defaultProps} onRate={onRate} disabled />)

    // Reveal card
    fireEvent.click(screen.getByText('hello'))

    const ratingBtn = screen.getByRole('button', { name: /la domino/i })
    expect(ratingBtn).toBeDisabled()

    fireEvent.click(ratingBtn)
    expect(onRate).not.toHaveBeenCalled()
  })
})
