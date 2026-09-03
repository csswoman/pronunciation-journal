import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSpeechLatencyData } from '../speech-latency-queries'

const mockFrom = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}))

describe('getSpeechLatencyData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns nulls when user has no speech answers in window', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    })

    const result = await getSpeechLatencyData('u1')
    expect(result).toEqual({
      averageMs: null,
      trend: null,
    })
  })

  it('computes average latency and trend from spoken answers', async () => {
    const now = Date.now()
    const fiveDaysAgo = new Date(now - 5 * 86_400_000).toISOString()
    const twentyDaysAgo = new Date(now - 20 * 86_400_000).toISOString()

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            exercise_type_id: 16,
            time_ms: 2000,
            is_correct: true,
            answered_at: fiveDaysAgo,
            exercise_payload: { constraintId: 'c1' },
          },
          {
            exercise_type_id: 17,
            time_ms: 4000,
            is_correct: true,
            answered_at: twentyDaysAgo,
            exercise_payload: null,
          },
        ],
      }),
    })

    const result = await getSpeechLatencyData('u1', now)
    expect(result.averageMs).toBe(3000) // (2000 + 4000) / 2
    expect(result.trend).not.toBeNull()
    expect(result.trend?.recentMs).toBe(2000)
    expect(result.trend?.olderMs).toBe(4000)
    expect(result.trend?.improvedMs).toBe(2000) // Se aceleró 2000ms
  })
})
