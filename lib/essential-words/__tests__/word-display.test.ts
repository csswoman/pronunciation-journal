import { describe, expect, it } from 'vitest'
import { displayEnglishText, displayEnglishWord, normalizeEnglishAnswer } from '../word-display'

describe('displayEnglishWord', () => {
  it('capitalizes the pronoun i', () => {
    expect(displayEnglishWord('i', { pos: 'pronoun' })).toBe('I')
  })

  it('title-cases known proper nouns', () => {
    expect(displayEnglishWord('english')).toBe('English')
    expect(displayEnglishWord('monday')).toBe('Monday')
  })

  it('leaves ordinary lemmas unchanged', () => {
    expect(displayEnglishWord('you')).toBe('you')
  })
})

describe('displayEnglishText', () => {
  it('normalizes standalone i and sentence starts', () => {
    expect(displayEnglishText('i am ready. she is here.')).toBe('I am ready. She is here.')
  })
})

describe('normalizeEnglishAnswer', () => {
  it('ignores case and punctuation for grading', () => {
    expect(normalizeEnglishAnswer('  I! ')).toBe('i')
    expect(normalizeEnglishAnswer('Through.')).toBe('through')
  })
})
