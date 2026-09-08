import { describe, it, expect } from 'vitest'
import { loadWordRainWords, sanitizeRainWord } from '../word-loader'

describe('sanitizeRainWord', () => {
  it('cleans whitespace, casing and non-letter chars', () => {
    expect(sanitizeRainWord(' Apple ')).toBe('apple')
    expect(sanitizeRainWord("don't")).toBe('dont')
    expect(sanitizeRainWord('WORLD123')).toBe('world')
  })
})

describe('loadWordRainWords', () => {
  it('returns fallback words when catalog returns empty or fails', async () => {
    const words = await loadWordRainWords('A1', 10)
    expect(words.length).toBeGreaterThan(0)
    expect(words[0].cefr_level).toBe('A1')
    expect(words[0].word.length).toBeGreaterThanOrEqual(3)
  })

  it('loads B2 words with proper structure', async () => {
    const words = await loadWordRainWords('B2', 5)
    expect(words.length).toBeGreaterThan(0)
    expect(words[0].cefr_level).toBe('B2')
    expect(words[0]).toHaveProperty('id')
    expect(words[0]).toHaveProperty('word')
  })
})
