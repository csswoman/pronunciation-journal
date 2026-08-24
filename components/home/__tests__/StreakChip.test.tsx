// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StreakChip from '../StreakChip'

const playUiCue = vi.fn()
vi.mock('@/lib/ui-sounds/cues', () => ({
  playUiCue: (...args: unknown[]) => playUiCue(...args),
}))

beforeEach(() => {
  playUiCue.mockClear()
})

describe('StreakChip', () => {
  it('does not animate or play a cue on first mount', () => {
    render(<StreakChip days={3} />)
    const count = screen.getByText('3 días')
    expect(count.classList.contains('animate-notification-bounce')).toBe(false)
    expect(playUiCue).not.toHaveBeenCalled()
  })

  it('animates and plays the streak cue when days increases', () => {
    const { rerender } = render(<StreakChip days={3} />)
    rerender(<StreakChip days={4} />)

    const count = screen.getByText('4 días')
    expect(count.classList.contains('animate-notification-bounce')).toBe(true)
    expect(playUiCue).toHaveBeenCalledWith('streak')
  })

  it('does not animate when days decreases', () => {
    const { rerender } = render(<StreakChip days={5} />)
    rerender(<StreakChip days={1} />)

    const count = screen.getByText('1 día')
    expect(count.classList.contains('animate-notification-bounce')).toBe(false)
    expect(playUiCue).not.toHaveBeenCalled()
  })
})
