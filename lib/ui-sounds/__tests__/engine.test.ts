// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { arpeggio, RECIPES } from '../recipes'
import {
  playCue,
  setEngineEnabled,
  resetEngineStateForTests,
  getActiveVoiceCountForTests,
} from '../engine'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

describe('arpeggio helper', () => {
  it('generates correct ToneLayer sequence with offsets in seconds', () => {
    const layers = arpeggio(1000, [1, 1.25, 1.5], 0.05)
    expect(layers).toHaveLength(3)
    expect(layers[0]).toMatchObject({
      kind: 'tone',
      frequency: 1000,
      offset: 0,
      waveform: 'sine',
    })
    expect(layers[1]).toMatchObject({
      kind: 'tone',
      frequency: 1250,
      offset: 0.05,
      waveform: 'sine',
    })
    expect(layers[2]).toMatchObject({
      kind: 'tone',
      frequency: 1500,
      offset: 0.1,
      waveform: 'sine',
    })
  })
})

describe('RECIPES exact invariants (9 original recipes bit by bit)', () => {
  it('matches exactly the original parameters bit-by-bit', () => {
    expect(RECIPES.chime).toEqual({
      masterGain: 0.5,
      layers: [
        { kind: 'tone', waveform: 'sine', frequency: 1046.5, attack: 0.006, decay: 0.22, peak: 0.09 },
        { kind: 'tone', waveform: 'sine', frequency: 1568, offset: 0.09, attack: 0.006, decay: 0.26, peak: 0.08 },
      ],
      shimmer: { delay: 0.12, feedback: 0.25, wet: 0.18, lowpass: 4000 },
    })

    expect(RECIPES.sparkle).toEqual({
      masterGain: 0.5,
      layers: [
        { kind: 'tone', waveform: 'sine', frequency: 1760, offset: 0, attack: 0.003, decay: 0.09, peak: 0.045 },
        { kind: 'tone', waveform: 'sine', frequency: 2217, offset: 0.045, attack: 0.003, decay: 0.09, peak: 0.04 },
        { kind: 'tone', waveform: 'sine', frequency: 2637, offset: 0.09, attack: 0.003, decay: 0.1, peak: 0.038 },
        { kind: 'tone', waveform: 'sine', frequency: 3520, offset: 0.135, attack: 0.003, decay: 0.12, peak: 0.032 },
      ],
      shimmer: { delay: 0.07, feedback: 0.35, wet: 0.22, lowpass: 6000 },
    })

    expect(RECIPES.droplet).toEqual({
      masterGain: 0.55,
      layers: [
        { kind: 'tone', waveform: 'sine', frequency: 1200, glideTo: 550, glideTime: 0.14, attack: 0.004, decay: 0.2, peak: 0.075 },
      ],
      shimmer: { delay: 0.09, feedback: 0.2, wet: 0.15, lowpass: 3000 },
    })

    expect(RECIPES.bloom).toEqual({
      masterGain: 0.5,
      layers: [
        { kind: 'tone', waveform: 'sine', frequency: 528, attack: 0.06, decay: 0.32, peak: 0.06 },
        { kind: 'tone', waveform: 'sine', frequency: 528, detune: 12, attack: 0.06, decay: 0.34, peak: 0.05 },
      ],
      shimmer: { delay: 0.15, feedback: 0.2, wet: 0.12, lowpass: 2500 },
    })

    expect(RECIPES.whisper).toEqual({
      masterGain: 0.5,
      layers: [
        { kind: 'noise', filterType: 'lowpass', filterFrequency: 1200, filterQ: 0.7, attack: 0.04, decay: 0.16, peak: 0.05 },
      ],
    })

    expect(RECIPES.tick).toEqual({
      masterGain: 0.4,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 5400, filterQ: 1.8, attack: 0.001, decay: 0.018, peak: 0.14 },
        { kind: 'tone', waveform: 'sine', frequency: 2600, attack: 0.001, decay: 0.012, peak: 0.018 },
      ],
    })

    expect(RECIPES.press).toEqual({
      masterGain: 0.4,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 1700, filterQ: 1.4, attack: 0.001, decay: 0.02, peak: 0.13 },
      ],
    })

    expect(RECIPES.release).toEqual({
      masterGain: 0.4,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 4600, filterQ: 1.8, attack: 0.001, decay: 0.016, peak: 0.12 },
        { kind: 'tone', waveform: 'sine', frequency: 3200, offset: 0.006, attack: 0.001, decay: 0.05, peak: 0.02 },
      ],
    })

    expect(RECIPES.toggle).toEqual({
      masterGain: 0.4,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 2200, filterQ: 1.6, attack: 0.001, decay: 0.016, peak: 0.12 },
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 3800, filterQ: 1.6, offset: 0.024, attack: 0.001, decay: 0.02, peak: 0.1 },
      ],
    })
  })

  it('keeps navigation masterGain substantially lower (0.08) than exercise cues (0.40–0.55)', () => {
    expect(RECIPES['nav-switch'].masterGain).toBe(0.08)
    expect(RECIPES['nav-open'].masterGain).toBe(0.08)
    expect(RECIPES['nav-close'].masterGain).toBe(0.08)
  })
})

describe('playCue engine policies with fake timers', () => {
  let mockContext: {
    state: string
    currentTime: number
    sampleRate: number
    destination: object
    createGain: ReturnType<typeof vi.fn>
    createOscillator: ReturnType<typeof vi.fn>
    createBuffer: ReturnType<typeof vi.fn>
    createBufferSource: ReturnType<typeof vi.fn>
    createBiquadFilter: ReturnType<typeof vi.fn>
    createDelay: ReturnType<typeof vi.fn>
    resume: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.useFakeTimers()
    resetEngineStateForTests()
    setEngineEnabled(true)
    useUISoundsStore.setState({ soundEnabled: true, volume: 0.85 })

    const createMockGain = () => ({
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn().mockReturnThis(),
      disconnect: vi.fn(),
    })

    const createMockOscillator = () => ({
      type: 'sine',
      frequency: {
        value: 440,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      detune: { value: 0 },
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
    })

    const createMockFilter = () => ({
      type: 'bandpass',
      frequency: { value: 1000 },
      Q: { value: 1 },
      connect: vi.fn().mockReturnThis(),
    })

    const createMockBufferSource = () => ({
      buffer: null,
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
    })

    const createMockDelay = () => ({
      delayTime: { value: 0 },
      connect: vi.fn().mockReturnThis(),
    })

    mockContext = {
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      createGain: vi.fn(createMockGain),
      createOscillator: vi.fn(createMockOscillator),
      createBuffer: vi.fn(() => ({
        getChannelData: vi.fn(() => new Float32Array(100)),
      })),
      createBufferSource: vi.fn(createMockBufferSource),
      createBiquadFilter: vi.fn(createMockFilter),
      createDelay: vi.fn(createMockDelay),
      resume: vi.fn().mockResolvedValue(undefined),
    }

    const MockAudioContextClass = function (this: unknown) {
      return mockContext
    } as unknown as typeof AudioContext

    window.AudioContext = MockAudioContextClass
    ;(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext = MockAudioContextClass

    Object.defineProperty(window.navigator, 'userActivation', {
      value: { hasBeenActive: true },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('throttles rapid duplicate calls at 50ms and allows after 110ms with fake timers', () => {
    playCue('create')
    expect(mockContext.createGain).toHaveBeenCalled()
    const callsAfterFirst = mockContext.createGain.mock.calls.length

    // Advance 50ms (within 100ms throttle window)
    vi.advanceTimersByTime(50)
    playCue('create')
    expect(mockContext.createGain.mock.calls.length).toBe(callsAfterFirst)

    // Advance additional 60ms (total 110ms > 100ms)
    vi.advanceTimersByTime(60)
    playCue('create')
    expect(mockContext.createGain.mock.calls.length).toBeGreaterThan(callsAfterFirst)
  })

  it('registers multi-layer cues (sparkle: 4 layers, level-up: 4 layers) as exactly 1 voice each', () => {
    expect(getActiveVoiceCountForTests()).toBe(0)

    // sparkle has 4 ToneLayers
    playCue('sparkle')
    expect(getActiveVoiceCountForTests()).toBe(1)

    // level-up has 4 ToneLayers
    vi.advanceTimersByTime(110)
    playCue('level-up')
    expect(getActiveVoiceCountForTests()).toBe(2)

    // milestone has 3 ToneLayers
    vi.advanceTimersByTime(110)
    playCue('milestone')
    expect(getActiveVoiceCountForTests()).toBe(3)

    // 4th cue triggers oldest voice stealing, keeping count at MAX (3)
    vi.advanceTimersByTime(110)
    playCue('delete')
    expect(getActiveVoiceCountForTests()).toBe(3)
  })

  it('does not play when disabled', () => {
    setEngineEnabled(false)
    playCue('nav-switch')
    expect(mockContext.createGain).not.toHaveBeenCalled()
    expect(getActiveVoiceCountForTests()).toBe(0)
  })
})
