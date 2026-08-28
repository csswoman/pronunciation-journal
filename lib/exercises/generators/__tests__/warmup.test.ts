import { describe, it, expect } from 'vitest'
import { generateWarmupShadowPhrases } from '@/lib/exercises/generators/warmup'
import { makeWordBankEntry } from '@/lib/exercises/__tests__/fixtures/word-bank-entry'

describe('generateWarmupShadowPhrases', () => {
  it('returns the requested number of phrases', () => {
    const words = Array.from({ length: 8 }, (_, i) =>
      makeWordBankEntry({
        id: `w${i}`,
        text: `word${i}`,
        example: `I really like this word${i} in the morning.`,
      }),
    )
    expect(generateWarmupShadowPhrases(words, 4)).toHaveLength(4)
  })

  it('only uses entries that have an example sentence', () => {
    const withExample = makeWordBankEntry({
      id: 'w1',
      text: 'word1',
      example: 'I really like this word1 in the morning.',
    })
    const withoutExample = makeWordBankEntry({ id: 'w2', text: 'word2', example: null })
    const phrases = generateWarmupShadowPhrases([withExample, withoutExample], 4)
    expect(phrases).toHaveLength(1)
    expect(phrases[0]!.phrase).toContain('word1')
  })

  it('marks warm-up phrases as unscored', () => {
    const entry = makeWordBankEntry({
      id: 'w1',
      text: 'word1',
      example: 'I really like this word1 in the morning.',
    })
    const phrases = generateWarmupShadowPhrases([entry], 1)
    expect(phrases[0]!.scored).toBe(false)
  })

  it('returns an empty list when there is nothing usable', () => {
    expect(generateWarmupShadowPhrases([], 4)).toEqual([])
  })
})
