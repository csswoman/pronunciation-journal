import { describe, expect, it } from 'vitest'
import { generateMatchPairsFromWordBank } from '../match-pairs'
import { makeWordBankEntry } from '@/lib/exercises/__tests__/fixtures/word-bank-entry'

function makePairEntry(
  id: string,
  text: string,
  meaning: string,
  overrides: Parameters<typeof makeWordBankEntry>[0] = {},
) {
  return makeWordBankEntry({ id, text, meaning, ...overrides })
}

describe('generateMatchPairsFromWordBank', () => {
  it('returns no exercises when fewer than 2 usable entries', () => {
    const entries = [makePairEntry('1', 'alpha', 'first letter')]
    expect(generateMatchPairsFromWordBank(entries, 1)).toHaveLength(0)
  })

  it('discards entries without text or meaning', () => {
    const entries = [
      makePairEntry('1', 'valid', 'ok'),
      makeWordBankEntry({ id: '2', text: 'missing', meaning: null }),
      makeWordBankEntry({ id: '3', text: '', meaning: 'empty text' }),
    ]
    expect(generateMatchPairsFromWordBank(entries, 1)).toHaveLength(0)
  })

  it('dedupes entries with identical text+meaning', () => {
    const entries = [
      makePairEntry('1', 'pull', 'move toward'),
      makePairEntry('2', 'pull', 'move toward'),
      makePairEntry('3', 'push', 'move away'),
      makePairEntry('4', 'lift', 'raise up'),
    ]
    const [exercise] = generateMatchPairsFromWordBank(entries, 1)
    expect(exercise.pairs).toHaveLength(3)
    const lefts = exercise.pairs.map((p) => p.left)
    expect(new Set(lefts).size).toBe(lefts.length)
  })

  it('respects the count parameter', () => {
    const entries = Array.from({ length: 12 }, (_, i) =>
      makePairEntry(String(i), `word${i}`, `meaning ${i}`),
    )
    expect(generateMatchPairsFromWordBank(entries, 2)).toHaveLength(2)
    expect(generateMatchPairsFromWordBank(entries, 1)).toHaveLength(1)
  })

  it('sets sourceRef from an entry in the generated group', () => {
    const entries = [
      makePairEntry('abc-123', 'alpha', 'first', { source: 'core1k' }),
      makePairEntry('def-456', 'beta', 'second'),
      makePairEntry('ghi-789', 'gamma', 'third'),
      makePairEntry('jkl-012', 'delta', 'fourth'),
    ]
    const [exercise] = generateMatchPairsFromWordBank(entries, 1)
    const groupIds = new Set(entries.map((e) => e.id))
    expect(groupIds.has(exercise.sourceRef.id)).toBe(true)
    expect(['core1k', 'word_bank']).toContain(exercise.sourceRef.source)
  })

  it('builds word↔definition pairs for each selected entry', () => {
    const entries = [
      makePairEntry('1', 'cache', 'fast storage'),
      makePairEntry('2', 'queue', 'waiting line'),
    ]
    const [exercise] = generateMatchPairsFromWordBank(entries, 1)
    expect(exercise.type).toBe('match_pairs')
    expect(exercise.pairs).toHaveLength(2)
    expect(exercise.pairs.map((p) => p.left).sort()).toEqual(['cache', 'queue'])
  })
})
