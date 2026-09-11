// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSpeechRecognition } from '../useSpeechRecognition'

const transcribeMock = vi.fn()

vi.mock('@/lib/speech/adapters/geminiAdapter', () => ({
  GeminiAdapter: class {
    isSupported() {
      return true
    }
    async start() {}
    async stop() {
      return transcribeMock()
    }
    abort() {}
  },
}))

interface FakeRecognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: unknown) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  abort: ReturnType<typeof vi.fn>
}

let lastRecognition: FakeRecognition | null = null
let trackStop: ReturnType<typeof vi.fn>
let getUserMedia: ReturnType<typeof vi.fn>
let recorderInstances: FakeRecorder[]

interface FakeRecorder {
  state: string
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  ondataavailable: ((e: { data: Blob }) => void) | null
  onstop: (() => void) | null
  mimeType: string
}

function installRecognition() {
  class FakeSR implements FakeRecognition {
    lang = ''
    interimResults = false
    maxAlternatives = 0
    onstart: (() => void) | null = null
    onresult: ((event: unknown) => void) | null = null
    onerror: ((event: { error?: string }) => void) | null = null
    onend: (() => void) | null = null
    start = vi.fn(() => {
      this.onstart?.()
    })
    stop = vi.fn()
    abort = vi.fn()
  }

  ;(window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = function () {
    const instance = new FakeSR()
    lastRecognition = instance
    return instance
  }
}

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', { configurable: true, value: ua })
}


// jsdom no implementa Web Audio: simulamos un analizador que reporta una
// desviación fija respecto al silencio (128) para controlar el pico medido.
const SPEECH_SAMPLE = 200
const SILENT_SAMPLE = 129

function installAudioAnalyser(sampleValue: number) {
  const analyser = {
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteTimeDomainData: (arr: Uint8Array) => arr.fill(sampleValue),
    disconnect: vi.fn(),
  }
  const ctx = {
    createAnalyser: () => analyser,
    createMediaStreamSource: () => ({ connect: vi.fn(), disconnect: vi.fn() }),
    close: vi.fn(),
  }
  ;(window as unknown as { AudioContext: unknown }).AudioContext = function () {
    return ctx
  }
  // El hook mide el pico dentro de requestAnimationFrame; ejecutarlo una vez
  // de forma síncrona basta para registrar una muestra.
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    cb(0)
    return 1
  }) as typeof window.requestAnimationFrame
  window.cancelAnimationFrame = vi.fn() as typeof window.cancelAnimationFrame
}

describe('useSpeechRecognition', () => {
  let originalUserAgent: string

  beforeEach(() => {
    originalUserAgent = navigator.userAgent
    // isWebSpeechReliable() sólo confía en Chrome real; jsdom reporta otra UA.
    setUserAgent(CHROME_UA)
    lastRecognition = null
    recorderInstances = []
    transcribeMock.mockReset()
    transcribeMock.mockResolvedValue({ transcript: 'hello world', source: 'gemini' })

    trackStop = vi.fn()
    getUserMedia = vi.fn(async () => ({
      getTracks: () => [{ stop: trackStop, readyState: 'live' }],
    }))
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })

    class FakeRecorderImpl implements FakeRecorder {
      state = 'inactive'
      mimeType = 'audio/webm'
      ondataavailable: ((e: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      start = vi.fn(() => {
        this.state = 'recording'
      })
      stop = vi.fn(() => {
        this.state = 'inactive'
        this.onstop?.()
      })
      constructor() {
        recorderInstances.push(this)
      }
      static isTypeSupported() {
        return true
      }
    }
    ;(window as unknown as { MediaRecorder: unknown }).MediaRecorder = FakeRecorderImpl

    installAudioAnalyser(SPEECH_SAMPLE)
    installRecognition()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    setUserAgent(originalUserAgent)
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    vi.restoreAllMocks()
  })

  it('reports a native transcript when Web Speech succeeds', async () => {
    const { result } = renderHook(() => useSpeechRecognition())

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      lastRecognition!.onresult?.({
        results: [[{ transcript: ' hi there ', confidence: 0.9 }]],
      })
    })

    expect(result.current.status).toBe('done')
    expect(result.current.result?.transcript).toBe('hi there')
  })

  it('falls back to Gemini when Web Speech fails with a network error', async () => {
    const { result } = renderHook(() => useSpeechRecognition())

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      lastRecognition!.onerror?.({ error: 'network' })
    })

    await waitFor(() => expect(result.current.status).toBe('done'))
    expect(result.current.result?.transcript).toBe('hello world')
    expect(result.current.errorCode).toBeNull()
  })

  it('surfaces a network error when the Gemini fallback also fails', async () => {
    transcribeMock.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useSpeechRecognition())

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      lastRecognition!.onerror?.({ error: 'network' })
    })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorCode).toBe('network')
  })

  it('does not fall back for a permission denial', async () => {
    const { result } = renderHook(() => useSpeechRecognition())

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      lastRecognition!.onerror?.({ error: 'not-allowed' })
    })

    expect(result.current.status).toBe('error')
    expect(result.current.errorCode).toBe('not-allowed')
    expect(transcribeMock).not.toHaveBeenCalled()
  })

  it('routes browsers without Google speech keys straight to Gemini', async () => {
    // Edge: UA de Chrome pero sin la clave del servidor de voz de Google.
    setUserAgent(`${CHROME_UA} Edg/140.0.0.0`)

    const { result } = renderHook(() => useSpeechRecognition())

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.status).toBe('listening')
    expect(lastRecognition).toBeNull()

    await act(async () => {
      result.current.stop()
    })

    await waitFor(() => expect(result.current.status).toBe('done'))
    expect(result.current.result?.transcript).toBe('hello world')
  })

  it('rejects a transcript when the microphone never captured audible speech', async () => {
    // Micro silenciado: el reconocedor puede devolver texto igualmente, pero
    // puntuarlo sería calificar una alucinación.
    installAudioAnalyser(SILENT_SAMPLE)

    const { result } = renderHook(() => useSpeechRecognition())

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      lastRecognition!.onresult?.({
        results: [[{ transcript: 'hi there', confidence: 0.9 }]],
      })
    })

    expect(result.current.status).toBe('error')
    expect(result.current.errorCode).toBe('no-speech')
    expect(result.current.result).toBeNull()
  })

  it('does not spend a Gemini request on a silent recording', async () => {
    installAudioAnalyser(SILENT_SAMPLE)

    const { result } = renderHook(() => useSpeechRecognition())

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      lastRecognition!.onerror?.({ error: 'network' })
    })

    expect(result.current.errorCode).toBe('no-speech')
    expect(transcribeMock).not.toHaveBeenCalled()
  })

  it('releases microphone tracks when the recorder cannot be created', async () => {
    ;(window as unknown as { MediaRecorder: unknown }).MediaRecorder = class {
      static isTypeSupported() {
        return true
      }
      constructor() {
        throw new Error('recorder unavailable')
      }
    }

    const { result } = renderHook(() => useSpeechRecognition())

    await act(async () => {
      await result.current.start()
    })

    expect(trackStop).toHaveBeenCalled()
  })

  it('releases microphone tracks on unmount', async () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition())

    await act(async () => {
      await result.current.start()
    })

    unmount()

    expect(trackStop).toHaveBeenCalled()
  })

  it('reports a short recording instead of discarding it silently', async () => {
    const { result } = renderHook(() => useSpeechRecognition())

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      recorderInstances[0]!.ondataavailable?.({ data: new Blob(['x']) })
      lastRecognition!.onresult?.({
        results: [[{ transcript: 'hi', confidence: 0.9 }]],
      })
    })

    expect(result.current.status).toBe('done')
  })
})
