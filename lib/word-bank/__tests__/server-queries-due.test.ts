import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ from: vi.fn(), calls: [] as unknown[][] }))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ from: mocks.from }),
}))

import { getWordsDueForReview } from '@/lib/word-bank/server-queries'

function queryResult(data: unknown) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'or', 'order', 'limit']) {
    chain[method] = (...args: unknown[]) => {
      mocks.calls.push([method, ...args])
      return chain
    }
  }
  chain.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data, error: null }).then(resolve)
  return chain
}

beforeEach(() => {
  mocks.calls.length = 0
  mocks.from.mockReset()
})

describe('getWordsDueForReview', () => {
  it('scopes the due review queue to the user and canonical due predicates', async () => {
    mocks.from.mockReturnValue(queryResult([]))

    await expect(getWordsDueForReview('user-1', 3)).resolves.toEqual([])

    expect(mocks.from).toHaveBeenCalledWith('word_bank')
    expect(mocks.calls).toContainEqual(['eq', 'user_id', 'user-1'])
    expect(mocks.calls).toContainEqual(['eq', 'status', 'ready'])
    expect(mocks.calls).toContainEqual([
      'or',
      expect.stringMatching(/^and\(srs_status\.neq\.new,next_review_at\.lte\..+\),verification_due_at\.lte\..+$/),
    ])
    expect(mocks.calls).toContainEqual(['order', 'next_review_at', { ascending: true }])
    expect(mocks.calls).toContainEqual(['limit', 3])
  })
})
