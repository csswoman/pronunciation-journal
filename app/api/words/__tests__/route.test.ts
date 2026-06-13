import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock enrichWord — fire-and-forget side effect, not under test
vi.mock('@/lib/word-bank/enrich', () => ({
  enrichWord: vi.fn().mockResolvedValue(undefined),
}))

// Mock @supabase/supabase-js createClient
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

import { POST } from '../route'
import { createClient } from '@supabase/supabase-js'

const mockCreateClient = vi.mocked(createClient)

// Builds a mock Supabase client with the given auth.getUser return value
// and optional from() chain behavior.
function makeMockClient(
  getUserResult: { data: { user: { id: string } | null } },
  fromImpl?: (table: string) => unknown
) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(getUserResult),
    },
    from: fromImpl ?? vi.fn().mockReturnValue({}),
  }
}

describe('POST /api/words', () => {
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
    const req = new NextRequest('http://localhost/api/words', {
      method: 'POST',
      body: JSON.stringify({ text: 'hello' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 when token is invalid (getUser returns null user)', async () => {
    mockCreateClient.mockReturnValue(
      makeMockClient({ data: { user: null } }) as never
    )
    const req = new NextRequest('http://localhost/api/words', {
      method: 'POST',
      headers: { Authorization: 'Bearer bad-token' },
      body: JSON.stringify({ text: 'hello' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when text is missing', async () => {
    mockCreateClient.mockReturnValue(
      makeMockClient({ data: { user: { id: 'user-123' } } }) as never
    )
    const req = new NextRequest('http://localhost/api/words', {
      method: 'POST',
      headers: { Authorization: 'Bearer good-token' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 201 when a new word is created successfully', async () => {
    const fakeWord = { id: 'word-abc', text: 'ephemeral', status: 'processing' }

    // authClient and userClient are created in sequence; provide both mocks
    const authClientMock = makeMockClient({ data: { user: { id: 'user-123' } } })
    const userClientMock = {
      auth: { getUser: vi.fn() },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: fakeWord, error: null }),
          }),
        }),
      }),
    }

    mockCreateClient
      .mockReturnValueOnce(authClientMock as never)
      .mockReturnValueOnce(userClientMock as never)

    const req = new NextRequest('http://localhost/api/words', {
      method: 'POST',
      headers: { Authorization: 'Bearer good-token' },
      body: JSON.stringify({ text: 'ephemeral' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.word.text).toBe('ephemeral')
  })

  it('returns 500 when Supabase env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    // Provide a mock so auth header check passes first
    mockCreateClient.mockReturnValue(
      makeMockClient({ data: { user: { id: 'user-123' } } }) as never
    )
    const req = new NextRequest('http://localhost/api/words', {
      method: 'POST',
      headers: { Authorization: 'Bearer good-token' },
      body: JSON.stringify({ text: 'hello' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
