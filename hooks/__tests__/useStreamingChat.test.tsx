// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useStreamingChat } from '../useStreamingChat'

const { persistResultMock, recordSessionMock } = vi.hoisted(() => ({
  persistResultMock: vi.fn(async () => undefined),
  recordSessionMock: vi.fn(async () => undefined),
}))

vi.mock('@/lib/ai-practice/coach-progress', () => ({
  persistCoachExerciseResult: persistResultMock,
  recordCoachSession: recordSessionMock,
}))
vi.mock('@/lib/db/ai', () => ({
  saveConversation: vi.fn(),
  updateConversation: vi.fn(),
}))
vi.mock('@/lib/ai-practice/events', () => ({ logEvent: vi.fn(async () => undefined) }))

function makeHook() {
  return renderHook(() =>
    useStreamingChat({
      mode: 'chat',
      conversationId: null,
      onConversationCreated: vi.fn(),
      learningState: null,
      setLearningState: vi.fn(),
      onStartMission: vi.fn(),
      onMissionIntentObserved: vi.fn(),
      userId: 'user-1',
    }),
  )
}

describe('useStreamingChat failed sends', () => {
  it('surfaces an error and clears the empty turn when a hidden send fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })))
    const { result } = makeHook()

    await act(async () => {
      await result.current.sendMessage('hidden starter prompt', { hidden: true })
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.messages).toHaveLength(0)
    vi.unstubAllGlobals()
  })

  it('retries the last failed send, hidden flag preserved, and clears the error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('boom', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(new TextEncoder().encode('data: {"type":"text_delta","delta":"hi"}\n'))
              c.enqueue(new TextEncoder().encode('data: {"type":"done"}\n'))
              c.close()
            },
          }),
          { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)
    const { result } = makeHook()

    await act(async () => {
      await result.current.sendMessage('hidden starter prompt', { hidden: true })
    })
    expect(result.current.error).toBeTruthy()

    await act(async () => {
      await result.current.retryLastFailedSend()
    })

    expect(result.current.error).toBeNull()
    const bodies = fetchMock.mock.calls.map((c) => JSON.parse((c[1] as RequestInit).body as string))
    expect(bodies).toHaveLength(2)
    // Both sends carry the same hidden starter text.
    expect(JSON.stringify(bodies[1])).toContain('hidden starter prompt')
    // The retried user turn stays hidden, exactly as the original starter send.
    expect(result.current.messages.filter((m) => m.role === 'user').every((m) => m.hidden)).toBe(true)
    vi.unstubAllGlobals()
  })

  it('is a no-op retry when nothing has failed', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const { result } = makeHook()

    await act(async () => {
      await result.current.retryLastFailedSend()
    })

    expect((globalThis.fetch as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('surfaces an error and drops the empty model placeholder when stream ends with zero content', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          new ReadableStream({
            start(c) {
              c.close()
            },
          }),
          { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
        ),
      ),
    )
    const { result } = makeHook()

    await act(async () => {
      await result.current.sendMessage('hello test')
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.messages).toHaveLength(1)
    const [msg] = result.current.messages
    expect(msg.role).toBe('user')
    if (msg.role === 'user') {
      expect(msg.content).toBe('hello test')
    }
    vi.unstubAllGlobals()
  })
})

describe('useStreamingChat session finalization', () => {
  it('aborts an active stream when the hook unmounts', async () => {
    let capturedSignal: AbortSignal | undefined
    vi.stubGlobal('fetch', vi.fn((_url, init) => {
      capturedSignal = (init as RequestInit).signal as AbortSignal
      return new Promise(() => undefined)
    }))

    const { result, unmount } = renderHook(() =>
      useStreamingChat({
        mode: 'chat',
        conversationId: null,
        onConversationCreated: vi.fn(),
        learningState: null,
        setLearningState: vi.fn(),
        onStartMission: vi.fn(),
        onMissionIntentObserved: vi.fn(),
        userId: 'user-1',
      }),
    )

    await act(async () => {
      void result.current.sendMessage('hello')
      await Promise.resolve()
    })

    unmount()

    expect(capturedSignal?.aborted).toBe(true)
    vi.unstubAllGlobals()
  })

  it('records accumulated exercises when the hook unmounts', () => {
    const { result, unmount } = renderHook(() =>
      useStreamingChat({
        mode: 'chat',
        conversationId: null,
        onConversationCreated: vi.fn(),
        learningState: null,
        setLearningState: vi.fn(),
        onStartMission: vi.fn(),
        onMissionIntentObserved: vi.fn(),
        userId: 'user-1',
      }),
    )

    act(() => {
      result.current.answerToolCall('call-1', {
        correct: true,
        topic: 'present simple',
        gradedBy: 'client',
        latencyMs: 500,
      })
    })
    unmount()

    expect(recordSessionMock).toHaveBeenCalledWith('user-1', [
      {
        toolName: 'exercise_result',
        result: {
          correct: true,
          topic: 'present simple',
          gradedBy: 'client',
          latencyMs: 500,
        },
      },
    ])
  })
})
