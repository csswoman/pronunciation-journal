import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadWordRainWords, sanitizeRainWord } from '../word-loader'
import { fetchCatalogIndex } from '@/lib/essential-words/client'

vi.mock('@/lib/essential-words/client', () => ({
  fetchCatalogIndex: vi.fn(),
}))

describe('sanitizeRainWord', () => {
  it('cleans whitespace, casing and non-letter chars', () => {
    expect(sanitizeRainWord(' Apple ')).toBe('apple')
    expect(sanitizeRainWord("don't")).toBe('dont')
    expect(sanitizeRainWord('WORLD123')).toBe('world')
  })
})

describe('loadWordRainWords', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns fallback words when catalog returns empty or fails', async () => {
    vi.mocked(fetchCatalogIndex).mockRejectedValue(new Error('Catalog fetch failed'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const words = await loadWordRainWords('A1', 10)
    expect(words.length).toBeGreaterThan(0)
    expect(words[0].cefr_level).toBe('A1')
    expect(words[0].word.length).toBeGreaterThanOrEqual(3)
    expect(warnSpy).toHaveBeenCalledWith('[WordRain] Fallback to curated vocabulary:', expect.any(Error))

    warnSpy.mockRestore()
  })

  it('loads B2 words with proper structure from catalog', async () => {
    const mockCatalog = Array.from({ length: 12 }, (_, i) => ({
      rank: i + 1,
      word: `achieve${i}`,
      pos: 'verb' as const,
      cefr_level: 'B2' as const,
      chunk: 1,
      ipa_strong: '/əˈtʃiːv/',
    }))
    vi.mocked(fetchCatalogIndex).mockResolvedValue(mockCatalog)

    const words = await loadWordRainWords('B2', 5)
    expect(words.length).toBe(5)
    expect(words[0].cefr_level).toBe('B2')
    expect(words[0]).toHaveProperty('id')
    expect(words[0]).toHaveProperty('word')
  })
})

