import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getWordsDueForReview: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ from: mocks.from }),
}))
vi.mock('@/lib/word-bank/server-queries', () => ({
  getWordsDueForReview: mocks.getWordsDueForReview,
}))

import { combineScaffoldVocabulary, type DueReviewSeedWord } from '@/lib/journal/scaffold-resolver'
import { fetchDueWordsForScaffold, resolveSeedVocabulary, selectGrammarNote } from '@/lib/journal/server-queries'

function queryResult(data: unknown) {
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error: null }).then(resolve),
  }
  return chain
}

beforeEach(() => {
  mocks.from.mockReset()
  mocks.getWordsDueForReview.mockReset()
})

describe('resolveSeedVocabulary', () => {
  it('uses the learner rows for matching seeds, preserves order, and makes one query', async () => {
    mocks.from.mockReturnValue(
      queryResult([
        { id: 'word-cozy', text: ' COZY ', translation: 'acogedor de mi casa', ipa: '/koʊzi/', example: 'My own cozy example.', srs_status: 'learning' },
        { id: 'word-shelf', text: 'shelf', translation: 'estantería', ipa: '/ʃelf/', example: 'The shelf is by the window.', srs_status: 'review' },
      ]),
    )

    const result = await resolveSeedVocabulary(
      [
        { text: 'cozy', translation: 'acogedor', ipa: '/generated-cozy/', example: 'Generated cozy.' },
        { text: 'corner', translation: 'rincón', ipa: '/corner/', example: 'Generated corner.' },
        { text: 'shelf', translation: 'estante', ipa: '/generated-shelf/', example: 'Generated shelf.' },
      ],
      'user-1',
    )

    expect(result).toEqual([
      { id: 'word-cozy', text: 'cozy', translation: 'acogedor de mi casa', ipa: '/koʊzi/', example: 'My own cozy example.', inWordBank: true, srsStatus: 'learning', provenance: 'scaffold' },
      { text: 'corner', translation: 'rincón', ipa: '/corner/', example: 'Generated corner.', inWordBank: false, srsStatus: null, provenance: 'scaffold' },
      { id: 'word-shelf', text: 'shelf', translation: 'estantería', ipa: '/ʃelf/', example: 'The shelf is by the window.', inWordBank: true, srsStatus: 'review', provenance: 'scaffold' },
    ])
    expect(mocks.from).toHaveBeenCalledTimes(1)
    expect(mocks.from).toHaveBeenCalledWith('word_bank')
  })
})

describe('fetchDueWordsForScaffold', () => {
  it('adapts the canonical due queue and preserves user and limit arguments', async () => {
    mocks.getWordsDueForReview.mockResolvedValue([{
      id: 'due-1', text: 'borrow', translation: 'pedir prestado', meaning: 'obtener prestado',
      ipa: '/ˈbɑːroʊ/', example: 'Can I borrow your pen?', srs_status: 'review',
    }])

    await expect(fetchDueWordsForScaffold('user-1', 3)).resolves.toEqual([{
      id: 'due-1', text: 'borrow', translation: 'pedir prestado', ipa: '/ˈbɑːroʊ/',
      example: 'Can I borrow your pen?', inWordBank: true, srsStatus: 'review', provenance: 'dueReview',
    }])
    expect(mocks.getWordsDueForReview).toHaveBeenCalledWith('user-1', 3)
  })

  it('keeps a failed due query distinct from a confirmed empty queue', async () => {
    mocks.getWordsDueForReview.mockResolvedValue([])
    await expect(fetchDueWordsForScaffold('user-1', 3)).resolves.toEqual([])

    const queryError = new Error('query failed')
    mocks.getWordsDueForReview.mockRejectedValue(queryError)
    await expect(fetchDueWordsForScaffold('user-1', 3)).rejects.toBe(queryError)
  })
})

describe('combineScaffoldVocabulary', () => {
  const seed = {
    text: 'borrow', translation: 'pedir prestado', ipa: '/bɑːroʊ/', example: 'Borrow a book.',
    inWordBank: false, srsStatus: null, provenance: 'scaffold' as const,
  }
  const due: DueReviewSeedWord = {
    id: 'due-1', text: 'BORROW', translation: 'pedir prestado', ipa: '/ˈbɑːroʊ/',
    example: 'Can I borrow it?', inWordBank: true, srsStatus: 'review', provenance: 'dueReview',
  }

  it('deduplicates a due word against the scaffold and retains due provenance only with a confirmed due row', () => {
    expect(combineScaffoldVocabulary([seed], [])).toEqual([seed])
    expect(combineScaffoldVocabulary([seed], [due])).toEqual([{
      ...seed, id: due.id, inWordBank: true, srsStatus: 'review', provenance: 'dueReview',
    }])
  })

  it('adds due words after scaffold words without duplicating canonical ids', () => {
    const secondDue = { ...due, id: 'due-2', text: 'lend' }
    expect(combineScaffoldVocabulary([seed], [due, secondDue])).toHaveLength(2)
    expect(combineScaffoldVocabulary([seed], [due, secondDue])[1].provenance).toBe('dueReview')

    const sameIdDifferentText = { ...seed, text: 'borrow something', id: due.id }
    expect(combineScaffoldVocabulary([sameIdDifferentText], [due])).toHaveLength(1)
    expect(combineScaffoldVocabulary([sameIdDifferentText], [due])[0]).toMatchObject({
      text: 'borrow something', provenance: 'dueReview', id: due.id,
    })
  })
})

describe('selectGrammarNote', () => {
  const notes = [
    { topic_id: 'grammar:articles', rule: 'Articles matter.', example_correct: 'I saw a dog.', example_wrong: 'I saw dog.' },
    { topic_id: 'grammar:past simple', rule: 'Use the past.', example_correct: 'I went.', example_wrong: 'I go yesterday.' },
  ]

  it('selects the oldest due topic in one topic_srs query', async () => {
    const now = Date.now()
    const dueOldest = new Date(now - 86_400_000 * 3).toISOString()
    const dueNewest = new Date(now - 86_400_000).toISOString()
    mocks.from.mockReturnValue(queryResult([
      { topic: 'grammar:past simple', next_review_at: dueNewest },
      { topic: 'grammar:articles', next_review_at: dueOldest },
    ]))

    await expect(selectGrammarNote(['grammar:articles', 'grammar:past simple'], notes, 'user-1')).resolves.toEqual({
      topicId: 'grammar:articles',
      rule: 'Articles matter.',
      exampleCorrect: 'I saw a dog.',
      exampleWrong: 'I saw dog.',
      dueState: 'due',
      nextReviewAt: dueOldest,
    })
    expect(mocks.from).toHaveBeenCalledTimes(1)
    expect(mocks.from).toHaveBeenCalledWith('topic_srs')
  })

  it('falls back to the nearest scheduled topic when none is due', async () => {
    const nearest = new Date(Date.now() + 86_400_000).toISOString()
    mocks.from.mockReturnValue(queryResult([{ topic: 'grammar:past simple', next_review_at: nearest }]))

    await expect(selectGrammarNote(['grammar:articles', 'grammar:past simple'], notes, 'user-1')).resolves.toMatchObject({
      topicId: 'grammar:past simple',
      dueState: 'scheduled',
      nextReviewAt: nearest,
    })
  })

  it('shows the future topic after the due topic is reviewed', async () => {
    const rows = [
      { topic: 'grammar:articles', next_review_at: new Date(Date.now() - 86_400_000).toISOString() },
      { topic: 'grammar:past simple', next_review_at: new Date(Date.now() + 86_400_000).toISOString() },
    ]
    mocks.from.mockImplementation(() => queryResult(rows))

    await expect(selectGrammarNote(['grammar:articles', 'grammar:past simple'], notes, 'user-1')).resolves.toMatchObject({
      topicId: 'grammar:articles',
      dueState: 'due',
    })

    rows.shift()
    await expect(selectGrammarNote(['grammar:articles', 'grammar:past simple'], notes, 'user-1')).resolves.toMatchObject({
      topicId: 'grammar:past simple',
      dueState: 'scheduled',
    })
  })
})
