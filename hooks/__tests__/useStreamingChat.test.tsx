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

describe('useStreamingChat session finalization', () => {
  it('records accumulated exercises when the hook unmounts', () => {
    const { result, unmount } = renderHook(() =>
      useStreamingChat({
        mode: 'chat',
        conversationId: null,
        onConversationCreated: vi.fn(),
        learningState: null,
        setLearningState: vi.fn(),
        onSaveWord: vi.fn(),
        onStartRoleplay: vi.fn(),
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
