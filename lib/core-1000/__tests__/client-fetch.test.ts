import { describe, it, expect } from 'vitest'
import { coreWordToWordBankEntry, filterAndRotate } from '../client-fetch'
import type { CoreWord } from '../types'

const makeWord = (overrides: Partial<CoreWord> = {}): CoreWord => ({
  rank: 1,
  word: 'make',
  pos: 'verb',
  ipa_strong: 'meɪk',
  example_sentence: 'I want to make a plan.',
  cefr_level: 'A1',
  ...overrides,
})

describe('coreWordToWordBankEntry', () => {
  it('maps text from word', () => {
    const entry = coreWordToWordBankEntry(makeWord({ word: 'build' }))
    expect(entry.text).toBe('build')
  })

  it('maps example from example_sentence', () => {
    const entry = coreWordToWordBankEntry(makeWord({ example_sentence: 'She will build a house.' }))
    expect(entry.example).toBe('She will build a house.')
  })

  it('maps ipa from ipa_strong', () => {
    const entry = coreWordToWordBankEntry(makeWord({ ipa_strong: 'bɪld' }))
    expect(entry.ipa).toBe('bɪld')
  })

  it('maps A1 cefr_level to difficulty 1', () => {
    expect(coreWordToWordBankEntry(makeWord({ cefr_level: 'A1' })).difficulty).toBe(1)
  })

  it('maps A2 cefr_level to difficulty 1', () => {
    expect(coreWordToWordBankEntry(makeWord({ cefr_level: 'A2' })).difficulty).toBe(1)
  })

  it('maps B1 cefr_level to difficulty 2', () => {
    expect(coreWordToWordBankEntry(makeWord({ cefr_level: 'B1' })).difficulty).toBe(2)
  })

  it('maps B2 cefr_level to difficulty 2', () => {
    expect(coreWordToWordBankEntry(makeWord({ cefr_level: 'B2' })).difficulty).toBe(2)
  })

  it('maps C1 cefr_level to difficulty 3', () => {
    expect(coreWordToWordBankEntry(makeWord({ cefr_level: 'C1' })).difficulty).toBe(3)
  })

  it('sets srs_status to new', () => {
    expect(coreWordToWordBankEntry(makeWord()).srs_status).toBe('new')
  })

  it('sets status to ready', () => {
    expect(coreWordToWordBankEntry(makeWord()).status).toBe('ready')
  })

  it('generates stable id with core1k: prefix', () => {
    const entry = coreWordToWordBankEntry(makeWord({ word: 'Make' }))
    expect(entry.id).toBe('core1k:make')
  })
})

describe('filterAndRotate', () => {
  const words: CoreWord[] = [
    makeWord({ word: 'the', rank: 1 }),   // 3 letters — excluded
    makeWord({ word: 'make', rank: 2 }),  // 4 letters — included
    makeWord({ word: 'build', rank: 3 }), // 5 letters — included
    makeWord({ word: 'run', rank: 4 }),   // 3 letters — excluded
    makeWord({ word: 'walk', rank: 5 }),  // 4 letters — included
    makeWord({ word: 'talk', rank: 6 }),  // 4 letters — included
  ]

  it('excludes words shorter than 4 characters', () => {
    const result = filterAndRotate(words, 0, 10)
    expect(result.every(w => w.word.length >= 4)).toBe(true)
  })

  it('returns up to count words', () => {
    const result = filterAndRotate(words, 0, 2)
    expect(result.length).toBe(2)
  })

  it('rotates by day — day 0 and day 2 return different slices', () => {
    // 4 eligible words: make, build, walk, talk
    const day0 = filterAndRotate(words, 0, 2)
    const day2 = filterAndRotate(words, 2, 2)
    expect(day0).not.toEqual(day2)
  })

  it('wraps around — rotation is deterministic and never goes out of bounds', () => {
    const result = filterAndRotate(words, 999, 2)
    expect(result.length).toBe(2)
  })
})
