import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildLearnerContext } from '../learner-context'

vi.mock('server-only', () => ({}))

const { mockLoadSkillProfile } = vi.hoisted(() => ({
  mockLoadSkillProfile: vi.fn(),
}))

vi.mock('@/lib/progress/queries', () => ({
  loadSkillProfile: mockLoadSkillProfile,
}))

describe('buildLearnerContext', () => {
  beforeEach(() => mockLoadSkillProfile.mockReset())

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
  })

  it('no propaga un fallo de la fuente', async () => {
    mockLoadSkillProfile.mockRejectedValueOnce(new Error('network'))
    const context = await buildLearnerContext('user-a')
    expect(context.cefr).toBe('A2')
  })
})
