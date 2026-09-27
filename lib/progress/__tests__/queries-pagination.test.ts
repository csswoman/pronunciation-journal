import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

type Row = Record<string, unknown>

const state = vi.hoisted(() => ({
  answers: [] as Row[],
  errorTable: null as string | null,
  ranges: [] as Array<{ from: number; to: number }>,
  orders: [] as string[],
  ltes: [] as Array<{ column: string; value: string }>,
}))

function queryFor(table: string) {
  let from = 0
  let to: number | null = null
  let lowerBound: string | null = null
  let upperBound: string | null = null

  const resolve = () => {
    const rows = table === 'answer_history'
      ? state.answers.filter((row) => {
        const answeredAt = row.answered_at
        return typeof answeredAt === 'string'
          && (lowerBound === null || answeredAt >= lowerBound)
          && (upperBound === null || answeredAt <= upperBound)
      })
      : []
    const data = to === null ? rows : rows.slice(from, to + 1)
    return { data, count: data.length, error: state.errorTable === table ? { message: 'query failed' } : null }
  }

  const chain = {
    select: () => chain,
    eq: () => chain,
    gte: (_column: string, value: string) => {
      lowerBound = value
      return chain
    },
    lte: (column: string, value: string) => {
      upperBound = value
      state.ltes.push({ column, value })
      return chain
    },
    not: () => chain,
    order: (column: string) => {
      state.orders.push(column)
      return chain
    },
    range: (start: number, end: number) => {
      from = start
      to = end
      state.ranges.push({ from: start, to: end })
      return chain
    },
    then: (onFulfilled: (value: ReturnType<typeof resolve>) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(resolve()).then(onFulfilled, onRejected),
  }
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ from: queryFor }),
}))

import { getAccuracyStats, getDailyCompletionStats, getFluencyProfile } from '../queries'

const currentAnswerTimestamp = new Date().toISOString()

function answerRow(index: number, overrides: Row = {}): Row {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    exercise_type_id: 5,
    context: 'practice',
    content_id: `content-${index}`,
    is_correct: true,
    grade: 5,
    user_answer: 'answer',
    exercise_payload: { status: 'answered' },
    answered_at: currentAnswerTimestamp,
    ...overrides,
  }
}

describe('progress answer pagination and availability', () => {
  beforeEach(() => {
    state.answers = []
    state.errorTable = null
    state.ranges = []
    state.orders = []
    state.ltes = []
  })

  it('counts grade zero as evaluated retrieval evidence', async () => {
    state.answers = [answerRow(0, { grade: 0, is_correct: false })]

    const stats = await getAccuracyStats('user-1')

    expect(stats.totalAnswers7).toBe(1)
    expect(stats.retrievalQuality7).toBe(0)
  })

  it('reads 1205 equal-timestamp rows in stable answered_at and id pages', async () => {
    state.answers = Array.from({ length: 1205 }, (_, index) => answerRow(index))

    await getFluencyProfile('user-1', {
      wordsByStatus: { new: 0, learning: 0, review: 0, mastered: 0 },
      weakestPhonemes: [],
      essentialWords: { studied: 0, due: 0 },
    })

    expect(state.ranges).toEqual([{ from: 0, to: 999 }, { from: 1000, to: 1999 }])
    expect(state.orders).toEqual(['answered_at', 'id', 'answered_at', 'id'])
  })

  it('marks one failed query unavailable while the other sources stay valid', async () => {
    state.errorTable = 'answer_history'

    const stats = await getDailyCompletionStats('user-1')

    expect(stats.hasError).toBe(true)
    expect(stats.activeDays30).toBe(0)
  })

  it('excludes rows after the captured upper time boundary', async () => {
    state.answers = [
      answerRow(0),
      answerRow(1, { answered_at: '2099-01-01T00:00:00.000Z' }),
    ]

    const stats = await getAccuracyStats('user-1')

    expect(stats.totalAnswers7).toBe(1)
    expect(state.ltes).toHaveLength(1)
    expect(state.ltes[0].column).toBe('answered_at')
  })
})
