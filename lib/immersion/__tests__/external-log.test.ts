import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logExternalImmersion } from '../external-log'
import { recordActivitySession } from '@/lib/progress/activity-hub'

vi.mock('@/lib/progress/activity-hub', () => ({
  recordActivitySession: vi.fn().mockResolvedValue({ reconciledStepIds: [] }),
}))

describe('logExternalImmersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps video media to listening and vocabulary skills', async () => {
    const res = await logExternalImmersion('user-1', {
      type: 'video',
      minutes: 30,
      notes: 'YouTube English',
    })

    expect(res.skills).toEqual(['listening', 'vocabulary'])
    expect(res.xpEarned).toBe(30)
    expect(res.minutes).toBe(30)
    expect(recordActivitySession).toHaveBeenCalledWith('user-1', expect.objectContaining({
      source: 'immersion',
      explicitSkillTags: ['listening', 'vocabulary'],
      explicitXp: 30,
      sessionResult: expect.objectContaining({
        totalTimeMs: 30 * 60 * 1000,
        accuracy: 100,
      }),
    }))
  })

  it('maps podcast media to listening skill', async () => {
    const res = await logExternalImmersion('user-1', {
      type: 'podcast',
      minutes: 15,
    })

    expect(res.skills).toEqual(['listening'])
    expect(res.xpEarned).toBe(15)
    expect(recordActivitySession).toHaveBeenCalledWith('user-1', expect.objectContaining({
      source: 'immersion',
      explicitSkillTags: ['listening'],
    }))
  })

  it('maps reading media to reading and vocabulary skills', async () => {
    const res = await logExternalImmersion('user-1', {
      type: 'reading',
      minutes: 45,
    })

    expect(res.skills).toEqual(['reading', 'vocabulary'])
    expect(res.xpEarned).toBe(45)
    expect(recordActivitySession).toHaveBeenCalledWith('user-1', expect.objectContaining({
      source: 'immersion',
      explicitSkillTags: ['reading', 'vocabulary'],
    }))
  })
})
