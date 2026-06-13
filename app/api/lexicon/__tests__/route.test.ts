import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock lexicon category lookup
vi.mock('@/lib/lexicon/categories', () => ({
  getCategoryWords: vi.fn(),
}))

// Mock @supabase/supabase-js createClient
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

import { GET, POST } from '../../lexicon/[id]/route'
import { getCategoryWords } from '@/lib/lexicon/categories'
import { createClient } from '@supabase/supabase-js'

const mockGetCategoryWords = vi.mocked(getCategoryWords)
const mockCreateClient = vi.mocked(createClient)

const FAKE_WORDS = [
  { id: 'w1', text: 'apple' },
  { id: 'w2', text: 'banana' },
]

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeMockClient(
  getUserResult: { data: { user: { id: string } | null } },
  fromImpl?: () => unknown
) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(getUserResult),
    },
    from: fromImpl ?? vi.fn().mockReturnValue({}),
  }
}

describe('GET /api/lexicon/[id]', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 404 when category has no words', async () => {
    mockGetCategoryWords.mockReturnValue([])
    const req = new Request('http://localhost/api/lexicon/unknown')
    const res = await GET(req, makeParams('unknown'))
    expect(res.status).toBe(404)
  })

  it('returns 200 with words for a valid category (no auth required)', async () => {
    mockGetCategoryWords.mockReturnValue(FAKE_WORDS as never)
    const req = new Request('http://localhost/api/lexicon/food')
    const res = await GET(req, makeParams('food'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.words).toHaveLength(2)
  })
})

describe('POST /api/lexicon/[id]', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns 401 when Authorization header is missing', async () => {
    mockGetCategoryWords.mockReturnValue(FAKE_WORDS as never)
    const req = new NextRequest('http://localhost/api/lexicon/food', { method: 'POST' })
    const res = await POST(req, makeParams('food'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when token resolves to null user', async () => {
    mockGetCategoryWords.mockReturnValue(FAKE_WORDS as never)
    mockCreateClient.mockReturnValue(
      makeMockClient({ data: { user: null } }) as never
    )
    const req = new NextRequest('http://localhost/api/lexicon/food', {
      method: 'POST',
      headers: { Authorization: 'Bearer bad-token' },
    })
    const res = await POST(req, makeParams('food'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when category has no words (authenticated)', async () => {
    mockGetCategoryWords.mockReturnValue([])
    mockCreateClient.mockReturnValue(
      makeMockClient({ data: { user: { id: 'user-123' } } }) as never
    )
    const req = new NextRequest('http://localhost/api/lexicon/unknown', {
      method: 'POST',
      headers: { Authorization: 'Bearer good-token' },
    })
    const res = await POST(req, makeParams('unknown'))
    expect(res.status).toBe(404)
  })

  it('returns 200 with words and wordBankRows for authenticated user', async () => {
    mockGetCategoryWords.mockReturnValue(FAKE_WORDS as never)

    const authClientMock = makeMockClient({ data: { user: { id: 'user-123' } } })
    const userClientMock = {
      auth: { getUser: vi.fn() },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    }

    mockCreateClient
      .mockReturnValueOnce(authClientMock as never)
      .mockReturnValueOnce(userClientMock as never)

    const req = new NextRequest('http://localhost/api/lexicon/food', {
      method: 'POST',
      headers: { Authorization: 'Bearer good-token' },
    })
    const res = await POST(req, makeParams('food'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.words).toHaveLength(2)
    expect(body.wordBankRows).toEqual([])
  })
})
