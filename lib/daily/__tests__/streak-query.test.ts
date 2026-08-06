import { beforeEach, describe, it, expect, vi } from 'vitest'

const results = vi.hoisted(() => new Map<string, { data: Array<Record<string, unknown>>; error: null }>())

function builder(result: { data: Array<Record<string, unknown>>; error: null }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    not: () => chain,
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => builder(results.get(table) ?? { data: [], error: null }),
  }),
}))

import { getDailyStreak } from '../streak'

describe('getDailyStreak — merges activity sources', () => {
  beforeEach(() => {
    results.clear()
  })

  it('counts a day with only one lesson_completions row (no answer_history) as qualifying', async () => {
    const today = new Date().toISOString()
    results.set('lesson_completions', { data: [{ completed_at: today }], error: null })

    const result = await getDailyStreak('user-1')
    expect(result.completedToday).toBe(true)
    expect(result.currentStreak).toBe(1)
  })

  it('counts a day with only one activity_sessions row as qualifying', async () => {
    const today = new Date().toISOString()
    results.set('activity_sessions', { data: [{ completed_at: today }], error: null })

    const result = await getDailyStreak('user-1')
    expect(result.completedToday).toBe(true)
  })

  it('still counts a day with only answer_history rows (backward compatible)', async () => {
    const today = new Date().toISOString()
    results.set('answer_history', { data: [{ answered_at: today }], error: null })

    const result = await getDailyStreak('user-1')
    expect(result.completedToday).toBe(true)
  })

  it('returns no streak when all three sources are empty', async () => {
    const result = await getDailyStreak('user-1')
    expect(result.completedToday).toBe(false)
    expect(result.currentStreak).toBe(0)
  })
})
