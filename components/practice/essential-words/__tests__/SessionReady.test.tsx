// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionReady } from '../SessionReady'

describe('SessionReady', () => {
  it('shows the total word count, time estimate, and per-kind stats', () => {
    render(
      <SessionReady
        counts={{ newRemaining: 8, learningRemaining: 0, reviewRemaining: 16 }}
        vaulted={8}
        onBegin={vi.fn()}
      />,
    )

    expect(screen.getByText('Hoy te tocan 24 palabras')).toBeTruthy()
    expect(screen.getAllByText('8')).toHaveLength(2)
    expect(screen.getByText('16')).toBeTruthy()
    expect(screen.getByText('En el baúl')).toBeTruthy()
  })

  it('describes the block structure when there are new words', () => {
    render(
      <SessionReady
        counts={{ newRemaining: 8, learningRemaining: 0, reviewRemaining: 16 }}
        vaulted={8}
        onBegin={vi.fn()}
      />,
    )

    expect(
      screen.getByText('3 bloques de palabras nuevas, más los repasos y una ronda final'),
    ).toBeTruthy()
  })

  it('omits the structure note when there are no new words', () => {
    render(
      <SessionReady
        counts={{ newRemaining: 0, learningRemaining: 0, reviewRemaining: 5 }}
        vaulted={0}
        onBegin={vi.fn()}
      />,
    )

    expect(screen.queryByText(/bloques de palabras nuevas/)).toBeNull()
  })

  it('calls onBegin when Empezar is pressed', async () => {
    const user = userEvent.setup()
    const onBegin = vi.fn()
    render(
      <SessionReady
        counts={{ newRemaining: 3, learningRemaining: 0, reviewRemaining: 0 }}
        vaulted={0}
        onBegin={onBegin}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Empezar' }))

    expect(onBegin).toHaveBeenCalledOnce()
  })
})
