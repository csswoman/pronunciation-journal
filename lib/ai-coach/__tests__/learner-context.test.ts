import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildLearnerContext } from '../learner-context'

vi.mock('server-only', () => ({}))

const { mockLoadSkillProfile, mockGetWordBankSourceRefsServer, mockGetWordCategoryIndex } =
  vi.hoisted(() => ({
    mockLoadSkillProfile: vi.fn(),
    mockGetWordBankSourceRefsServer: vi.fn(),
    mockGetWordCategoryIndex: vi.fn(),
  }))

vi.mock('@/lib/progress/queries', () => ({
  loadSkillProfile: mockLoadSkillProfile,
}))

vi.mock('@/lib/word-bank/server-queries', () => ({
  getWordBankSourceRefsServer: mockGetWordBankSourceRefsServer,
}))

vi.mock('@/lib/lexicon/categories', () => ({
  getWordCategoryIndex: mockGetWordCategoryIndex,
}))

describe('buildLearnerContext', () => {
  beforeEach(() => {
    mockLoadSkillProfile.mockReset()
    mockGetWordBankSourceRefsServer.mockReset().mockResolvedValue([])
    mockGetWordCategoryIndex.mockReset().mockReturnValue(new Map())
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
