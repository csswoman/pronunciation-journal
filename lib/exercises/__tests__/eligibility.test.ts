import { describe, expect, it } from 'vitest'
import {
  assessWordBankEntry,
  blankLemma,
  DISTRACTOR_COUNT,
  hasEnoughContext,
  MIN_POOL_FOR_FILL_BLANK,
  sentenceContainsLemma,
} from '../eligibility'
import {
  makeFillBlankEligibleEntry,
  makeFillBlankPool,
  makeWordBankEntry,
} from './fixtures/word-bank-entry'

describe('sentenceContainsLemma', () => {
  it('accepts inflected verb forms', () => {
    expect(sentenceContainsLemma('She works at a hospital.', 'work')).toBe(true)
    expect(sentenceContainsLemma('They offered help.', 'offer')).toBe(true)
  })

  it('accepts irregular be forms', () => {
    expect(sentenceContainsLemma('They are happy today.', 'be')).toBe(true)
  })

  it('accepts compound tokens that embed the lemma', () => {
    expect(sentenceContainsLemma('See you tonight.', 'night')).toBe(true)
  })

  it('rejects unrelated sentences', () => {
    expect(sentenceContainsLemma('I want it.', 'to')).toBe(false)
    expect(sentenceContainsLemma('She went for a runner.', 'run')).toBe(false)
  })
})

describe('blankLemma', () => {
  it('blanks an exact lemma match', () => {
    expect(blankLemma('She went for a run yesterday.', 'run')).toBe('She went for a ___ yesterday.')
  })

  it('blanks an inflected surface form', () => {
    expect(blankLemma('She works at a hospital.', 'work')).toBe('She ___ at a hospital.')
  })

  it('returns null when the lemma is not in the sentence', () => {
    expect(blankLemma('She went for a runner.', 'run')).toBeNull()
  })
})

describe('hasEnoughContext', () => {
  it('accepts sentences with two or more content words after blanking', () => {
    expect(hasEnoughContext('She ___ at a hospital downtown.')).toBe(true)
  })

  it('rejects sentences with only one content word after blanking', () => {
    expect(hasEnoughContext('The ___ was useful.')).toBe(false)
  })
})

describe('assessWordBankEntry', () => {
  it('marks inflected examples eligible for fill_blank', () => {
    const result = assessWordBankEntry(
      makeWordBankEntry({ text: 'work', example: 'She works at a hospital downtown.' }),
      'fill_blank',
    )
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('flags missing example for reorder_words', () => {
    const result = assessWordBankEntry(makeWordBankEntry({ example: null }), 'reorder_words')
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('missing_example')
  })

  it('flags short sentences for reorder_words', () => {
    const result = assessWordBankEntry(makeWordBankEntry({ example: 'Too short.' }), 'reorder_words')
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('sentence_too_short')
  })

  it('requires meaning for match_pairs', () => {
    const result = assessWordBankEntry(makeWordBankEntry({ meaning: null }), 'match_pairs')
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('missing_meaning')
  })

  it('flags insufficient distractor pool when pool option is set', () => {
    const target = makeFillBlankEligibleEntry('walk', {
      id: 'target',
      example: 'He likes to walk in the park.',
    })
    const pool = [
      target,
      makeFillBlankEligibleEntry('swim', { id: 'a', example: 'She can swim across the lake quickly.' }),
      makeFillBlankEligibleEntry('jump', { id: 'b', example: 'The high jump was impressive.' }),
    ]
    expect(pool.length).toBeLessThan(MIN_POOL_FOR_FILL_BLANK)
    const result = assessWordBankEntry(target, 'fill_blank', { pool })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('insufficient_distractor_pool')
  })

  it('passes fill_blank with pool when enough distractors exist', () => {
    const entries = makeFillBlankPool(4)
    const result = assessWordBankEntry(entries[0], 'fill_blank', { pool: entries })
    expect(result.eligible).toBe(true)
    expect(entries.length).toBeGreaterThanOrEqual(MIN_POOL_FOR_FILL_BLANK)
    expect(DISTRACTOR_COUNT).toBe(3)
  })
})
