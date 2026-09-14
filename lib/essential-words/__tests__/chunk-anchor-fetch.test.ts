import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EssentialWord } from '../types'

const fetchCatalogIndex = vi.fn()
const fetchChunks = vi.fn()

vi.mock('../client', () => ({ fetchCatalogIndex, fetchChunks }))

const word = (value: string): EssentialWord => ({
  rank: 1, word: value, pos: 'verb', ipa_strong: '', example_sentence: '', cefr_level: 'A1',
})

describe('fetchEssentialWordsForAnchors', () => {
  beforeEach(() => {
    fetchCatalogIndex.mockReset()
    fetchChunks.mockReset()
  })

  it('loads only explicitly requested anchors and preserves their order', async () => {
    fetchCatalogIndex.mockResolvedValue([
      { word: 'help', chunk: 2 }, { word: 'day', chunk: 1 }, { word: 'other', chunk: 3 },
    ])
    fetchChunks.mockResolvedValue(new Map([
      ['c1k:help', word('help')], ['c1k:day', word('day')], ['c1k:other', word('other')],
    ]))
    const { fetchEssentialWordsForAnchors } = await import('../client-fetch')

    const result = await fetchEssentialWordsForAnchors(['c1k:help', 'c1k:day'], 3)

    expect(fetchChunks).toHaveBeenCalledWith([2, 1])
    expect(result.map((entry) => entry.text)).toEqual(['help', 'day'])
  })

  it('does not perform a text lookup for an unrecognized ID', async () => {
    const { fetchEssentialWordsForAnchors } = await import('../client-fetch')
    await expect(fetchEssentialWordsForAnchors(['word:help'], 3)).resolves.toEqual([])
    expect(fetchCatalogIndex).not.toHaveBeenCalled()
  })
})
