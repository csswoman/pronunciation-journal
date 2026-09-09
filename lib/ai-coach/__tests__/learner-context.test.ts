import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildLearnerContext } from '../learner-context'

vi.mock('server-only', () => ({}))

const {
  mockLoadSkillProfile,
  mockGetWordBankSourceRefsServer,
  mockGetWordCategoryIndex,
  mockGetWordsDueForReview,
  mockGetWeakWordsForReviewServer,
  mockFetchServerLearningState,
  mockGetStrugglingWordBankRefs,
  mockGetCategories,
} = vi.hoisted(() => ({
  mockLoadSkillProfile: vi.fn(),
  mockGetWordBankSourceRefsServer: vi.fn(),
  mockGetWordCategoryIndex: vi.fn(),
  mockGetWordsDueForReview: vi.fn(),
  mockGetWeakWordsForReviewServer: vi.fn(),
  mockFetchServerLearningState: vi.fn(),
  mockGetStrugglingWordBankRefs: vi.fn(),
  mockGetCategories: vi.fn(),
}))

vi.mock('@/lib/progress/queries', () => ({
  loadSkillProfile: mockLoadSkillProfile,
}))

vi.mock('@/lib/word-bank/server-queries', () => ({
  getWordBankSourceRefsServer: mockGetWordBankSourceRefsServer,
  getWordsDueForReview: mockGetWordsDueForReview,
  getWeakWordsForReviewServer: mockGetWeakWordsForReviewServer,
  getStrugglingWordBankRefs: mockGetStrugglingWordBankRefs,
}))

vi.mock('@/lib/ai-practice/server-state', () => ({
  fetchServerLearningState: mockFetchServerLearningState,
}))

vi.mock('@/lib/lexicon/categories', () => ({
  getWordCategoryIndex: mockGetWordCategoryIndex,
  getCategories: mockGetCategories,
}))

describe('buildLearnerContext', () => {
  beforeEach(() => {
    mockLoadSkillProfile.mockReset()
    mockGetWordBankSourceRefsServer.mockReset().mockResolvedValue([])
    mockGetWordCategoryIndex.mockReset().mockReturnValue(new Map())
    mockGetWordsDueForReview.mockReset().mockResolvedValue([])
    mockGetWeakWordsForReviewServer.mockReset().mockResolvedValue([])
    mockFetchServerLearningState.mockReset().mockResolvedValue(null)
    mockGetStrugglingWordBankRefs.mockReset().mockResolvedValue([])
    mockGetCategories.mockReset().mockReturnValue([])
  })

  /** Three lexicon words the learner keeps forgetting, all in one category. */
  function strugglingBackendRefs() {
    return ['idempotent', 'throughput', 'latency'].map((source_ref) => ({
      source: 'lexicon',
      source_ref,
      ease_factor: 1.5,
      srs_status: 'learning',
    }))
  }

  const BACKEND_INDEX = new Map([
    ['idempotent', ['backend-infra']],
    ['throughput', ['backend-infra']],
    ['latency', ['backend-infra']],
  ])

  it('siembra el vocabulario vencido para que el guión lo haga producir', async () => {
    mockLoadSkillProfile.mockResolvedValue(null)
    mockGetWordsDueForReview.mockResolvedValue([{ text: 'although' }, { text: 'receipt' }])
    const context = await buildLearnerContext('user-a')
    expect(context.srsDueWords).toEqual(['although', 'receipt'])
  })

  it('expone las palabras que más se resisten', async () => {
    mockLoadSkillProfile.mockResolvedValue(null)
    mockGetWeakWordsForReviewServer.mockResolvedValue([{ text: 'thorough' }])
    const context = await buildLearnerContext('user-a')
    expect(context.strugglingWords).toEqual(['thorough'])
  })

  it('arrastra los temas recientes desde el learning state', async () => {
    mockLoadSkillProfile.mockResolvedValue(null)
    mockFetchServerLearningState.mockResolvedValue({
      lastSessions: [{ topic: 'Present perfect' }, { topic: 'Articles' }],
    })
    const context = await buildLearnerContext('user-a')
    expect(context.recentTopics).toEqual(['Present perfect', 'Articles'])
  })

  it('expone el area de vocabulario que se le resiste, no solo donde guarda palabras', async () => {
    mockLoadSkillProfile.mockResolvedValue(null)
    mockGetStrugglingWordBankRefs.mockResolvedValue(strugglingBackendRefs())
    mockGetWordCategoryIndex.mockReturnValue(BACKEND_INDEX)
    mockGetCategories.mockReturnValue([{ id: 'backend-infra', name: 'Backend e infraestructura' }])

    const context = await buildLearnerContext('user-a')

    expect(context.weakDomains).toEqual(['Backend e infraestructura'])
  })

  it('deja weakDomains vacio cuando no hay senal suficiente', async () => {
    mockLoadSkillProfile.mockResolvedValue(null)
    mockGetStrugglingWordBankRefs.mockResolvedValue([])

    const context = await buildLearnerContext('user-a')

    expect(context.weakDomains).toEqual([])
  })

  it('no propaga un fallo al leer las areas debiles', async () => {
    mockLoadSkillProfile.mockResolvedValue({ cefr: 'B1', weakestPhonemes: [] })
    mockGetStrugglingWordBankRefs.mockRejectedValue(new Error('db down'))

    const context = await buildLearnerContext('user-a')

    expect(context.weakDomains).toEqual([])
    expect(context.cefr).toBe('B1')
  })

  it('no propaga un fallo de las fuentes de vocabulario', async () => {
    mockLoadSkillProfile.mockResolvedValue({ cefr: 'B1', weakestPhonemes: [] })
    mockGetWordsDueForReview.mockRejectedValue(new Error('db down'))
    mockGetWeakWordsForReviewServer.mockRejectedValue(new Error('db down'))
    mockFetchServerLearningState.mockRejectedValue(new Error('db down'))
    const context = await buildLearnerContext('user-a')
    expect(context.cefr).toBe('B1')
    expect(context.srsDueWords).toEqual([])
    expect(context.strugglingWords).toEqual([])
    expect(context.recentTopics).toEqual([])
  })

  it('toma el nivel CEFR del skill profile', async () => {
    mockLoadSkillProfile.mockResolvedValue({ cefr: 'B1', weakestPhonemes: [] })
    const context = await buildLearnerContext('user-a')
    expect(context.cefr).toBe('B1')
  })

  it('degrada a un nivel por defecto cuando no hay perfil', async () => {
    mockLoadSkillProfile.mockResolvedValue(null)
    const context = await buildLearnerContext('user-a')
    expect(context.cefr).toBe('A2')
    expect(context.weakTargets).toEqual([])
    expect(context.srsDueWords).toEqual([])
    expect(context.domains).toEqual([])
  })

  it('no propaga un fallo de la fuente', async () => {
    mockLoadSkillProfile.mockRejectedValueOnce(new Error('network'))
    const context = await buildLearnerContext('user-a')
    expect(context.cefr).toBe('A2')
  })

  it('deriva los dominios desde el word_bank lexicon', async () => {
    mockLoadSkillProfile.mockResolvedValue(null)
    mockGetWordBankSourceRefsServer.mockResolvedValue([
      { source: 'lexicon', source_ref: 'backpropagation' },
      { source: 'lexicon', source_ref: 'backpropagation' },
    ])
    mockGetWordCategoryIndex.mockReturnValue(
      new Map([['backpropagation', ['artificial-intelligence']]]),
    )
    const context = await buildLearnerContext('user-a')
    expect(context.domains).toEqual(['Ingeniería'])
  })

  it('no propaga un fallo al derivar dominios', async () => {
    mockLoadSkillProfile.mockResolvedValue({ cefr: 'B1', weakestPhonemes: [] })
    mockGetWordBankSourceRefsServer.mockRejectedValue(new Error('db down'))
    const context = await buildLearnerContext('user-a')
    expect(context.cefr).toBe('B1')
    expect(context.domains).toEqual([])
  })
})
