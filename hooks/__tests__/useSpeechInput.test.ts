// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AI_UNAVAILABLE_MESSAGE } from '@/lib/degradation/messages'
import { useSpeechInput } from '@/hooks/useSpeechInput'
import type { SpeechInputAdapter } from '@/lib/speech/types'

function adapter(overrides: Partial<SpeechInputAdapter> = {}): SpeechInputAdapter {
  return {
    isSupported: () => true,
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => ({ transcript: 'hello', source: 'web-speech' as const })),
    abort: vi.fn(),
    ...overrides,
  }
}

describe('useSpeechInput', () => {
  it('normalizes provider stop failures before exposing them to UI', async () => {
    const { result } = renderHook(() =>
      useSpeechInput({
        adapter: adapter({
          stop: vi.fn(async () => {
            throw new Error('Gemini stack trace: api key invalid')
          }),
        }),
      }),
    )

    await act(async () => {
      await result.current.start()
    })
    await act(async () => {
      await result.current.stop()
    })

    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe(AI_UNAVAILABLE_MESSAGE)
  })

  it('preserves browser microphone permission errors', async () => {
    const { result } = renderHook(() =>
      useSpeechInput({
        adapter: adapter({
          start: vi.fn(async () => {
            throw new Error('not-allowed')
          }),
        }),
      }),
    )

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('not-allowed')
  })
})
