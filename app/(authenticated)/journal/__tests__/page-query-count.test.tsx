import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/session', () => ({
  getSupabaseServerUserId: async () => 'user-1',
}))
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ from: mocks.from }),
}))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/components/layout/PageLayout', () => ({ default: () => null }))
vi.mock('@/components/layout/PageHeader', () => ({ default: () => null }))
vi.mock('@/components/journal/JournalWorkspace', () => ({ JournalWorkspace: () => null }))
vi.mock('@/components/journal/JournalSupportRail', () => ({ JournalSupportRail: () => null }))

import JournalPage from '../page'

function queryResult(data: unknown) {
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error: null }).then(resolve),
  }
  return chain
}

beforeEach(() => {
  mocks.from.mockReset()
  mocks.from.mockImplementation((table: string) => queryResult(table === 'word_bank' ? [] : []))
})

describe('/journal query budget', () => {
  it('uses zero server queries per server render', async () => {
    await JournalPage()

    expect(mocks.from).toHaveBeenCalledTimes(0)
  })
})
