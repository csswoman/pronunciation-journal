// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLearnerSpeechCapture } from '../useLearnerSpeechCapture'

const speechInputMock: Record<string, unknown> = {
  state: 'idle',
  result: null,
  error: null,
  isSupported: true,
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  reset: vi.fn(),
}


vi.mock('@/hooks/useSpeechInput', () => ({
  useSpeechInput: vi.fn((opts) => {
    // Permite disparar onResult si se requiere
    speechInputMock._lastOpts = opts
    return speechInputMock
  }),
}))

describe('useLearnerSpeechCapture', () => {
  let mockStream: MediaStream
  let mockRecorder: {
    state: string
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
    ondataavailable: ((e: { data: Blob }) => void) | null
    onstop: (() => void) | null
  }
  let originalMediaRecorder: typeof window.MediaRecorder
  let originalCreateObjectURL: typeof URL.createObjectURL
  let originalRevokeObjectURL: typeof URL.revokeObjectURL

  beforeEach(() => {
    speechInputMock.state = 'idle'
    speechInputMock.result = null
    speechInputMock.error = null
    speechInputMock.isSupported = true
    ;(speechInputMock.start as ReturnType<typeof vi.fn>).mockReset()
    ;(speechInputMock.stop as ReturnType<typeof vi.fn>).mockReset()
    ;(speechInputMock.reset as ReturnType<typeof vi.fn>).mockReset()

    mockStream = {
      getTracks: vi.fn(() => []),
    } as unknown as MediaStream

    mockRecorder = {
      state: 'inactive',
      start: vi.fn(function () {
        mockRecorder.state = 'recording'
      }),
      stop: vi.fn(function () {
        mockRecorder.state = 'inactive'
        if (mockRecorder.ondataavailable) {
          mockRecorder.ondataavailable({ data: new Blob(['fake audio'], { type: 'audio/webm' }) })
        }
        if (mockRecorder.onstop) {
          mockRecorder.onstop()
        }
      }),
      ondataavailable: null,
      onstop: null,
    }

    const MockMediaRecorder = vi.fn(function () {
      return mockRecorder
    })
    originalMediaRecorder = window.MediaRecorder
    vi.stubGlobal('MediaRecorder', MockMediaRecorder)

    originalCreateObjectURL = URL.createObjectURL
    originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-audio')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    window.MediaRecorder = originalMediaRecorder
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    vi.unstubAllGlobals()
  })

  it('inicia en estado idle con canScore en true', () => {
    const getStream = vi.fn().mockResolvedValue(mockStream)
    const { result } = renderHook(() =>
      useLearnerSpeechCapture({ targetText: 'Hello', getStream }),
    )

    expect(result.current.status).toBe('idle')
    expect(result.current.canScore).toBe(true)
    expect(result.current.transcript).toBeNull()
    expect(result.current.userAudioUrl).toBeNull()
    expect(result.current.micStream).toBeNull()
  })

  it('start() solicita el stream, arranca el MediaRecorder y llama a speechInput.start()', async () => {
    const getStream = vi.fn().mockResolvedValue(mockStream)
    const { result } = renderHook(() =>
      useLearnerSpeechCapture({ targetText: 'Hello', getStream }),
    )

    await act(async () => {
      await result.current.start()
    })

    expect(getStream).toHaveBeenCalled()
    expect(mockRecorder.start).toHaveBeenCalled()
    expect(speechInputMock.start).toHaveBeenCalled()
    expect(result.current.micStream).toBe(mockStream)
  })

  it('stop() detiene el MediaRecorder y genera el userAudioUrl', async () => {
    const getStream = vi.fn().mockResolvedValue(mockStream)
    const { result } = renderHook(() =>
      useLearnerSpeechCapture({ targetText: 'Hello', getStream }),
    )

    await act(async () => {
      await result.current.start()
    })

    await act(async () => {
      result.current.stop()
    })

    expect(mockRecorder.stop).toHaveBeenCalled()
    expect(speechInputMock.stop).toHaveBeenCalled()
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(result.current.userAudioUrl).toBe('blob:http://localhost/test-audio')
    expect(result.current.micStream).toBeNull()
  })

  it('mapea errorCode correctamente y marca canScore=false en error de network', () => {
    speechInputMock.state = 'error'
    speechInputMock.error = 'network'

    const getStream = vi.fn().mockResolvedValue(mockStream)
    const { result } = renderHook(() =>
      useLearnerSpeechCapture({ targetText: 'Hello', getStream }),
    )

    expect(result.current.status).toBe('error')
    expect(result.current.errorCode).toBe('network')
    expect(result.current.canScore).toBe(false)
  })

  it('reset() revoca el blob URL y limpia el estado', async () => {
    const getStream = vi.fn().mockResolvedValue(mockStream)
    const { result } = renderHook(() =>
      useLearnerSpeechCapture({ targetText: 'Hello', getStream }),
    )

    await act(async () => {
      await result.current.start()
      result.current.stop()
    })

    expect(result.current.userAudioUrl).toBe('blob:http://localhost/test-audio')

    act(() => {
      result.current.reset()
    })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-audio')
    expect(result.current.userAudioUrl).toBeNull()
    expect(speechInputMock.reset).toHaveBeenCalled()
  })

  // --- Regresiones: fiabilidad de la captura (grabando / score falso / replay) ---

  it('captureState refleja el micro real, no el reconocedor: sigue inactive si getStream falla', async () => {
    const getStream = vi.fn().mockRejectedValue(new Error('not-allowed'))
    const { result } = renderHook(() =>
      useLearnerSpeechCapture({ targetText: 'Hello', getStream }),
    )

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.captureState).toBe('error')
    expect(result.current.isCapturing).toBe(false)
    expect(result.current.hasRecording).toBe(false)
  })

  it('no traga el fallo del micro: expone errorCode not-allowed', async () => {
    const getStream = vi.fn().mockRejectedValue(
      Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
    )
    const { result } = renderHook(() =>
      useLearnerSpeechCapture({ targetText: 'Hello', getStream }),
    )

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.errorCode).toBe('not-allowed')
    expect(result.current.canScore).toBe(false)
  })

  it('isCapturing es true solo cuando el MediaRecorder graba de verdad', async () => {
    const getStream = vi.fn().mockResolvedValue(mockStream)
    const { result } = renderHook(() =>
      useLearnerSpeechCapture({ targetText: 'Hello', getStream }),
    )

    expect(result.current.isCapturing).toBe(false)

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isCapturing).toBe(true)
    expect(result.current.captureState).toBe('recording')
  })

  it('hasRecording queda false si el recorder no produjo chunks', async () => {
    mockRecorder.stop = vi.fn(function () {
      mockRecorder.state = 'inactive'
      // Sin ondataavailable: no hubo audio real
      if (mockRecorder.onstop) mockRecorder.onstop()
    })

    const getStream = vi.fn().mockResolvedValue(mockStream)
    const { result } = renderHook(() =>
      useLearnerSpeechCapture({ targetText: 'Hello', getStream }),
    )

    await act(async () => {
      await result.current.start()
    })
    await act(async () => {
      result.current.stop()
    })

    expect(result.current.hasRecording).toBe(false)
    expect(result.current.userAudioUrl).toBeNull()
  })

  it('hasRecording es true y conserva el blob tras stop() con audio real', async () => {
    const getStream = vi.fn().mockResolvedValue(mockStream)
    const { result } = renderHook(() =>
      useLearnerSpeechCapture({ targetText: 'Hello', getStream }),
    )

    await act(async () => {
      await result.current.start()
    })
    await act(async () => {
      result.current.stop()
    })

    expect(result.current.hasRecording).toBe(true)
    expect(result.current.userAudioUrl).toBe('blob:http://localhost/test-audio')
  })
})
