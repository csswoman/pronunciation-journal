// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUISounds } from '../useUISounds'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

const playCue = vi.fn()

vi.mock('cuelume', () => ({
  setEnabled: vi.fn(),
  bind: vi.fn(),
}))

vi.mock('@/lib/ui-sounds/engine', () => ({
  playCue: (...args: unknown[]) => playCue(...args),
  setEngineEnabled: vi.fn(),
}))

beforeEach(() => {
  playCue.mockClear()
  const memory = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, String(value))
    },
    removeItem: (key: string) => {
      memory.delete(key)
    },
    clear: () => {
      memory.clear()
    },
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() {
      return memory.size
    },
  })
  useUISoundsStore.setState({ soundPreference: 'exercise', soundEnabled: true })
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
    expect(playCue).toHaveBeenCalledWith('tick')
  })

  it('playCorrect plays sparkle', () => {
    const { result } = renderHook(() => useUISounds())
    act(() => {
      result.current.playCorrect()
    })
    expect(playCue).toHaveBeenCalledWith('sparkle')
  })

  it('playWrong plays droplet', () => {
    const { result } = renderHook(() => useUISounds())
    act(() => {
      result.current.playWrong()
    })
    expect(playCue).toHaveBeenCalledWith('droplet')
  })

  it('does not play when soundPreference is off', () => {
    useUISoundsStore.setState({ soundPreference: 'off', soundEnabled: false })
    const { result } = renderHook(() => useUISounds())
    act(() => {
      result.current.playTap()
    })
    expect(playCue).not.toHaveBeenCalled()
  })

  it('plays sounds independently of prefers-reduced-motion setting', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const { result } = renderHook(() => useUISounds())
    act(() => {
      result.current.playTap()
    })
    expect(playCue).toHaveBeenCalledWith('tick')
  })
})
