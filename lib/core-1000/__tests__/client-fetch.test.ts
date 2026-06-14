import { describe, it, expect } from 'vitest'
import { coreWordToWordBankEntry } from '../client-fetch'
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
