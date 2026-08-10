import { describe, expect, it } from 'vitest'
import { collectLeeches } from '../ready-leeches'

describe('collectLeeches', () => {
  it('keeps words with lapses at or above threshold using max rollup', () => {
    const leeches = collectLeeches([
      { wordId: 'c1k:hard', word: 'hard', lapses: 2 },
      { wordId: 'c1k:hard', word: 'hard', lapses: 4 },
      { wordId: 'c1k:easy', word: 'easy', lapses: 1 },
      { wordId: 'c1k:tough', word: 'tough', lapses: 3 },
    ])
    expect(leeches.map((l) => l.word)).toEqual(['hard', 'tough'])
    expect(leeches[0]?.lapses).toBe(4)
  })
})
