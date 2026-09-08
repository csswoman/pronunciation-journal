// hooks/__tests__/useDualPlayback.test.ts
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const speak = vi.fn((_t: string, onEnd?: () => void) => { onEnd?.() })
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: (...a: unknown[]) => speak(...(a as [string, () => void])) }))

import { useDualPlayback } from '../useDualPlayback'

afterEach(() => { speak.mockClear() })

describe('useDualPlayback', () => {
  it('playNative calls speak with the target word', () => {
    const { result } = renderHook(() => useDualPlayback('coffee', null))
    act(() => result.current.playNative())
    expect(speak).toHaveBeenCalledWith('coffee', expect.any(Function))
  })

  it('playNative is a no-op without a target word', () => {
    const { result } = renderHook(() => useDualPlayback(undefined, null))
    act(() => result.current.playNative())
    expect(speak).not.toHaveBeenCalled()
  })

  it('exposes isPlayingUser false and does not throw without a user url', () => {
    const { result } = renderHook(() => useDualPlayback('coffee', null))
    expect(result.current.isPlayingUser).toBe(false)
    act(() => result.current.playUser())
    expect(result.current.isPlayingUser).toBe(false)
  })
})
