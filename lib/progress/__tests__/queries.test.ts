import { describe, expect, it, vi } from 'vitest'
import { startOfRollingWindow, sumWeeklyExercises } from '@/lib/progress/windows'

describe('weekly activity summary', () => {
  it('sums session exercise totals instead of counting answer rows', () => {
    expect(sumWeeklyExercises([
      { exercises_total: 5 },
      { exercises_total: 3 },
      { exercises_total: null },
    ])).toBe(8)
  })

  it('uses one shared rolling-window boundary', () => {
    expect(startOfRollingWindow(7, new Date('2026-06-21T12:00:00Z')).toISOString())
      .toBe('2026-06-14T12:00:00.000Z')
  })
})

const mockCreateSupabaseServerClient = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: mockCreateSupabaseServerClient,
}))

describe('getProgressProjections', () => {
  it('calls the aggregate RPCs instead of fetching full activity_sessions/lesson_completions rows', async () => {
    const { getProgressProjections } = await import('../queries')

    const rpc = vi.fn((fn: string) => {
      if (fn === 'get_activity_totals') {
        return Promise.resolve({
          data: [{ sessions: 3, exercises: 12, duration_ms: 45000, active_days: 2 }],
          error: null,
        })
      }
      if (fn === 'get_lesson_completion_total') {
        return Promise.resolve({ data: 4, error: null })
      }
      throw new Error(`unexpected rpc: ${fn}`)
    })
    const answerHistorySelect = vi.fn().mockReturnThis()
    const answerHistoryEq = vi.fn().mockReturnThis()
    const answerHistoryGte = vi.fn().mockReturnThis()
    const answerHistoryNot = vi.fn().mockResolvedValue({ data: [], error: null })

    const from = vi.fn((table: string) => {
      if (table === 'answer_history') {
        return {
          select: answerHistorySelect,
          eq: answerHistoryEq,
          gte: answerHistoryGte,
          not: answerHistoryNot,
        }
      }
      throw new Error(`getProgressProjections should not query table "${table}" directly anymore`)
    })

    mockCreateSupabaseServerClient.mockResolvedValue({ rpc, from })

    const result = await getProgressProjections('user-1')

    expect(rpc).toHaveBeenCalledWith('get_activity_totals')
    expect(rpc).toHaveBeenCalledWith('get_lesson_completion_total')
    expect(answerHistoryGte).toHaveBeenCalled() // bounded window applied
    expect(result.activity).toEqual({ sessions: 3, exercises: 12, durationMs: 45000, activeDays: 2 })
    expect(result.coverage.completed).toBe(4)
  })
})
