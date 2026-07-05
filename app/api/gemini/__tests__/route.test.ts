import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  validateBody: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    chats = {
      create: vi.fn(() => ({
        sendMessage: mocks.sendMessage,
      })),
    }
  },
}))

vi.mock('@/lib/api/guards', () => ({
  requireSameOrigin: () => null,
  requireUser: async () => ({ user: { id: 'u1' }, error: null }),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: mocks.validateBody,
  SECURE_HEADERS: { 'Cache-Control': 'no-store' },
  publicErrorResponse: (status: number, message: string) =>
    Response.json({ error: message }, { status }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ from: mocks.from }),
}))

vi.mock('@/lib/gemini/fallback', () => ({
  FALLBACK_MODELS: ['model-a', 'model-b'],
  getErrorStatus: (error: unknown) =>
    typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status?: number }).status
      : undefined,
  shouldTryNextModel: (error: unknown) =>
    typeof error === 'object' && error !== null && (error as { status?: number }).status === 429,
}))

import { POST } from '../route'

function reqWith(): Request {
  return new Request('http://x/api/gemini', { method: 'POST', body: '{}' })
}

beforeEach(() => {
  mocks.sendMessage.mockReset()
  mocks.validateBody.mockReset()
  mocks.from.mockReset()
  process.env.GEMINI_API_KEY = 'test'
})

describe('main gemini route', () => {
  it('rejects requests where the last message is not from the user', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { messages: [{ role: 'model', content: 'hello' }], promptKey: 'default', stream: false },
      error: null,
    })

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Last message must be from the user')
    expect(mocks.sendMessage).not.toHaveBeenCalled()
  })

  it('requires admin role for admin-seed prompt key', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: {
        messages: [{ role: 'user', content: 'seed' }],
        promptKey: 'admin-seed',
        activeTab: 'sounds',
        sounds: [],
        stream: false,
      },
      error: null,
    })
    mocks.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'user' }, error: null }),
    })

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })

  it('tries the next model for retryable provider errors', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { messages: [{ role: 'user', content: 'hello' }], promptKey: 'default', stream: false },
      error: null,
    })
    mocks.sendMessage
      .mockRejectedValueOnce({ status: 429, message: 'quota' })
      .mockResolvedValueOnce({ text: 'fallback ok' })

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.content).toBe('fallback ok')
    expect(mocks.sendMessage).toHaveBeenCalledTimes(2)
  })
})
