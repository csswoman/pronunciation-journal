import { describe, it, expect } from 'vitest'
import { selectNewWordsForLevel } from '@/lib/courses/practice/vocab-selector'
import type { CoreWord } from '@/lib/core-1000/types'

const makeWord = (rank: number, word: string, cefr_level: CoreWord['cefr_level']): CoreWord => ({
  rank,
  word,
  pos: 'noun',
  ipa_strong: '/wɜːd/',
  example_sentence: `Use ${word} in a sentence.`,
  cefr_level,
})

describe('selectNewWordsForLevel', () => {
  const words: CoreWord[] = [
    makeWord(1, 'house', 'A1'),
    makeWord(2, 'water', 'A1'),
    makeWord(3, 'eat', 'A1'),
    makeWord(4, 'run', 'A1'),
    makeWord(5, 'city', 'A2'),
  ]

  it('returns only words matching the CEFR level', () => {
    const result = selectNewWordsForLevel(words, 'A1', new Set(), 5)
    expect(result.every((w) => w.cefr_level === 'A1')).toBe(true)
  })

  it('excludes words already in SRS (seen set)', () => {
    const seen = new Set(['c1k:house', 'c1k:water'])
    const result = selectNewWordsForLevel(words, 'A1', seen, 5)
    expect(result.map((w) => w.word)).toEqual(['eat', 'run'])
  })

  it('respects the limit parameter', () => {
    const result = selectNewWordsForLevel(words, 'A1', new Set(), 2)
    expect(result).toHaveLength(2)
  })

  it('returns words sorted ascending by rank', () => {
    const result = selectNewWordsForLevel(words, 'A1', new Set(), 5)
    const ranks = result.map((w) => w.rank)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it('returns [] when all words of that level are already seen', () => {
    const seen = new Set(['c1k:house', 'c1k:water', 'c1k:eat', 'c1k:run'])
    expect(selectNewWordsForLevel(words, 'A1', seen, 5)).toEqual([])
  })

  it('returns [] when no words match the level', () => {
    expect(selectNewWordsForLevel(words, 'B1', new Set(), 5)).toEqual([])
  })
})
