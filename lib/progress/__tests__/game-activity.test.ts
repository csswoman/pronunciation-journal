import { describe, expect, it, vi } from 'vitest'
import { recordGameActivity } from '../game-activity'
import { recordActivitySession } from '../activity-hub'

vi.mock('../activity-hub', () => ({
  recordActivitySession: vi.fn().mockResolvedValue({ reconciledStepIds: [] }),
}))

describe('recordGameActivity', () => {
  it.each([
    ['games', 'games'],
    ['word_rain', 'word-rain'],
    ['word_search', 'puzzle-1'],
  ] as const)('records %s as vocabulary activity without synthetic answers', async (source, gameId) => {
    await recordGameActivity('user-1', source, 1250, gameId)

    expect(recordActivitySession).toHaveBeenLastCalledWith('user-1', expect.objectContaining({
      practiceContext: 'practice',
      source,
      allowEmptySession: true,
      explicitSkillTags: ['vocabulary'],
      sessionResult: expect.objectContaining({
        results: [],
        totalTimeMs: 1250,
      }),
      metadata: { gameId },
    }))
  })
})
