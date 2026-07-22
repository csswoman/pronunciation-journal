import { beforeEach, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { buildValidDiagnosticResult } from '@/lib/pronunciation/assessment/__tests__/fixtures'

const mocks = vi.hoisted(() => ({
  validateBody: vi.fn(),
  persistPronunciationAssessmentServer: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/api/guards', () => ({
  requireSameOrigin: () => null,
  requireUser: async () => ({ user: { id: 'user-123' }, error: null }),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: mocks.validateBody,
  SECURE_HEADERS: { 'Cache-Control': 'no-store' },
  publicErrorResponse: (status: number, message: string) =>
    Response.json({ error: message }, { status }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}))

vi.mock('@/lib/pronunciation/assessment/persistence-server', async () => {
  const actual = await vi.importActual<typeof import('@/lib/pronunciation/assessment/persistence-server')>(
    '@/lib/pronunciation/assessment/persistence-server'
  )
  return {
    ...actual,
    persistPronunciationAssessmentServer: mocks.persistPronunciationAssessmentServer,
  }
})

import { POST } from '../route'

function reqWith(body: unknown): Request {
  return new Request('http://x/api/pronunciation-assessment', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mocks.validateBody.mockReset()
  mocks.persistPronunciationAssessmentServer.mockReset()
  mocks.createSupabaseServerClient.mockReset()
  mocks.createSupabaseServerClient.mockResolvedValue({})
})

describe('pronunciation-assessment route', () => {
  it('returns the validation response when the body is invalid', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: null,
      error: Response.json({ error: 'Invalid request body' }, { status: 400 }),
    })

    const res = await POST(reqWith({}) as never)

    expect(res.status).toBe(400)
    expect(mocks.persistPronunciationAssessmentServer).not.toHaveBeenCalled()
  })

  it('rejects when result.userId does not match the authenticated user', async () => {
    const result = buildValidDiagnosticResult('someone-else')
    mocks.validateBody.mockResolvedValueOnce({
      data: { id: '11111111-1111-1111-1111-111111111111', result },
      error: null,
    })

    const res = await POST(reqWith({}) as never)

    expect(res.status).toBe(403)
    expect(mocks.persistPronunciationAssessmentServer).not.toHaveBeenCalled()
  })

  it('persists a valid result for the authenticated user', async () => {
    const result = buildValidDiagnosticResult('user-123')
    mocks.validateBody.mockResolvedValueOnce({
      data: { id: '11111111-1111-1111-1111-111111111111', result },
      error: null,
    })
    mocks.persistPronunciationAssessmentServer.mockResolvedValueOnce({ ok: true, alreadyPersisted: false })

    const res = await POST(reqWith({}) as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(mocks.persistPronunciationAssessmentServer).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ id: '11111111-1111-1111-1111-111111111111', userId: 'user-123', result })
    )
  })

  it('is idempotent on a retried id (already-persisted counts as success)', async () => {
    const result = buildValidDiagnosticResult('user-123')
    mocks.validateBody.mockResolvedValueOnce({
      data: { id: '11111111-1111-1111-1111-111111111111', result },
      error: null,
    })
    mocks.persistPronunciationAssessmentServer.mockResolvedValueOnce({ ok: true, alreadyPersisted: true })

    const res = await POST(reqWith({}) as never)

    expect(res.status).toBe(200)
    expect((await res.json())).toEqual({ ok: true })
  })

  it('returns 400 when persistence reports an invalid result', async () => {
    const result = buildValidDiagnosticResult('user-123')
    mocks.validateBody.mockResolvedValueOnce({
      data: { id: '11111111-1111-1111-1111-111111111111', result },
      error: null,
    })
    mocks.persistPronunciationAssessmentServer.mockResolvedValueOnce({ ok: false, error: 'invalid_result' })

    const res = await POST(reqWith({}) as never)

    expect(res.status).toBe(400)
  })

  it('returns 500 on unexpected db errors', async () => {
    const result = buildValidDiagnosticResult('user-123')
    mocks.validateBody.mockResolvedValueOnce({
      data: { id: '11111111-1111-1111-1111-111111111111', result },
      error: null,
    })
    mocks.persistPronunciationAssessmentServer.mockResolvedValueOnce({ ok: false, error: 'db_error', detail: 'boom' })

    const res = await POST(reqWith({}) as never)

    expect(res.status).toBe(500)
  })
})
