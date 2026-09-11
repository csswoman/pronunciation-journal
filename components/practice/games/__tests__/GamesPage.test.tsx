// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GameCard from '../GameCard'
import UpcomingGamesPanel from '../UpcomingGamesPanel'
import { PRACTICE_GAMES, UPCOMING_GAMES } from '@/lib/practice/practice-games'

vi.mock('@/lib/db', () => ({
  setLastPracticeMode: vi.fn(),
}))

describe('games catalogue', () => {
  it('links every playable game to a route that exists under /practice', () => {
    render(
      <>
        {PRACTICE_GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </>,
    )

    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))

    expect(hrefs).toEqual(['/practice/word-search', '/practice/word-rain'])
  })

  it('renders upcoming games as inert text, not links', () => {
    render(<UpcomingGamesPanel />)

    expect(screen.queryAllByRole('link')).toHaveLength(0)
    for (const game of UPCOMING_GAMES) {
      expect(screen.getByText(game.title)).toBeInTheDocument()
    }
  })
})
