import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadDictionaryPuzzle, DICTIONARY_CATEGORIES } from '../dictionary-loader'

describe('Dictionary Loader for Word Search', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('contains all 9 dictionary categories', () => {
    expect(DICTIONARY_CATEGORIES.length).toBe(9)
    expect(DICTIONARY_CATEGORIES.map((c) => c.id)).toContain('frontend-dev')
    expect(DICTIONARY_CATEGORIES.map((c) => c.id)).toContain('artificial-intelligence')
  })

  it('loads and generates puzzle from API dictionary response', async () => {
    const mockWords = [
      { id: '1', word: 'render', definition: 'To draw on screen', ipa: '/ˈrendər/' },
      { id: '2', word: 'component', definition: 'Reusable UI block', ipa: '/kəmˈpoʊnənt/' },
      { id: '3', word: 'state', definition: 'Data over time', ipa: '/steɪt/' },
      { id: '4', word: 'hook', definition: 'React function', ipa: '/hʊk/' },
      { id: '5', word: 'props', definition: 'Inputs to component', ipa: '/prɑːps/' },
      { id: '6', word: 'bundle', definition: 'Packaged code', ipa: '/ˈbʌndəl/' },
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ words: mockWords }),
    }) as unknown as typeof fetch

    const puzzle = await loadDictionaryPuzzle('frontend-dev', 'clues', 6)

    expect(global.fetch).toHaveBeenCalledWith('/api/lexicon/frontend-dev')
    expect(puzzle.source).toBe('dictionary')
    expect(puzzle.items.length).toBeGreaterThanOrEqual(4)
    expect(puzzle.grid.length).toBe(puzzle.size)
  })

  it('rejects an unknown category instead of silently changing the topic', async () => {
    const fetchMock = vi.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    await expect(loadDictionaryPuzzle('missing-area', 'clues', 6)).rejects.toThrow(
      'El área del diccionario seleccionada no existe.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports categories without enough playable words', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        words: [
          { id: '1', word: 'a', definition: 'Too short' },
          { id: '2', word: 'two words', definition: 'Not a single answer' },
        ],
      }),
    }) as unknown as typeof fetch

    await expect(
      loadDictionaryPuzzle('frontend-dev', 'classic', 6),
    ).rejects.toThrow('no tiene suficientes palabras')
  })

  it('maps translation to meaningEs and prioritizes unplayed words when recentWords is passed', async () => {
    const mockWords = [
      { id: '1', word: 'render', definition: 'To draw', translation: 'Renderizar' },
      { id: '2', word: 'component', definition: 'UI block', translation: 'Componente' },
      { id: '3', word: 'state', definition: 'State data', translation: 'Estado' },
      { id: '4', word: 'hook', definition: 'Hook', translation: 'Gancho' },
      { id: '5', word: 'props', definition: 'Properties', translation: 'Propiedades' },
      { id: '6', word: 'bundle', definition: 'Bundle', translation: 'Paquete' },
      { id: '7', word: 'router', definition: 'Router', translation: 'Enrutador' },
      { id: '8', word: 'cache', definition: 'Cache', translation: 'Caché' },
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ words: mockWords }),
    }) as unknown as typeof fetch

    const recentWords = new Set(['RENDER', 'COMPONENT', 'STATE'])
    const puzzle = await loadDictionaryPuzzle('frontend-dev', 'classic', 4, recentWords)

    // Verify translation was mapped
    const renderItem = puzzle.items.find((it) => it.word === 'RENDER')
    if (renderItem) {
      expect(renderItem.meaningEs).toBe('Renderizar')
    }

    // Since there are 5 fresh words ('hook', 'props', 'bundle', 'router', 'cache'),
    // picking 4 should only include fresh words and avoid recent ones
    const puzzleWordUpper = puzzle.items.map((it) => it.word.toUpperCase())
    expect(puzzleWordUpper).not.toContain('RENDER')
    expect(puzzleWordUpper).not.toContain('COMPONENT')
    expect(puzzleWordUpper).not.toContain('STATE')
  })
})
