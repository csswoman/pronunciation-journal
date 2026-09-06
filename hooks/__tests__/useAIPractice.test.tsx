// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAIPractice } from '../useAIPractice'
import type { UserLearningState } from '@/lib/ai-practice/learning-state'

const { persistLearningStateMock, hydrateFromRemoteMock, updateConversationMock } = vi.hoisted(() => ({
  persistLearningStateMock: vi.fn(async () => undefined),
  hydrateFromRemoteMock: vi.fn(async () => undefined),
  updateConversationMock: vi.fn(async () => undefined),
}))

// Captured so tests can trigger `learningState` updates the same way useStreamingChat would.
let capturedSetLearningState: ((state: UserLearningState) => void) | null = null
let capturedMissionIntentObserved: ((intentId: string) => void) | null = null
let capturedStartMission: ((missionId: string) => void) | null = null

vi.mock('@/lib/ai-practice/queries', () => ({
  persistLearningState: persistLearningStateMock,
  hydrateFromRemote: hydrateFromRemoteMock,
}))
vi.mock('@/lib/ai-practice/load-state', () => ({
  getUserLearningState: vi.fn(async () => null),
}))
vi.mock('@/lib/ai-practice/conversation-mode', () => ({
  switchMode: vi.fn(async () => ({ conversationId: 41, conversation: { messages: [] } })),
}))
vi.mock('@/lib/db/ai', () => ({
  deleteConversation: vi.fn(async () => undefined),
  updateConversation: updateConversationMock,
}))
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))
vi.mock('../useSavedWords', () => ({
  useSavedWords: () => ({
    wordToSave: null,
    setWordToSave: vi.fn(),
    openSaveWordModal: vi.fn(),
    closeSaveWordModal: vi.fn(),
    confirmSaveWord: vi.fn(async () => undefined),
    saveSaveable: vi.fn(async () => undefined),
  }),
}))
vi.mock('../useStreamingChat', () => ({
  useStreamingChat: (opts: {
    setLearningState: (state: UserLearningState) => void
    onMissionIntentObserved: (intentId: string) => void
    onStartMission: (missionId: string) => void
  }) => {
    capturedSetLearningState = opts.setLearningState
    capturedMissionIntentObserved = opts.onMissionIntentObserved
    capturedStartMission = opts.onStartMission
    return {
      messages: [],
      isStreaming: false,
      error: null,
      quotaExhausted: false,
      sendMessage: vi.fn(async () => undefined),
      answerToolCall: vi.fn(),
      resetChat: vi.fn(),
      finalizeSession: vi.fn(),
      loadMessages: vi.fn(),
    }
  },
}))

describe('useAIPractice adaptive-state flush', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    persistLearningStateMock.mockClear()
    updateConversationMock.mockClear()
    capturedSetLearningState = null
    capturedMissionIntentObserved = null
    capturedStartMission = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function mountAndSettle() {
    const rendered = renderHook(() => useAIPractice())
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    return rendered
  }

  it('flushes the pending learningState snapshot on unmount before the 5s debounce fires', async () => {
    const { unmount } = await mountAndSettle()

    act(() => {
      capturedSetLearningState?.({ weakTopics: ['th-sound'] } as unknown as UserLearningState)
    })

    // Unmount well within the 5s debounce window — nothing has persisted yet.
    unmount()

    expect(persistLearningStateMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ weakTopics: ['th-sound'] }),
    )
  })

  it('does not double-persist when the debounce already flushed before unmount', async () => {
    const { unmount } = await mountAndSettle()

    act(() => {
      capturedSetLearningState?.({ weakTopics: ['th-sound'] } as unknown as UserLearningState)
    })

    await act(async () => {
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    expect(persistLearningStateMock).toHaveBeenCalledTimes(1)

    unmount()

    expect(persistLearningStateMock).toHaveBeenCalledTimes(1)
  })

  it('flushes the pending snapshot on pagehide instead of losing it', async () => {
    await mountAndSettle()

    act(() => {
      capturedSetLearningState?.({ weakTopics: ['schwa'] } as unknown as UserLearningState)
    })

    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })

    expect(persistLearningStateMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ weakTopics: ['schwa'] }),
    )
  })

  it('forwards observed mission intents to the registered MissionRunner owner', async () => {
    const { result } = await mountAndSettle()
    const onMissionIntent = vi.fn()

    act(() => {
      result.current.setMissionIntentHandler(onMissionIntent)
      capturedMissionIntentObserved?.('placed_order')
    })

    expect(onMissionIntent).toHaveBeenCalledWith('placed_order')
  })

  it('activates the mission mode when the stream starts an authored mission', async () => {
    const { result } = await mountAndSettle()

    await act(async () => {
      capturedStartMission?.('roleplay.cafe')
      await Promise.resolve()
    })

    expect(result.current.activeMissionId).toBe('roleplay.cafe')
    expect(result.current.mode).toBe('mission:roleplay.cafe')
    expect(updateConversationMock).toHaveBeenCalledWith('user-1', 41, {
      mode: 'mission:roleplay.cafe',
    })
  })
})
