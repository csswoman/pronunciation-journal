import { describe, it, expect } from 'vitest'
import { generateReorderWordsFromWordBank } from '../reorder-words'
import type { WordBankEntry } from '@/lib/word-bank/types'

function makeEntry(overrides: Partial<WordBankEntry> = {}): WordBankEntry {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    text: 'ephemeral',
    meaning: 'lasting for a very short time',
    translation: null,
    ipa: null,
    example: 'The ephemeral beauty of cherry blossoms.',
    synonyms: null,
    image_prompt: null,
    difficulty: 3,
    srs_status: 'new',
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_at: null,
    last_reviewed_at: null,
    status: 'ready',
    error_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_audio: false,
    audio_url: null,
    context: null,
    audio_fetch_attempts: 0,
    review_count: 0,
    source: null,
    source_ref: null,
    ...overrides,
  }
}

describe('generateReorderWordsFromWordBank', () => {
  it('discards entries without an example sentence', () => {
    const entries = [
      makeEntry({ id: '1', example: 'She was walking down the long street.' }),
      makeEntry({ id: '2', example: null }),
      makeEntry({ id: '3', example: null }),
    ]
    const results = generateReorderWordsFromWordBank(entries, 10)
    expect(results).toHaveLength(1)
  })

  it('discards entries with fewer than 4 tokens', () => {
    const entries = [
      makeEntry({ id: '1', example: 'Too short.' }),
      makeEntry({ id: '2', example: 'Also only three words.' }),
      makeEntry({ id: '3', example: 'She walked to the market yesterday.' }),
    ]
    const results = generateReorderWordsFromWordBank(entries, 10)
    expect(results).toHaveLength(2)
  })

  it('tokens contain all words from the original sentence', () => {
    const entries = [
      makeEntry({ id: '1', example: 'The ephemeral beauty of cherry blossoms.' }),
    ]
    const [ex] = generateReorderWordsFromWordBank(entries, 1)
    expect(ex.tokens.slice().sort()).toEqual(
      ['The', 'ephemeral', 'beauty', 'of', 'cherry', 'blossoms.'].sort()
    )
  })

  it('shuffled tokens differ from the original order', () => {
    // Use a long sentence to make same-order collision practically impossible.
    const sentence = 'She was walking down the long and winding road yesterday.'
    const entries = Array.from({ length: 1 }, (_, i) =>
      makeEntry({ id: String(i), example: sentence })
    )
    const [ex] = generateReorderWordsFromWordBank(entries, 1)
    expect(ex.tokens.join(' ')).not.toBe(sentence)
  })

  it('sentence field matches the original example exactly', () => {
    const sentence = 'She was running through the park.'
    const entry = makeEntry({ id: 'abc', example: sentence })
    const [ex] = generateReorderWordsFromWordBank([entry], 1)
    expect(ex.sentence).toBe(sentence)
  })

  it('sets sourceRef to word_bank with the entry id', () => {
    const entry = makeEntry({ id: 'my-id-123', example: 'He walked into the store quickly.' })
    const [ex] = generateReorderWordsFromWordBank([entry], 1)
    expect(ex.sourceRef.source).toBe('word_bank')
    expect(ex.sourceRef.id).toBe('my-id-123')
  })

  it('respects the count parameter', () => {
    const entries = Array.from({ length: 8 }, (_, i) =>
      makeEntry({ id: String(i), example: `She walked to the market on day ${i}.` })
    )
    expect(generateReorderWordsFromWordBank(entries, 3)).toHaveLength(3)
    expect(generateReorderWordsFromWordBank(entries, 6)).toHaveLength(6)
  })

  it('returns fewer than count when not enough usable entries', () => {
    const entries = [
      makeEntry({ id: '1', example: 'She walked to the store.' }),
    ]
    expect(generateReorderWordsFromWordBank(entries, 5)).toHaveLength(1)
  })

  it('produces deterministic ids for same input', () => {
    const entry = makeEntry({ id: 'stable-id', example: 'He ran across the bridge.' })
    const [a] = generateReorderWordsFromWordBank([entry], 1)
    const [b] = generateReorderWordsFromWordBank([entry], 1)
    expect(a.id).toBe(b.id)
  })
})
