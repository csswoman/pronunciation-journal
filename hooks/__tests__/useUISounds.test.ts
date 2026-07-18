// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUISounds } from '../useUISounds'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

const play = vi.fn()

vi.mock('cuelume', () => ({
  play: (...args: unknown[]) => play(...args),
  setEnabled: vi.fn(),
  bind: vi.fn(),
  sounds: [
    'chime',
    'sparkle',
    'droplet',
    'bloom',
    'whisper',
    'tick',
    'press',
    'release',
    'toggle',
  ],
}))

beforeEach(() => {
  play.mockClear()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
  useUISoundsStore.setState({ soundEnabled: true })
})

describe('useUISounds', () => {
  it('returns playTap, playCorrect, playWrong functions', () => {
    const { result } = renderHook(() => useUISounds())
    expect(typeof result.current.playTap).toBe('function')
    expect(typeof result.current.playCorrect).toBe('function')
    expect(typeof result.current.playWrong).toBe('function')
  })

  it('playTap plays tick', () => {
    const { result } = renderHook(() => useUISounds())
    act(() => {
      result.current.playTap()
    })
    expect(play).toHaveBeenCalledWith('tick')
  })

  it('playCorrect plays sparkle', () => {
    const { result } = renderHook(() => useUISounds())
    act(() => {
      result.current.playCorrect()
    })
    expect(play).toHaveBeenCalledWith('sparkle')
  })

  it('playWrong plays droplet', () => {
    const { result } = renderHook(() => useUISounds())
    act(() => {
      result.current.playWrong()
    })
    expect(play).toHaveBeenCalledWith('droplet')
  })

  it('does not play when soundEnabled is false', () => {
    useUISoundsStore.setState({ soundEnabled: false })
    const { result } = renderHook(() => useUISounds())
    act(() => {
      result.current.playTap()
    })
    expect(play).not.toHaveBeenCalled()
  })

  it('does not play when prefers-reduced-motion is active', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const { result } = renderHook(() => useUISounds())
    act(() => {
      result.current.playTap()
    })
    expect(play).not.toHaveBeenCalled()
  })
})
