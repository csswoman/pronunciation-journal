import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/lexicon/categories', () => ({
  getCategoryWords: () => [],
}))

vi.mock('@/lib/api/guards', () => ({
  SECURE_HEADERS: { 'Cache-Control': 'no-store' },
}))

import { GET } from '../route'

describe('co-located lexicon dynamic route smoke test', () => {
  it('returns 404 for an unknown category', async () => {
    const res = await GET(new Request('http://x/api/lexicon/unknown'), {
      params: Promise.resolve({ id: 'unknown' }),
    })

    expect(res.status).toBe(404)
  })
})
