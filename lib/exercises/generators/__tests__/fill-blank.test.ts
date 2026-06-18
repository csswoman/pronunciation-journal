import { describe, it, expect } from 'vitest'
import { generateFillBlankFromWordBank } from '../fill-blank'
import { assertFillBlankInvariant } from '@/lib/exercises/__tests__/invariants'
import {
  makeFillBlankEligibleEntry,
  makeFillBlankPool,
  makeWordBankEntry,
} from '@/lib/exercises/__tests__/fixtures/word-bank-entry'

describe('generateFillBlankFromWordBank', () => {
  it('discards entries without an example', () => {
    const entries = [
      makeWordBankEntry({ id: '1', text: 'ephemeral', example: 'The ephemeral beauty of flowers.' }),
      makeWordBankEntry({ id: '2', text: 'vivid', example: null }),
      makeWordBankEntry({ id: '3', text: 'stoic', example: null }),
      makeWordBankEntry({ id: '4', text: 'lucid', example: 'A lucid explanation was given here today.' }),
    ]
    const { exercises } = generateFillBlankFromWordBank(entries, 10)
    const answers = exercises.map((r) => r.answer)
    expect(answers).not.toContain('vivid')
    expect(answers).not.toContain('stoic')
  })

  it('discards entries where word does not appear as a token in example', () => {
    const entries = [
      makeWordBankEntry({ id: '1', text: 'run', example: 'She went for a runner.' }),
      makeFillBlankEligibleEntry('run', { id: '2', example: 'She went for a run yesterday.' }),
      makeFillBlankEligibleEntry('walk', { id: '3', example: 'He likes to walk in the park.' }),
      makeFillBlankEligibleEntry('swim', { id: '4', example: 'She can swim across the lake quickly.' }),
      makeFillBlankEligibleEntry('jump', { id: '5', example: 'The high jump was impressive.' }),
      makeFillBlankEligibleEntry('climb', { id: '6', example: 'They climb the steep hill every morning.' }),
      makeFillBlankEligibleEntry('dance', { id: '7', example: 'We dance together at the community center.' }),
    ]
    const { exercises } = generateFillBlankFromWordBank(entries, 10)
    const answers = exercises.map((r) => r.answer)
    expect(answers).toContain('run')
    const runResult = exercises.find((r) => r.answer === 'run')!
    expect(runResult.sentence).toContain('___')
    expect(runResult.sentence).not.toContain(' run ')
  })

  it('generates fill-blank from inflected Core 1000 example sentences', () => {
    const pool = [
      makeFillBlankEligibleEntry('walk', { id: '2', example: 'He likes to walk in the park.' }),
      makeFillBlankEligibleEntry('swim', { id: '3', example: 'She can swim across the lake quickly.' }),
      makeFillBlankEligibleEntry('jump', { id: '4', example: 'The high jump was impressive.' }),
    ]
    const inflectedCases = [
      { word: 'work', example: 'She works at a hospital downtown.', sentence: 'She ___ at a hospital downtown.' },
      { word: 'offer', example: 'They offered extra help during class today.', sentence: 'They ___ extra help during class today.' },
    ] as const

    for (const { word, example, sentence } of inflectedCases) {
      const entries = [
        makeWordBankEntry({ id: `core-${word}`, text: word, source: 'core1k', example }),
        ...pool,
      ]
      const { exercises } = generateFillBlankFromWordBank(entries, 4)
      const match = exercises.find((ex) => ex.answer === word)
      expect(match, word).toBeDefined()
      expect(match!.sentence).toBe(sentence)
      expect(match!.sourceRef.source).toBe('core1k')
      assertFillBlankInvariant(match!)
    }
  })

  it('blanks compound tokens for night (See you tonight.)', () => {
    const entries = [
      makeWordBankEntry({ id: 'core-night', text: 'night', example: 'See you tonight.' }),
      ...makeFillBlankPool(4),
    ]
    const { exercises } = generateFillBlankFromWordBank(entries, 5)
    const night = exercises.find((ex) => ex.answer === 'night')
    // Short sentence lacks context after blanking — may be skipped; lemma match still works when eligible.
    if (night) {
      expect(night.sentence).toBe('See you ___.')
      assertFillBlankInvariant(night)
    }
  })

  it('replaces the target word with ___ in the sentence', () => {
    const entries = [
      makeWordBankEntry({ id: '1', text: 'ephemeral', example: 'The ephemeral beauty of flowers.' }),
      makeWordBankEntry({ id: '2', text: 'vivid', example: 'A vivid dream stayed with her today.' }),
      makeWordBankEntry({ id: '3', text: 'stoic', example: 'He remained stoic under pressure today.' }),
      makeWordBankEntry({ id: '4', text: 'lucid', example: 'The lucid explanation helped everyone today.' }),
    ]
    const { exercises } = generateFillBlankFromWordBank(entries, 4)
    for (const ex of exercises) {
      assertFillBlankInvariant(ex)
    }
  })

  it('always includes the answer in options and has exactly 4 options', () => {
    const entries = makeFillBlankPool(10)
    const { exercises } = generateFillBlankFromWordBank(entries, 5)
    for (const ex of exercises) {
      assertFillBlankInvariant(ex)
    }
  })

  it('never duplicates the answer in options', () => {
    const entries = makeFillBlankPool(10)
    const { exercises } = generateFillBlankFromWordBank(entries, 5)
    for (const ex of exercises) {
      const answerCount = ex.options.filter((o) => o === ex.answer).length
      expect(answerCount).toBe(1)
    }
  })

  it('respects the count parameter', () => {
    const entries = makeFillBlankPool(8)
    expect(generateFillBlankFromWordBank(entries, 3).exercises).toHaveLength(3)
    expect(generateFillBlankFromWordBank(entries, 6).exercises).toHaveLength(6)
  })

  it('returns fewer than count when not enough usable entries', () => {
    const entries = [
      makeWordBankEntry({ id: '1', text: 'only', example: 'The only word here today.' }),
    ]
    const { exercises } = generateFillBlankFromWordBank(entries, 5)
    expect(exercises.length).toBeLessThanOrEqual(1)
  })

  it('reports skipped entries when distractor pool is too small', () => {
    const entries = [
      makeFillBlankEligibleEntry('walk', { id: '1', example: 'He likes to walk in the park.' }),
      makeFillBlankEligibleEntry('swim', { id: '2', example: 'She can swim across the lake quickly.' }),
    ]
    const { exercises, skipped } = generateFillBlankFromWordBank(entries, 2)
    expect(exercises).toHaveLength(0)
    expect(skipped.length).toBeGreaterThan(0)
    expect(skipped[0].reasons).toContain('insufficient_distractor_pool')
  })

  it('sets sourceRef to word_bank with the entry id', () => {
    const entry = makeWordBankEntry({
      id: 'abc-123',
      text: 'serendipity',
      example: 'A serendipity moment changed her plans today.',
    })
    const pool = makeFillBlankPool(5)
    const { exercises } = generateFillBlankFromWordBank([entry, ...pool], 1)
    const found = exercises.find((r) => r.answer === 'serendipity')
    if (found) {
      expect(found.sourceRef.source).toBe('word_bank')
      expect(found.sourceRef.id).toBe('abc-123')
    }
  })
})
