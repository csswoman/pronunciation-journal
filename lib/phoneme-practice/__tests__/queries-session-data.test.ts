import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSessionDataset, getSessionDatasets } from '@/lib/phoneme-practice/queries'

const fromMock = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    from: fromMock,
  }),
}))

vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: vi.fn(),
}))

type QueryResult = { data: unknown; error: null }

function queryResult(data: unknown): Promise<QueryResult> {
  return Promise.resolve({ data, error: null })
}

function makeChain(table: string) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn((column: string, value: unknown) => {
      if (table === 'sounds' && column === 'id') {
        return {
          single: vi.fn(() => queryResult({
            id: value,
            ipa: '/ɪ/',
            example: 'ship',
            category: 'vowel',
            type: 'short',
            difficulty: 1,
          })),
        }
      }
      return chain
    }),
    single: vi.fn(() => queryResult(null)),
    maybeSingle: vi.fn(() => queryResult(null)),
    order: vi.fn(() => {
      if (table === 'sounds') {
        return queryResult([
          { id: 1, ipa: '/ɪ/', example: 'ship', category: 'vowel', type: 'short', difficulty: 1 },
          { id: 2, ipa: '/iː/', example: 'sheep', category: 'vowel', type: 'long', difficulty: 1 },
        ])
      }
      if (table === 'words') {
        return queryResult([
          { id: 11, sound_id: 1, word: 'ship', ipa: '/ʃɪp/', audio_url: null, difficulty: 1, phonemes: null, sound_focus: null },
          { id: 12, sound_id: 1, word: 'sit', ipa: '/sɪt/', audio_url: null, difficulty: 1, phonemes: null, sound_focus: null },
          { id: 21, sound_id: 2, word: 'sheep', ipa: '/ʃiːp/', audio_url: null, difficulty: 1, phonemes: null, sound_focus: null },
        ])
      }
      return queryResult([])
    }),
    in: vi.fn(() => chain),
    or: vi.fn(() => queryResult([
      {
        id: 31,
        word_a: 'ship',
        word_b: 'sheep',
        ipa_a: '/ʃɪp/',
        ipa_b: '/ʃiːp/',
        sound_group: 'ship-sheep',
        contrast_ipa_a: '/ɪ/',
        contrast_ipa_b: '/iː/',
        contrast_sound_a_id: 1,
        contrast_sound_b_id: 2,
      },
    ])),
  }

  return chain
}

describe('phoneme session dataset queries', () => {
  beforeEach(() => {
    fromMock.mockReset()
    fromMock.mockImplementation((table: string) => makeChain(table))
  })

  it('builds a bounded dataset without calling getAllWords', async () => {
    const dataset = await getSessionDataset(1)

    expect(dataset.targetSound.id).toBe(1)
    expect(dataset.sounds.map((sound) => sound.id)).toEqual([1, 2])
    expect(dataset.wordsBySoundId.get(1)?.map((word) => word.word)).toEqual(['ship', 'sit'])

    const soundCalls = fromMock.mock.calls.filter(([table]) => table === 'sounds')
    const wordsCalls = fromMock.mock.calls.filter(([table]) => table === 'words')

    expect(soundCalls).toHaveLength(2)
    expect(wordsCalls).toHaveLength(1)
  })

  it('batches minimal-pair retrieval across multiple target sounds', async () => {
    const datasets = await getSessionDatasets([1, 2])

    expect(datasets.get(1)?.minimalPairs).toHaveLength(1)
    expect(datasets.get(2)?.minimalPairs).toHaveLength(1)

    const minimalPairsCalls = fromMock.mock.calls.filter(([table]) => table === 'minimal_pairs')
    expect(minimalPairsCalls).toHaveLength(1)
  })
})
