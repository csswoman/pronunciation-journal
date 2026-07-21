import { describe, expect, it } from 'vitest'
import { makeWordBankEntry } from '@/lib/exercises/__tests__/fixtures/word-bank-entry'
import { selectDailyReviewWords } from '../saved-priority'

describe('selectDailyReviewWords', () => {
  it('puts due items first and caps saved/familiar tiebreaks at two', () => {
    const due = makeWordBankEntry({ id: 'due', srs_status: 'review' })
    const saved = [
      makeWordBankEntry({ id: 'saved-1', is_favorite: true }),
      makeWordBankEntry({ id: 'saved-2', familiarity_status: 'familiar' }),
      makeWordBankEntry({ id: 'saved-3', is_favorite: true }),
    ]
    const newWord = makeWordBankEntry({ id: 'new', srs_status: 'new' })

    const result = selectDailyReviewWords({
      dueWords: [due],
      savedOrFamiliarWords: saved,
      newWords: [newWord],
      limit: 6,
    })

    expect(result.words.map((word) => word.id)).toEqual(['due', 'saved-1', 'saved-2', 'new'])
    expect([...result.savedOrFamiliarIds]).toEqual(['saved-1', 'saved-2'])
  })

  it('deduplicates a saved item that is also due without changing its review date', () => {
    const due = makeWordBankEntry({ id: 'same', srs_status: 'review', next_review_at: '2026-07-20T00:00:00.000Z' })
    const result = selectDailyReviewWords({
      dueWords: [due],
      savedOrFamiliarWords: [makeWordBankEntry({ id: 'same', is_favorite: true })],
      newWords: [],
      limit: 3,
    })

    expect(result.words).toHaveLength(1)
    expect(result.words[0]?.next_review_at).toBe('2026-07-20T00:00:00.000Z')
    expect(result.savedOrFamiliarIds.size).toBe(0)
  })
})
