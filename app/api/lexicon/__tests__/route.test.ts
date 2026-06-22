import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock lexicon category lookup
vi.mock('@/lib/lexicon/categories', () => ({
  getCategoryWords: vi.fn(),
}))

vi.mock('@/lib/api/guards', () => ({
  requireUser: vi.fn(),
  rateLimit: vi.fn(),
  createUserScopedClient: vi.fn(),
  SECURE_HEADERS: { 'Cache-Control': 'no-store' },
}))

import { GET, POST } from '../../lexicon/[id]/route'
import { getCategoryWords } from '@/lib/lexicon/categories'
import {
  requireUser,
  rateLimit,
  createUserScopedClient,
} from '@/lib/api/guards'

const mockGetCategoryWords = vi.mocked(getCategoryWords)
const mockRequireUser = vi.mocked(requireUser)
const mockRateLimit = vi.mocked(rateLimit)
const mockCreateUserScopedClient = vi.mocked(createUserScopedClient)

const FAKE_WORDS = [
  { id: 'w1', text: 'apple' },
  { id: 'w2', text: 'banana' },
]

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/lexicon/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockReturnValue({ limited: false, error: null })
  })

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
    mockRateLimit.mockReturnValue({ limited: false, error: null })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns 401 when Authorization header is missing', async () => {
    mockGetCategoryWords.mockReturnValue(FAKE_WORDS as never)
    mockRequireUser.mockResolvedValue({
      user: null,
      error: new Response(null, { status: 401 }) as never,
      accessToken: null,
    })
    const req = new NextRequest('http://localhost/api/lexicon/food', { method: 'POST' })
    const res = await POST(req, makeParams('food'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when token resolves to null user', async () => {
    mockGetCategoryWords.mockReturnValue(FAKE_WORDS as never)
    mockRequireUser.mockResolvedValue({
      user: null,
      error: new Response(null, { status: 401 }) as never,
      accessToken: null,
    })
    const req = new NextRequest('http://localhost/api/lexicon/food', {
      method: 'POST',
      headers: { Authorization: 'Bearer bad-token' },
    })
    const res = await POST(req, makeParams('food'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when category has no words (authenticated)', async () => {
    mockGetCategoryWords.mockReturnValue([])
    mockRequireUser.mockResolvedValue({
      user: { id: 'user-123' } as never,
      error: null,
      accessToken: 'good-token',
    })
    const req = new NextRequest('http://localhost/api/lexicon/unknown', {
      method: 'POST',
      headers: { Authorization: 'Bearer good-token' },
    })
    const res = await POST(req, makeParams('unknown'))
    expect(res.status).toBe(404)
  })

  it('returns 200 with words and wordBankRows for authenticated user', async () => {
    mockGetCategoryWords.mockReturnValue(FAKE_WORDS as never)

    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })
    const userClientMock = {
      from: vi.fn().mockReturnValue({
        select: selectMock,
      }),
    }

    mockRequireUser.mockResolvedValue({
      user: { id: 'user-123' } as never,
      error: null,
      accessToken: 'good-token',
    })
    mockCreateUserScopedClient.mockReturnValue(userClientMock as never)

    const req = new NextRequest('http://localhost/api/lexicon/food', {
      method: 'POST',
      headers: { Authorization: 'Bearer good-token' },
    })
    const res = await POST(req, makeParams('food'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.words).toHaveLength(2)
    expect(body.wordBankRows).toEqual([])
    expect(selectMock).toHaveBeenCalledWith(
      'id, user_id, text, meaning, example, difficulty, source, source_ref, status, srs_status, audio_url, ipa, context, created_at, updated_at, ease_factor, interval_days, repetitions, review_count, last_reviewed_at, next_review_at, error_reason, has_audio, audio_fetch_attempts, image_prompt, synonyms, translation'
    )
  })
})
