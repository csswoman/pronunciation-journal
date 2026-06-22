import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock enrichWord — fire-and-forget side effect, not under test
vi.mock('@/lib/word-bank/enrich', () => ({
  enrichWord: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/api/guards', () => ({
  requireUser: vi.fn(),
  rateLimit: vi.fn(),
  validateBody: vi.fn(),
  createUserScopedClient: vi.fn(),
  SECURE_HEADERS: { 'Cache-Control': 'no-store' },
}))

import { POST } from '../route'
import {
  requireUser,
  rateLimit,
  validateBody,
  createUserScopedClient,
} from '@/lib/api/guards'

const mockRequireUser = vi.mocked(requireUser)
const mockRateLimit = vi.mocked(rateLimit)
const mockValidateBody = vi.mocked(validateBody)
const mockCreateUserScopedClient = vi.mocked(createUserScopedClient)

describe('POST /api/words', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    }
    mockRateLimit.mockReturnValue({ limited: false, error: null })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns 401 when Authorization header is missing', async () => {
    mockRequireUser.mockResolvedValue({
      user: null,
      error: new Response(null, { status: 401 }) as never,
      accessToken: null,
    })
    const req = new NextRequest('http://localhost/api/words', {
      method: 'POST',
      body: JSON.stringify({ text: 'hello' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 when token is invalid', async () => {
    mockRequireUser.mockResolvedValue({
      user: null,
      error: new Response(null, { status: 401 }) as never,
      accessToken: null,
    })
    const req = new NextRequest('http://localhost/api/words', {
      method: 'POST',
      headers: { Authorization: 'Bearer bad-token' },
      body: JSON.stringify({ text: 'hello' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when text is missing', async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: 'user-123' } as never,
      error: null,
      accessToken: 'good-token',
    })
    mockValidateBody.mockResolvedValue({
      data: null,
      error: new Response(null, { status: 400 }) as never,
    })
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

    mockRequireUser.mockResolvedValue({
      user: { id: 'user-123' } as never,
      error: null,
      accessToken: 'good-token',
    })
    mockValidateBody.mockResolvedValue({
      data: { text: 'ephemeral' },
      error: null,
    })
    const userClientMock = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: fakeWord, error: null }),
          }),
        }),
      }),
    }

    mockCreateUserScopedClient.mockReturnValue(userClientMock as never)

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
    mockRequireUser.mockResolvedValue({
      user: null,
      error: new Response(null, { status: 500 }) as never,
      accessToken: null,
    })
    const req = new NextRequest('http://localhost/api/words', {
      method: 'POST',
      headers: { Authorization: 'Bearer good-token' },
      body: JSON.stringify({ text: 'hello' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
