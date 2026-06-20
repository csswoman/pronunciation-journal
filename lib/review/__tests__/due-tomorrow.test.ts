import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock must be defined before importing the module under test.
const mockLte = vi.fn()
const mockNot = vi.fn(() => ({ lte: mockLte }))
const mockEq = vi.fn(() => ({ not: mockNot }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from: mockFrom }),
}))

import { fetchDueTomorrowCount } from '@/lib/review/client-queries'

describe('fetchDueTomorrowCount', () => {
  beforeEach(() => {
    mockLte.mockReset()
    mockNot.mockReturnValue({ lte: mockLte })
    mockEq.mockReturnValue({ not: mockNot })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  it('returns the count of items due within 24h', async () => {
    mockLte.mockResolvedValue({ count: 3, error: null })

    const n = await fetchDueTomorrowCount('user-1')
    expect(n).toBe(3)
    expect(mockFrom).toHaveBeenCalledWith('word_bank')
  })

  it('returns 0 when the query errors (offline / RLS)', async () => {
    mockLte.mockResolvedValue({ count: null, error: { message: 'offline' } })

    const n = await fetchDueTomorrowCount('user-1')
    expect(n).toBe(0)
  })

  it('returns 0 when count is null but no error', async () => {
    mockLte.mockResolvedValue({ count: null, error: null })

    const n = await fetchDueTomorrowCount('user-1')
    expect(n).toBe(0)
  })
})
