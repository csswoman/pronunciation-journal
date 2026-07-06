import { afterEach, describe, it, expect, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

function makeRequest(url: string) {
  return new Request(url)
}

describe('GET /api/health', () => {
  it('returns 200 for liveness (no ?ready param)', async () => {
    const { GET } = await import('../route')
    const res = await GET(makeRequest('http://localhost/api/health'))

    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.version).toBeDefined()
  })

  it('returns 503 for readiness when Supabase env vars are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    vi.stubEnv('GEMINI_API_KEY', '')

    const { GET } = await import('../route')
    const res = await GET(makeRequest('http://localhost/api/health?ready=1'))

    expect(res.status).toBe(503)

    const body = await res.json()
    expect(body.status).toBe('degraded')
    expect(body.checks.supabase.status).toBe('error')
    expect(body.checks.gemini).toBeDefined()
  })
})
