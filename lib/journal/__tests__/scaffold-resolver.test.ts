import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ from: mocks.from }),
}))

import { resolveSeedVocabulary, selectGrammarNote } from '@/lib/journal/scaffold-resolver'

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
})

describe('resolveSeedVocabulary', () => {
  it('uses the learner rows for matching seeds, preserves order, and makes one query', async () => {
    mocks.from.mockReturnValue(
      queryResult([
        { text: ' COZY ', translation: 'acogedor de mi casa', ipa: '/koʊzi/', example: 'My own cozy example.', srs_status: 'learning' },
        { text: 'shelf', translation: 'estantería', ipa: '/ʃelf/', example: 'The shelf is by the window.', srs_status: 'review' },
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
      { text: 'cozy', translation: 'acogedor de mi casa', ipa: '/koʊzi/', example: 'My own cozy example.', inWordBank: true, srsStatus: 'learning' },
      { text: 'corner', translation: 'rincón', ipa: '/corner/', example: 'Generated corner.', inWordBank: false, srsStatus: null },
      { text: 'shelf', translation: 'estantería', ipa: '/ʃelf/', example: 'The shelf is by the window.', inWordBank: true, srsStatus: 'review' },
    ])
    expect(mocks.from).toHaveBeenCalledTimes(1)
    expect(mocks.from).toHaveBeenCalledWith('word_bank')
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
