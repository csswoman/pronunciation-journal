// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GeminiAdapter } from '@/lib/speech/adapters/geminiAdapter'

const signalMocks = vi.hoisted(() => ({
  silent: false,
  cleanup: vi.fn(),
}))

vi.mock('@/lib/speech/signal-quality', () => ({
  attachPeakAnalyser: vi.fn(() => signalMocks.cleanup),
  isSilentCapture: vi.fn(() => signalMocks.silent),
  trackPeak: () => ({ observe: vi.fn(), peak: () => 0, reset: vi.fn() }),
}))

class FakeMediaRecorder {
  static isTypeSupported = vi.fn(() => true)
  state = 'inactive'
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null

  constructor() {}

  start() {
    this.state = 'recording'
  }

  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) })
    this.onstop?.()
  }
}

describe('GeminiAdapter', () => {
  beforeEach(() => {
    signalMocks.silent = false
    signalMocks.cleanup.mockClear()
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder)
    vi.stubGlobal('fetch', vi.fn())
  })

  it('rejects a silent capture without sending it for transcription', async () => {
    signalMocks.silent = true
    const adapter = new GeminiAdapter(async () => ({}) as MediaStream)

    await adapter.start()

    await expect(adapter.stop()).rejects.toThrow('no-speech')
    expect(fetch).not.toHaveBeenCalled()
    expect(signalMocks.cleanup).toHaveBeenCalledOnce()
  })

  it('treats an empty provider transcript as no speech', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ transcript: '' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const adapter = new GeminiAdapter(async () => ({}) as MediaStream)

    await adapter.start()

    await expect(adapter.stop()).rejects.toThrow('no-speech')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('preserves the public timeout message returned by the server', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Transcription failed' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const adapter = new GeminiAdapter(async () => ({}) as MediaStream)

    await adapter.start()

    await expect(adapter.stop()).rejects.toThrow('La transcripción tardó demasiado')
  })
})
