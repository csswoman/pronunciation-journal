import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createUserScopedClient: vi.fn(),
  enqueueWordEnrichmentJob: vi.fn(),
}))

vi.mock('@/lib/api/guards', () => ({
  createUserScopedClient: mocks.createUserScopedClient,
  requireSameOrigin: () => null,
  requireUser: mocks.requireUser,
  SECURE_HEADERS: { 'Cache-Control': 'no-store' },
  publicErrorResponse: (status: number, message: string) =>
    Response.json({ error: message }, { status }),
  rateLimit: () => ({ limited: false, error: null }),
  redactError: (error: unknown) => error,
}))

vi.mock('@/lib/word-bank/jobs', () => ({
  enqueueWordEnrichmentJob: mocks.enqueueWordEnrichmentJob,
}))

import { POST } from '../route'

function reqWith(): Request {
  return new Request('http://x/api/words/word-1/enrich', { method: 'POST' })
}

function params(id = 'word-1'): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

function userClientFor(row: { id: string; status: string } | null) {
  const selectQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
  }
  const updateQuery = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockResolvedValue({ error: null }),
  }
  const client = {
    from: vi.fn((table: string) => {
      expect(table).toBe('word_bank')
      return client.from.mock.calls.length === 1 ? selectQuery : updateQuery
    }),
  }
  return { client, selectQuery, updateQuery }
}

beforeEach(() => {
  mocks.requireUser.mockReset()
  mocks.createUserScopedClient.mockReset()
  mocks.enqueueWordEnrichmentJob.mockReset()
})

describe('word enrichment route', () => {
  it('requires a bearer access token for the user-scoped client', async () => {
    mocks.requireUser.mockResolvedValueOnce({ user: { id: 'u1' }, error: null, accessToken: null })

    const res = await POST(reqWith() as never, params())

    expect(res.status).toBe(401)
    expect(mocks.createUserScopedClient).not.toHaveBeenCalled()
  })

  it('does not enqueue a duplicate job when the word is already processing', async () => {
    mocks.requireUser.mockResolvedValueOnce({ user: { id: 'u1' }, error: null, accessToken: 'token' })
    const { client } = userClientFor({ id: 'word-1', status: 'processing' })
    mocks.createUserScopedClient.mockReturnValueOnce(client)

    const res = await POST(reqWith() as never, params())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ ok: true, alreadyProcessing: true })
    expect(mocks.enqueueWordEnrichmentJob).not.toHaveBeenCalled()
  })

  it('marks the word as processing and enqueues an enrichment job', async () => {
    mocks.requireUser.mockResolvedValueOnce({ user: { id: 'u1' }, error: null, accessToken: 'token' })
    const { client, updateQuery } = userClientFor({ id: 'word-1', status: 'pending' })
    mocks.createUserScopedClient.mockReturnValueOnce(client)
    mocks.enqueueWordEnrichmentJob.mockResolvedValueOnce('job-1')

    const res = await POST(reqWith() as never, params())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ ok: true, jobId: 'job-1' })
    expect(updateQuery.update).toHaveBeenCalledWith({ status: 'processing', error_reason: null })
    expect(mocks.enqueueWordEnrichmentJob).toHaveBeenCalledWith(client, 'u1', 'word-1')
  })
})
