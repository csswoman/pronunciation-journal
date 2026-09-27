import { describe, expect, it } from 'vitest'
import type { CatalogIndexEntry } from '@/lib/essential-words/catalog-index'
import { isPuzzleFriendlyEssentialWord, selectCandidateChunks } from '../essential-loader'

function entry(word: string, chunk: number): CatalogIndexEntry {
  return { rank: 1, word, pos: 'noun', cefr_level: 'A2', chunk, ipa_strong: '/x/' }
}

describe('essential word-search loader helpers', () => {
  it('rejects function words, multi-word entries and oversized words', () => {
    expect(isPuzzleFriendlyEssentialWord({ word: 'the' })).toBe(false)
    expect(isPuzzleFriendlyEssentialWord({ word: 'ice cream' })).toBe(false)
    expect(isPuzzleFriendlyEssentialWord({ word: 'internationally' })).toBe(false)
    expect(isPuzzleFriendlyEssentialWord({ word: 'house' })).toBe(true)
  })

  it('limits a puzzle to at most three chunks of fresh words', () => {
    const candidates = Array.from({ length: 10 }, (_, chunk) =>
      Array.from({ length: 2 }, (_, i) => entry(`word${'abcdefghij'[chunk]}${'xy'[i]}`, chunk + 1)),
    ).flat()
    const pool = selectCandidateChunks(candidates, 8, new Set())
    expect(new Set(pool.map((item) => item.chunk)).size).toBeLessThanOrEqual(3)
  })

  it('skips chunks whose words were all played recently', () => {
    const candidates = [
      entry('house', 1),
      entry('water', 1),
      entry('table', 2),
      entry('chair', 2),
    ]
    const pool = selectCandidateChunks(candidates, 1, new Set(['HOUSE', 'WATER']))
    expect(pool.every((item) => item.chunk === 2)).toBe(true)
  })

  it('falls back to seen words when the whole level was played', () => {
    const candidates = [entry('house', 1), entry('water', 1)]
    const pool = selectCandidateChunks(candidates, 2, new Set(['HOUSE', 'WATER']))
    expect(pool).toHaveLength(2)
  })
})
