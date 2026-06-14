// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUISounds } from '../useUISounds'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

// Minimal Web Audio API mock
const mockStop = vi.fn()
const mockStart = vi.fn()
const mockConnect = vi.fn()
const mockDisconnect = vi.fn()
const mockFrequency = { value: 440, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
const mockGain = { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }

const mockOscillator = {
  type: 'sine' as OscillatorType,
  frequency: mockFrequency,
  connect: mockConnect,
  start: mockStart,
  stop: mockStop,
  disconnect: mockDisconnect,
}

const mockGainNode = {
  gain: mockGain,
  connect: mockConnect,
  disconnect: mockDisconnect,
}

const mockCompressor = {
  connect: mockConnect,
  disconnect: mockDisconnect,
}

const mockAudioContext = {
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGainNode),
  createDynamicsCompressor: vi.fn(() => mockCompressor),
  destination: {},
  currentTime: 0,
  state: 'running',
}

const MockAudioContext = function () { return mockAudioContext }

beforeEach(() => {
  vi.stubGlobal('AudioContext', MockAudioContext)
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
  mockStart.mockClear()
  mockStop.mockClear()
  mockConnect.mockClear()
  mockAudioContext.createOscillator.mockClear()
  useUISoundsStore.setState({ soundEnabled: true })
})

describe('useUISounds', () => {
  it('returns playTap, playCorrect, playWrong functions', () => {
    const { result } = renderHook(() => useUISounds())
    expect(typeof result.current.playTap).toBe('function')
    expect(typeof result.current.playCorrect).toBe('function')
    expect(typeof result.current.playWrong).toBe('function')
  })

  it('playTap creates and starts an oscillator', () => {
    const { result } = renderHook(() => useUISounds())
    act(() => { result.current.playTap() })
    expect(mockAudioContext.createOscillator).toHaveBeenCalled()
    expect(mockStart).toHaveBeenCalled()
  })

  it('does not play when soundEnabled is false', () => {
    useUISoundsStore.setState({ soundEnabled: false })
    const { result } = renderHook(() => useUISounds())
    act(() => { result.current.playTap() })
    expect(mockStart).not.toHaveBeenCalled()
  })

  it('does not play when prefers-reduced-motion is active', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const { result } = renderHook(() => useUISounds())
    act(() => { result.current.playTap() })
    expect(mockStart).not.toHaveBeenCalled()
  })
})
