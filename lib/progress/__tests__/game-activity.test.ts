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

  it('builds real exercise results from game hits and misses', async () => {
    await recordGameActivity('user-1', 'phoneme_invaders', 4000, 'phoneme-invaders', ['listening'], {
      hits: 7,
      misses: 3,
      slug: 'minimal_pair',
    })

    const input = vi.mocked(recordActivitySession).mock.calls.at(-1)![1]
    const { sessionResult } = input
    expect(sessionResult.results).toHaveLength(10)
    expect(sessionResult.results.filter((result) => result.isCorrect)).toHaveLength(7)
    expect(sessionResult.results.filter((result) => !result.isCorrect)).toHaveLength(3)
    expect(sessionResult.results.every((result) => result.exerciseTypeId === null)).toBe(true)
    expect(sessionResult.accuracy).toBeCloseTo(70)
    expect(sessionResult.totalTimeMs).toBe(4000)
  })

  it('reports 0% accuracy when there are no hits or misses', async () => {
    await recordGameActivity('user-1', 'memory_match', 1000, 'memory-match', ['vocabulary'], {
      hits: 0,
      misses: 0,
      slug: 'match_pairs',
    })

    const input = vi.mocked(recordActivitySession).mock.calls.at(-1)![1]
    expect(input.sessionResult.accuracy).toBe(0)
    expect(input.sessionResult.results).toHaveLength(0)
  })
})
