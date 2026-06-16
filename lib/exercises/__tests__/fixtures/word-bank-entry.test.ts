import { describe, expect, it } from 'vitest'
import { assessWordBankEntry, MIN_POOL_FOR_FILL_BLANK } from '@/lib/exercises/eligibility'
import {
  assertFillBlankEligible,
  fillBlankExampleSentence,
  makeFillBlankEligibleEntry,
  makeFillBlankPool,
  makeLexiconWordBankEntry,
  makeReorderEligibleEntry,
  makeWordBankEntry,
} from './word-bank-entry'

describe('word-bank-entry fixtures', () => {
  it('fillBlankExampleSentence leaves enough context after blanking', () => {
    const entry = makeFillBlankEligibleEntry('sample')
    expect(entry.example).toBe(fillBlankExampleSentence('sample'))
    assertFillBlankEligible(entry)
  })

  it('makeFillBlankPool entries pass fill_blank with shared pool', () => {
    const pool = makeFillBlankPool(MIN_POOL_FOR_FILL_BLANK)
    for (const entry of pool) {
      assertFillBlankEligible(entry, pool)
    }
  })

  it('makeReorderEligibleEntry passes reorder_words assess', () => {
    const entry = makeReorderEligibleEntry({ id: 'reorder-1' })
    expect(assessWordBankEntry(entry, 'reorder_words').eligible).toBe(true)
  })

  it('makeLexiconWordBankEntry defaults to lexicon source and fill-blank example', () => {
    const entry = makeLexiconWordBankEntry({ id: 'lex-1', text: 'focus' })
    expect(entry.source).toBe('lexicon')
    assertFillBlankEligible(entry)
  })

  it('makeWordBankEntry allows overriding any field', () => {
    const entry = makeWordBankEntry({ text: 'custom', example: null })
    expect(entry.text).toBe('custom')
    expect(entry.example).toBeNull()
  })
})
