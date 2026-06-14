// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUISounds } from '../useUISounds'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

// Minimal Web Audio API mock
const createMockOscillator = () => ({
  type: 'sine' as OscillatorType,
  frequency: {
    value: 440,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  disconnect: vi.fn(),
  onended: null as (() => void) | null,
})

const createMockGainNode = () => ({
  gain: {
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
  disconnect: vi.fn(),
})

const mockCompressor = { connect: vi.fn(), disconnect: vi.fn() }

let createdOscillators: ReturnType<typeof createMockOscillator>[] = []
let createdGains: ReturnType<typeof createMockGainNode>[] = []

const mockAudioContext = {
  createOscillator: vi.fn(() => {
    const osc = createMockOscillator()
    createdOscillators.push(osc)
    return osc
  }),
  createGain: vi.fn(() => {
    const gain = createMockGainNode()
    createdGains.push(gain)
    return gain
  }),
  createDynamicsCompressor: vi.fn(() => mockCompressor),
  destination: {},
  currentTime: 0,
  state: 'running',
}

beforeEach(() => {
  vi.stubGlobal('AudioContext', function MockAudioContext() { return mockAudioContext })
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
  createdOscillators = []
  createdGains = []
  mockAudioContext.createOscillator.mockClear()
  mockAudioContext.createGain.mockClear()
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
    expect(createdOscillators).toHaveLength(1)
    expect(createdOscillators[0].start).toHaveBeenCalled()
  })

  it('does not play when soundEnabled is false', () => {
    useUISoundsStore.setState({ soundEnabled: false })
    const { result } = renderHook(() => useUISounds())
    act(() => { result.current.playTap() })
    expect(createdOscillators).toHaveLength(0)
  })

  it('does not play when prefers-reduced-motion is active', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const { result } = renderHook(() => useUISounds())
    act(() => { result.current.playTap() })
    expect(createdOscillators).toHaveLength(0)
  })

  it('playCorrect creates two oscillators for the two-note sequence', () => {
    const { result } = renderHook(() => useUISounds())
    act(() => { result.current.playCorrect() })
    expect(createdOscillators).toHaveLength(2)
    expect(createdOscillators[0].start).toHaveBeenCalled()
    expect(createdOscillators[1].start).toHaveBeenCalled()
  })
})
