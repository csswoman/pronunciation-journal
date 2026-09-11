// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVoiceLevel } from '../useVoiceLevel'

describe('useVoiceLevel', () => {
  let mockAudioContext: {
    createAnalyser: ReturnType<typeof vi.fn>
    createMediaStreamSource: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
    state: string
  }
  let mockAnalyser: {
    fftSize: number
    smoothingTimeConstant: number
    frequencyBinCount: number
    getByteTimeDomainData: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
  }
  let mockSource: {
    connect: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
  }
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    vi.useFakeTimers()

    mockAnalyser = {
      fftSize: 2048,
      smoothingTimeConstant: 0.6,
      frequencyBinCount: 1024,
      getByteTimeDomainData: vi.fn((array: Uint8Array) => {
        array.fill(128)
      }),
      disconnect: vi.fn(),
    }

    mockSource = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    }

    mockAudioContext = {
      createAnalyser: vi.fn(() => mockAnalyser),
      createMediaStreamSource: vi.fn(() => mockSource),
      close: vi.fn().mockResolvedValue(undefined),
      state: 'running',
    }

    const AudioContextClass = vi.fn(function () {
      return mockAudioContext
    })
    vi.stubGlobal('AudioContext', AudioContextClass)
    vi.stubGlobal('webkitAudioContext', AudioContextClass)


    originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    window.matchMedia = originalMatchMedia
  })

  it('devuelve buffer de ceros/silencio y peak 0 si no hay stream', () => {
    const { result } = renderHook(() => useVoiceLevel(null))

    expect(result.current.peak).toBe(0)
    const samples = result.current.getSamples()
    expect(samples.length).toBeGreaterThan(0)
    expect(samples[0]).toBe(128) // 128 representa el punto cero en tiempo de dominio byte
  })

  it('crea AudioContext y conecta analyser al recibir un stream', () => {
    const fakeStream = {} as MediaStream
    const { unmount } = renderHook(() => useVoiceLevel(fakeStream))

    expect(mockAudioContext.createAnalyser).toHaveBeenCalled()
    expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(fakeStream)
    expect(mockSource.connect).toHaveBeenCalledWith(mockAnalyser)

    unmount()
    expect(mockAnalyser.disconnect).toHaveBeenCalled()
    expect(mockAudioContext.close).toHaveBeenCalled()
  })

  it('llama a close() y limpia nodos cuando el stream pasa a null', () => {
    const fakeStream = {} as MediaStream
    const { rerender } = renderHook(({ s }) => useVoiceLevel(s), {
      initialProps: { s: fakeStream as MediaStream | null },
    })

    expect(mockAudioContext.createAnalyser).toHaveBeenCalled()

    rerender({ s: null })
    expect(mockAnalyser.disconnect).toHaveBeenCalled()
    expect(mockAudioContext.close).toHaveBeenCalled()
  })

  it('no arranca rAF si prefers-reduced-motion está activo y actualiza peak vía interval', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
    mockAnalyser.getByteTimeDomainData = vi.fn((array: Uint8Array) => {
      // Simulamos audio con desviación de 64 (amplitud = 64/128 = 0.5)
      array.fill(128 + 64)
    })

    const fakeStream = {} as MediaStream
    const { result } = renderHook(() => useVoiceLevel(fakeStream))

    expect(rafSpy).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current.peak).toBeCloseTo(0.5, 1)
  })
})
