// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GamesSection from '../GamesSection'

import { PRACTICE_GAMES } from '@/lib/practice/practice-games'

vi.mock('@/lib/practice/last-practice-mode', () => ({
  setLastPracticeMode: vi.fn(),
}))

describe('GamesSection', () => {
  it('renders available count badge and active games', () => {
    render(<GamesSection />)

    expect(screen.getByText(`${PRACTICE_GAMES.length} disponibles`)).toBeInTheDocument()
    expect(screen.getByText('Sopa de letras')).toBeInTheDocument()
    expect(screen.getByText('Lluvia de palabras')).toBeInTheDocument()

    const wordRainLink = screen.getByText('Lluvia de palabras').closest('a')
    expect(wordRainLink).toHaveAttribute('href', '/practice/word-rain')

    const wordSearchLink = screen.getByText('Sopa de letras').closest('a')
    expect(wordSearchLink).toHaveAttribute('href', '/practice/games')
  })
})
