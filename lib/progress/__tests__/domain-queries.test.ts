import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const createSupabaseServerClient = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient }))

import { getProgressDomainData } from '../domain-queries'

function queryResult(data: unknown[], count: number | null = data.length) {
  const result = { data, count, error: null }
  const chain = {
    select: () => chain,
    eq: () => chain,
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
  return chain
}

describe('getProgressDomainData', () => {
  it('reads grammar and immersion from their canonical owner tables', async () => {
    const tables: string[] = []
    createSupabaseServerClient.mockResolvedValue({
      from: (table: string) => {
        tables.push(table)
        if (table === 'topic_srs') {
          return queryResult([{
            topic: 'grammar:articles',
            srs_status: 'review',
            next_review_at: '2026-09-17T00:00:00.000Z',
            last_reviewed_at: '2026-09-16T00:00:00.000Z',
          }])
        }
        if (table === 'immersion_lesson_progress') {
          return queryResult([
            { watched: true, quiz_score: 80, updated_at: '2020-01-01T00:00:00.000Z' },
            { watched: true, quiz_score: null, updated_at: new Date().toISOString() },
          ])
        }
        return queryResult([], 12)
      },
    })

    const result = await getProgressDomainData('user-1')

    expect(tables).toEqual(['topic_srs', 'immersion_lesson_progress', 'immersion_lessons'])
    expect(result.topics[0]?.srsStatus).toBe('review')
    expect(result.immersion).toEqual({ watched: 2, completed: 1, due: 1, total: 12 })
  })
})
