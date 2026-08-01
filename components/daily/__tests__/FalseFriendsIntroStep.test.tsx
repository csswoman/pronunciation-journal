// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FalseFriendsIntroStep } from '../FalseFriendsIntroStep'
import type { FalseFriendIntro } from '@/lib/practice/study-card/model'

const speak = vi.fn()
vi.mock('@/lib/phoneme-practice/tts', () => ({
  speak: (...args: unknown[]) => speak(...args),
}))

function pair(overrides: Partial<FalseFriendIntro> = {}): FalseFriendIntro {
  return {
    word: 'actually',
    looksLike: 'actualmente',
    actualMeaning: 'en realidad',
    correctWord: 'currently',
    levelBadge: 'A2',
    ...overrides,
  }
}

beforeEach(() => {
  speak.mockClear()
})

describe('FalseFriendsIntroStep', () => {
  it('shows the contrast: the trap, what it is not, and what it means', () => {
    render(<FalseFriendsIntroStep pairs={[pair()]} onComplete={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'actually' })).toBeTruthy()
    expect(screen.getByText('actualmente')).toBeTruthy()
    expect(screen.getByText('en realidad')).toBeTruthy()
  })

  it('shows the word to use instead', () => {
    render(<FalseFriendsIntroStep pairs={[pair()]} onComplete={vi.fn()} />)
    expect(screen.getByText('currently')).toBeTruthy()
  })

  it('renders the level badge when present', () => {
    render(<FalseFriendsIntroStep pairs={[pair()]} onComplete={vi.fn()} />)
    expect(screen.getByText('A2')).toBeTruthy()
  })

  it('renders an optional note only when the pair has one', () => {
    const { rerender } = render(<FalseFriendsIntroStep pairs={[pair()]} onComplete={vi.fn()} />)
    expect(screen.queryByText(/riesgo/i)).toBeNull()

    rerender(
      <FalseFriendsIntroStep
        pairs={[pair({ note: 'Error de alto riesgo social.' })]}
        onComplete={vi.fn()}
      />,
    )
    expect(screen.getByText('Error de alto riesgo social.')).toBeTruthy()
  })

  it('advances through pairs before completing', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(
      <FalseFriendsIntroStep
        pairs={[pair(), pair({ word: 'embarrassed', looksLike: 'embarazada' })]}
        onComplete={onComplete}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(screen.getByRole('heading', { name: 'embarrassed' })).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('labels the last card "Practicar" and completes on click', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<FalseFriendsIntroStep pairs={[pair()]} onComplete={onComplete} />)

    await user.click(screen.getByRole('button', { name: 'Practicar' }))
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('speaks the word when the listen button is pressed', async () => {
    const user = userEvent.setup()
    render(<FalseFriendsIntroStep pairs={[pair()]} onComplete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Escuchar actually' }))
    expect(speak).toHaveBeenCalledWith('actually')
  })

  it('completes immediately when there is nothing to present', () => {
    const onComplete = vi.fn()
    render(<FalseFriendsIntroStep pairs={[]} onComplete={onComplete} />)
    expect(onComplete).toHaveBeenCalledOnce()
  })
})
