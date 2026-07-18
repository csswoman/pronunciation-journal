// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReviewCompleteBanner } from '../ReviewCompleteBanner'

const playUiCue = vi.fn()

vi.mock('@/lib/ui-sounds/cues', () => ({
  playUiCue: (...args: unknown[]) => playUiCue(...args),
}))

beforeEach(() => {
  playUiCue.mockClear()
})

describe('ReviewCompleteBanner', () => {
  it('celebrates with sparkle when items were reviewable', () => {
    render(<ReviewCompleteBanner hadReviewableItems />)
    expect(screen.getByRole('status')).toHaveTextContent('¡Repaso hecho!')
    expect(playUiCue).toHaveBeenCalledWith('correct')
  })

  it('uses a softer cue when nothing was due', () => {
    render(<ReviewCompleteBanner hadReviewableItems={false} />)
    expect(playUiCue).toHaveBeenCalledWith('soft')
  })
})
