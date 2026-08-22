import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  validateBody: vi.fn(),
}))

const chatCreateSpy = vi.fn((config: unknown) => config)

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    chats = {
      create: vi.fn((args: unknown) => {
        chatCreateSpy(args)
        return { sendMessage: mocks.sendMessage }
      }),
    }
  },
}))

vi.mock('@/lib/api/guards', () => ({
  requireSameOrigin: () => null,
  requireUser: async () => ({ user: { id: 'u1' }, error: null }),
  checkLayeredRateLimit: () => ({ limited: false, error: null }),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: mocks.validateBody,
  SECURE_HEADERS: { 'Cache-Control': 'no-store' },
  publicErrorResponse: (status: number, message: string) =>
    Response.json({ error: message }, { status }),
}))

vi.mock('@/lib/ai-practice/server-state', () => ({
  fetchServerLearningState: vi.fn(async () => null),
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
import { VOICE_TURN_INSTRUCTION } from '@/lib/ai-practice/prompts'

function reqWith(): Request {
  return new Request('http://x/api/gemini', { method: 'POST', body: '{}' })
}

beforeEach(() => {
  mocks.sendMessage.mockReset()
  mocks.validateBody.mockReset()
  chatCreateSpy.mockClear()
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

  it('includes the voice-turn instruction in the system prompt for a scored spoken turn', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: {
        messages: [{ role: 'user', content: 'hello', voice: { transcript: true, scored: true } }],
        promptKey: 'default',
        stream: false,
      },
      error: null,
    })
    mocks.sendMessage.mockResolvedValueOnce({ text: 'ok' })

    await POST(reqWith() as never)

    const config = chatCreateSpy.mock.calls[0][0] as { config: { systemInstruction: string } }
    expect(config.config.systemInstruction).toContain(VOICE_TURN_INSTRUCTION)
  })

  it('omits the voice-turn instruction for a plain text turn', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: {
        messages: [{ role: 'user', content: 'hello' }],
        promptKey: 'default',
        stream: false,
      },
      error: null,
    })
    mocks.sendMessage.mockResolvedValueOnce({ text: 'ok' })

    await POST(reqWith() as never)

    const config = chatCreateSpy.mock.calls[0][0] as { config: { systemInstruction: string } }
    expect(config.config.systemInstruction).not.toContain(VOICE_TURN_INSTRUCTION)
  })

  it('omits the voice-turn instruction for an unscored voice turn', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: {
        messages: [{ role: 'user', content: 'hello', voice: { transcript: true, scored: false } }],
        promptKey: 'default',
        stream: false,
      },
      error: null,
    })
    mocks.sendMessage.mockResolvedValueOnce({ text: 'ok' })

    await POST(reqWith() as never)

    const config = chatCreateSpy.mock.calls[0][0] as { config: { systemInstruction: string } }
    expect(config.config.systemInstruction).not.toContain(VOICE_TURN_INSTRUCTION)
  })
})
