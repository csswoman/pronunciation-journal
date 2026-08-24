// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const quickAddWord = vi.fn()
vi.mock('@/lib/word-bank/queries', () => ({
  quickAddWord: (...args: unknown[]) => quickAddWord(...args),
}))

import { SuggestedWords } from '@/components/journal/SuggestedWords'

beforeEach(() => {
  quickAddWord.mockReset()
})

describe('SuggestedWords', () => {
  it('renders nothing when there are no candidates', () => {
    const { container } = render(<SuggestedWords words={[' ', '']} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('adds a single word on opt-in without touching the others', async () => {
    quickAddWord.mockResolvedValue({})
    render(<SuggestedWords words={['commute', 'deadline']} />)

    fireEvent.click(screen.getByRole('button', { name: /commute/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /commute/i })).toHaveAttribute('aria-pressed', 'true')
    })
    expect(quickAddWord).toHaveBeenCalledTimes(1)
    expect(quickAddWord).toHaveBeenCalledWith({ text: 'commute', source: 'manual' })
  })

  it('shows the next review returned by word_bank after opt-in', async () => {
    const nextReviewAt = new Date(Date.now() + 86_400_000).toISOString()
    quickAddWord.mockResolvedValue({ next_review_at: nextReviewAt })
    render(<SuggestedWords words={['commute']} />)

    fireEvent.click(screen.getByRole('button', { name: /commute/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /la ves de nuevo mañana/i })).toBeDisabled()
    })
  })

  it('marks only the failed word as error and keeps the rest usable', async () => {
    quickAddWord.mockRejectedValueOnce(new Error('boom'))
    render(<SuggestedWords words={['commute', 'deadline']} />)

    const commute = screen.getByRole('button', { name: /commute/i })
    fireEvent.click(commute)

    await waitFor(() => {
      expect(commute).toHaveAttribute('aria-pressed', 'false')
    })
    // The other candidate stays available.
    expect(screen.getByRole('button', { name: /deadline/i })).not.toBeDisabled()
  })

  it('dedupes repeated candidates', () => {
    render(<SuggestedWords words={['commute', 'commute']} />)
    expect(screen.getAllByRole('button', { name: /commute/i })).toHaveLength(1)
  })
})
