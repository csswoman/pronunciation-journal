import { describe, expect, it } from 'vitest'
import { normalizeWordRow, normalizeSoundRow, normalizeSentenceRow } from '@/lib/review/srs-history-queries'

describe('normalizeWordRow', () => {
  it('builds a SrsHistoryItem from a word_bank row', () => {
    const row = {
      id: 'abc-123',
      text: 'although',
      translation: 'aunque',
      interval_days: 4,
      next_review_at: '2026-06-22T00:00:00Z',
      last_reviewed_at: '2026-06-18T10:00:00Z',
    }
    const item = normalizeWordRow(row)
    expect(item.id).toBe('words:abc-123')
    expect(item.domain).toBe('words')
    expect(item.label).toBe('although')
    expect(item.sublabel).toBe('aunque')
    expect(item.intervalDays).toBe(4)
    expect(item.nextReviewAt).toBe('2026-06-22T00:00:00Z')
    expect(item.lastPracticedAt).toBe('2026-06-18T10:00:00Z')
  })

  it('omits sublabel when translation is null', () => {
    const row = {
      id: 'abc-123',
      text: 'run',
      translation: null,
      interval_days: 1,
      next_review_at: null,
      last_reviewed_at: '2026-06-18T10:00:00Z',
    }
    const item = normalizeWordRow(row)
    expect(item.sublabel).toBeUndefined()
    expect(item.nextReviewAt).toBeNull()
  })
})

describe('normalizeSoundRow', () => {
  it('builds a SrsHistoryItem from a user_contrast_progress row', () => {
    const row = {
      contrast_id: 'iː|ɪ',
      interval_days: 3,
      next_review: '2026-06-21T00:00:00Z',
      updated_at: '2026-06-18T09:00:00Z',
      ipa: '/iː/',
      example: 'beat',
    }
    const item = normalizeSoundRow(row)
    expect(item.id).toBe('sounds:iː|ɪ')
    expect(item.domain).toBe('sounds')
    expect(item.label).toBe('/iː/')
    expect(item.sublabel).toBe('beat')
    expect(item.intervalDays).toBe(3)
    expect(item.nextReviewAt).toBe('2026-06-21T00:00:00Z')
  })
})

describe('normalizeSentenceRow', () => {
  it('uses target_word as label when available', () => {
    const row = {
      content_id: 'text_fragments:cs-linking',
      answered_at: '2026-06-18T08:00:00Z',
      target_word: 'I want to go',
      user_answer: 'I wan to go',
    }
    const item = normalizeSentenceRow(row)
    expect(item).not.toBeNull()
    expect(item!.id).toBe('sentences:text_fragments:cs-linking')
    expect(item!.domain).toBe('sentences')
    expect(item!.label).toBe('I want to go')
    expect(item!.intervalDays).toBe(0)
    expect(item!.nextReviewAt).toBeNull()
  })

  it('falls back to user_answer when target_word is empty', () => {
    const row = {
      content_id: 'word_bank:abc',
      answered_at: '2026-06-18T08:00:00Z',
      target_word: '',
      user_answer: 'she goes',
    }
    const item = normalizeSentenceRow(row)
    expect(item!.label).toBe('she goes')
  })

  it('returns null when content_id is null', () => {
    const row = {
      content_id: null,
      answered_at: '2026-06-18T08:00:00Z',
      target_word: 'test',
      user_answer: null,
    }
    expect(normalizeSentenceRow(row)).toBeNull()
  })
})
