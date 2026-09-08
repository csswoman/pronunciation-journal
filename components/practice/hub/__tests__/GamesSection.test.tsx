// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GamesSection from '../GamesSection'

vi.mock('@/lib/db', () => ({
  setLastPracticeMode: vi.fn(),
}))

describe('GamesSection', () => {
  it('renders available count badge and active games', () => {
    render(<GamesSection />)

    expect(screen.getByText('2 disponibles')).toBeInTheDocument()
    expect(screen.getByText('Sopa de letras')).toBeInTheDocument()
    expect(screen.getByText('Lluvia de palabras')).toBeInTheDocument()

    const wordRainLink = screen.getByText('Lluvia de palabras').closest('a')
    expect(wordRainLink).toHaveAttribute('href', '/practice/word-rain')

    const wordSearchLink = screen.getByText('Sopa de letras').closest('a')
    expect(wordSearchLink).toHaveAttribute('href', '/practice/word-search')
  })
})
