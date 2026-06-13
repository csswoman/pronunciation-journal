import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock global fetch used for Supabase connectivity check
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { GET } from '../route'

describe('GET /api/health', () => {
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

  it('returns 503 when Supabase env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.status).toBe('unhealthy')
  })

  it('returns 200 with healthy status when Supabase responds ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('healthy')
    expect(body.checks.database).toBe('✓')
  })

  it('returns 200 when Supabase responds 401 (expected without auth scope)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('healthy')
  })

  it('returns 503 when Supabase fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network timeout'))
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.status).toBe('unhealthy')
    expect(body.message).toContain('network timeout')
  })
})
