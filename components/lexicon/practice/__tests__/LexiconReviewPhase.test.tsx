// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LexiconReviewPhase } from '../LexiconReviewPhase'
import type { WordBankEntry } from '@/lib/word-bank/types'

const applyFlashcardRatingMock = vi.fn()

vi.mock('@/lib/word-bank/srs-queries', () => ({
  applyFlashcardRating: (...args: unknown[]) => applyFlashcardRatingMock(...args),
}))
vi.mock('../LexiconFlashcard', () => ({
  LexiconFlashcard: ({ onRate }: { onRate: (rating: 'forgot') => void }) => (
    <button type="button" onClick={() => onRate('forgot')}>Rate forgot</button>
  ),
}))

const entry = {
  id: 'word-1',
  user_id: 'user-1',
  text: 'example',
  source_ref: 'lex-1',
  meaning: 'an example',
} as WordBankEntry

describe('LexiconReviewPhase', () => {
  it('does not advance or report completion when saving the rating fails', async () => {
    applyFlashcardRatingMock.mockRejectedValueOnce(new Error('offline'))
    const onComplete = vi.fn()
    render(
      <LexiconReviewPhase
        entries={[entry]}
        userId="user-1"
        onComplete={onComplete}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Rate forgot' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo guardar/i)
    expect(onComplete).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Rate forgot' })).toBeEnabled())
  })
})
