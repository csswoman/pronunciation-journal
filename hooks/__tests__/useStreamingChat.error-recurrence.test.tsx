// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStreamingChat } from '../useStreamingChat'
import type { AIMessage, CoachErrorRecurrenceFeedback, ToolCall } from '@/lib/ai-practice/types'

const { recordRecurrenceMock } = vi.hoisted(() => ({
  recordRecurrenceMock: vi.fn(async () => true),
}))

vi.mock('@/lib/ai-practice/coach-progress', () => ({
  persistCoachExerciseResult: vi.fn(async () => undefined),
  recordCoachSession: vi.fn(async () => undefined),
}))
vi.mock('@/lib/db/ai', () => ({
  saveConversation: vi.fn(),
  updateConversation: vi.fn(),
}))
vi.mock('@/lib/ai-practice/events', () => ({ logEvent: vi.fn(async () => undefined) }))
vi.mock('@/lib/practice/error-recurrence-sync', () => ({
  recordPracticeErrorRecurrence: recordRecurrenceMock,
}))

function makeHook(userId: string | null = 'user-1') {
  return renderHook(() =>
    useStreamingChat({
      mode: 'chat',
      conversationId: null,
      onConversationCreated: vi.fn(),
      learningState: null,
      setLearningState: vi.fn(),
      onStartMission: vi.fn(),
      onMissionIntentObserved: vi.fn(),
      userId,
    }),
  )
}

function correctionResponse(errorPattern = 'tense_present_for_past') {
  const callId = 'annotation-1'
  const args = JSON.stringify({
    correction: {
      original: 'I go yesterday',
      corrected: 'I went yesterday',
      rule: 'Yesterday requiere pasado simple.',
      kind: 'error',
      errorPattern,
    },
  })
  const chunks = [
    { type: 'tool_call_start', id: callId, name: 'annotate_turn' },
    { type: 'tool_call_args_delta', id: callId, delta: args },
    { type: 'tool_call_end', id: callId },
    { type: 'done' },
  ]

  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n`))
        }
        controller.close()
      },
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
  )
}

function persistedCorrection(
  patternId: string,
  options: { hidden?: boolean; errorRecurrence?: CoachErrorRecurrenceFeedback } = {},
): AIMessage[] {
  const call: ToolCall = {
    id: 'old-annotation',
    name: 'annotate_turn',
    status: 'answered',
    args: {
      correction: {
        original: 'I go yesterday',
        corrected: 'I went yesterday',
        rule: 'Yesterday requiere pasado simple.',
        kind: 'error',
        errorPattern: patternId,
      },
    },
  }
  return [
    {
      role: 'user',
      content: 'I go yesterday',
      timestamp: '2026-09-25T10:00:00.000Z',
      hidden: options.hidden,
    },
    {
      role: 'model',
      contentParts: [],
      toolCalls: new Map([[call.id, call]]),
      timestamp: '2026-09-25T10:00:01.000Z',
      errorRecurrence: options.errorRecurrence,
    },
  ]
}

function lastModelMessage(messages: AIMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'model')
}

describe('useStreamingChat Coach error recurrence', () => {
  beforeEach(() => {
    recordRecurrenceMock.mockReset().mockResolvedValue(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('records one occurrence of the same pattern per conversation', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => correctionResponse()))
    const { result } = makeHook()

    await act(async () => { await result.current.sendMessage('I go yesterday') })
    await act(async () => { await result.current.sendMessage('I go yesterday again') })

    expect(recordRecurrenceMock).toHaveBeenCalledTimes(1)
    expect(recordRecurrenceMock).toHaveBeenCalledWith('user-1', 'tense_present_for_past', undefined, false)
  })

  it('records distinct patterns and does not re-register corrections restored from history', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(correctionResponse('tense_present_for_past'))
      .mockResolvedValueOnce(correctionResponse('article_use'))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = makeHook()

    await act(async () => { await result.current.sendMessage('I go yesterday') })
    await act(async () => { await result.current.sendMessage('I have dog') })
    expect(recordRecurrenceMock).toHaveBeenCalledTimes(2)

    const resumed = makeHook()
    act(() => resumed.result.current.loadMessages(persistedCorrection('tense_present_for_past')))
    expect(recordRecurrenceMock).toHaveBeenCalledTimes(2)
    vi.stubGlobal('fetch', vi.fn(async () => correctionResponse('tense_present_for_past')))

    await act(async () => { await resumed.result.current.sendMessage('I go yesterday again') })
    expect(recordRecurrenceMock).toHaveBeenCalledTimes(2)
  })

  it('does not restore hidden corrections or previously failed saves as recorded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => correctionResponse()))
    const hiddenHistory = makeHook()
    act(() => hiddenHistory.result.current.loadMessages(persistedCorrection('tense_present_for_past', { hidden: true })))
    await act(async () => { await hiddenHistory.result.current.sendMessage('I go yesterday') })
    expect(recordRecurrenceMock).toHaveBeenCalledTimes(1)

    recordRecurrenceMock.mockClear()
    const failedHistory = makeHook()
    act(() => failedHistory.result.current.loadMessages(persistedCorrection('tense_present_for_past', {
      errorRecurrence: { patternId: 'tense_present_for_past', status: 'failed' },
    })))
    await act(async () => { await failedHistory.result.current.sendMessage('I go yesterday') })
    expect(recordRecurrenceMock).toHaveBeenCalledTimes(1)
  })

  it('does not record hidden turns or guest turns', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => correctionResponse()))
    const authenticated = makeHook()
    await act(async () => {
      await authenticated.result.current.sendMessage('hidden correction', { hidden: true })
    })
    expect(recordRecurrenceMock).not.toHaveBeenCalled()

    const guest = makeHook(null)
    await act(async () => { await guest.result.current.sendMessage('I go yesterday') })
    expect(recordRecurrenceMock).not.toHaveBeenCalled()
    const modelMessage = lastModelMessage(guest.result.current.messages)
    expect(modelMessage?.role === 'model' ? modelMessage.errorRecurrence : undefined).toBeUndefined()
  })

  it('reports a failed save and retries the pattern on a later turn', async () => {
    recordRecurrenceMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    vi.stubGlobal('fetch', vi.fn(async () => correctionResponse()))
    const { result } = makeHook()

    await act(async () => { await result.current.sendMessage('I go yesterday') })
    let modelMessage = lastModelMessage(result.current.messages)
    expect(modelMessage?.role === 'model' ? modelMessage.errorRecurrence?.status : undefined).toBe('failed')

    await act(async () => { await result.current.sendMessage('I go yesterday again') })
    modelMessage = lastModelMessage(result.current.messages)
    expect(modelMessage?.role === 'model' ? modelMessage.errorRecurrence?.status : undefined).toBe('saved')
    expect(recordRecurrenceMock).toHaveBeenCalledTimes(2)
  })
})
