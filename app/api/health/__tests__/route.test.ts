import { describe, it, expect } from 'vitest'
import { GET } from '../route'

describe('GET /api/health', () => {
  it('returns 200 with liveness status', async () => {
    const res = await GET()

    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.status).toBe('healthy')
    expect(body.checks.process).toBe('ok')
    expect(body.checks.timestamp).toBeDefined()
    expect(body.version).toBeDefined()
  })
})
