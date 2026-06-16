import { describe, it, expect } from 'vitest'
import { generateReorderWordsFromWordBank } from '../reorder-words'
import { makeReorderEligibleEntry, makeWordBankEntry } from '@/lib/exercises/__tests__/fixtures/word-bank-entry'

describe('generateReorderWordsFromWordBank', () => {
  it('discards entries without an example sentence', () => {
    const entries = [
      makeReorderEligibleEntry({ id: '1', example: 'She was walking down the long street.' }),
      makeWordBankEntry({ id: '2', example: null }),
      makeWordBankEntry({ id: '3', example: null }),
    ]
    const results = generateReorderWordsFromWordBank(entries, 10)
    expect(results).toHaveLength(1)
  })

  it('discards entries with fewer than 4 tokens', () => {
    const entries = [
      makeWordBankEntry({ id: '1', example: 'Too short.' }),
      makeWordBankEntry({ id: '2', example: 'Also only three words.' }),
      makeReorderEligibleEntry({ id: '3', example: 'She walked to the market yesterday.' }),
    ]
    const results = generateReorderWordsFromWordBank(entries, 10)
    expect(results).toHaveLength(2)
  })

  it('tokens contain all words from the original sentence', () => {
    const entries = [
      makeWordBankEntry({ id: '1', example: 'The ephemeral beauty of cherry blossoms.' }),
    ]
    const [ex] = generateReorderWordsFromWordBank(entries, 1)
    expect(ex.tokens.slice().sort()).toEqual(
      ['The', 'ephemeral', 'beauty', 'of', 'cherry', 'blossoms.'].sort(),
    )
  })

  it('shuffled tokens differ from the original order', () => {
    const sentence = 'She was walking down the long and winding road yesterday.'
    const entries = [makeReorderEligibleEntry({ id: '0', example: sentence })]
    const [ex] = generateReorderWordsFromWordBank(entries, 1)
    expect(ex.tokens.join(' ')).not.toBe(sentence)
  })

  it('sentence field matches the original example exactly', () => {
    const sentence = 'She was running through the park.'
    const entry = makeReorderEligibleEntry({ id: 'abc', example: sentence })
    const [ex] = generateReorderWordsFromWordBank([entry], 1)
    expect(ex.sentence).toBe(sentence)
  })

  it('sets sourceRef to word_bank with the entry id', () => {
    const entry = makeReorderEligibleEntry({ id: 'my-id-123', example: 'He walked into the store quickly.' })
    const [ex] = generateReorderWordsFromWordBank([entry], 1)
    expect(ex.sourceRef.source).toBe('word_bank')
    expect(ex.sourceRef.id).toBe('my-id-123')
  })

  it('respects the count parameter', () => {
    const entries = Array.from({ length: 8 }, (_, i) =>
      makeReorderEligibleEntry({ id: String(i), example: `She walked to the market on day ${i}.` }),
    )
    expect(generateReorderWordsFromWordBank(entries, 3)).toHaveLength(3)
    expect(generateReorderWordsFromWordBank(entries, 6)).toHaveLength(6)
  })

  it('returns fewer than count when not enough usable entries', () => {
    const entries = [makeReorderEligibleEntry({ id: '1', example: 'She walked to the store.' })]
    expect(generateReorderWordsFromWordBank(entries, 5)).toHaveLength(1)
  })

  it('produces deterministic ids for same input', () => {
    const entry = makeReorderEligibleEntry({ id: 'stable-id', example: 'He ran across the bridge.' })
    const [a] = generateReorderWordsFromWordBank([entry], 1)
    const [b] = generateReorderWordsFromWordBank([entry], 1)
    expect(a.id).toBe(b.id)
  })
})
