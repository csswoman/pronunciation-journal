import { describe, it, expect } from 'vitest'
import { GET } from '../route'

function makeRequest(url: string) {
  return new Request(url)
}

describe('GET /api/health', () => {
  it('returns 200 for liveness (no ?ready param)', async () => {
    const res = await GET(makeRequest('http://localhost/api/health'))

    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.version).toBeDefined()
  })

  it('returns 503 for readiness when Supabase env vars are missing', async () => {
    const res = await GET(makeRequest('http://localhost/api/health?ready=1'))

    // In test env, Supabase creds are not set, so readiness reports degraded.
    expect(res.status).toBe(503)

    const body = await res.json()
    expect(body.status).toBe('degraded')
    expect(body.checks.supabase.status).toBe('error')
    expect(body.checks.gemini).toBeDefined()
  })
})
