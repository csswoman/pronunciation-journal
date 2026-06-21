import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAudioRecorder } from '../useVoiceRecorder'

describe('createAudioRecorder', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('falls back to mp4 when webm is unsupported', () => {
    const isTypeSupportedMock = vi.fn((mimeType: string) => mimeType === 'audio/mp4')
    const mediaRecorderMock = vi.fn(function (
      this: { mimeType?: string },
      stream: MediaStream,
      options?: MediaRecorderOptions
    ) {
      if (options?.mimeType === 'audio/webm;codecs=opus' || options?.mimeType === 'audio/webm') {
        throw new Error('unsupported')
      }

      this.mimeType = options?.mimeType ?? 'audio/mp4'
    })

    Object.assign(mediaRecorderMock, { isTypeSupported: isTypeSupportedMock })

    vi.stubGlobal('window', { MediaRecorder: mediaRecorderMock })
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(),
      },
    })
    vi.stubGlobal('MediaRecorder', mediaRecorderMock)

    const result = createAudioRecorder({} as MediaStream)

    expect(result.supported).toBe(true)
    if (result.supported) {
      expect(result.mimeType).toBe('audio/mp4')
    }
    expect(mediaRecorderMock).toHaveBeenCalledTimes(1)
    expect(isTypeSupportedMock).toHaveBeenCalledWith('audio/webm;codecs=opus')
    expect(isTypeSupportedMock).toHaveBeenCalledWith('audio/webm')
    expect(isTypeSupportedMock).toHaveBeenCalledWith('audio/mp4')
  })

  it('reports unsupported when no recorder variant can be created', () => {
    const isTypeSupportedMock = vi.fn(() => true)
    const mediaRecorderMock = vi.fn(function () {
      throw new Error('unsupported')
    })

    Object.assign(mediaRecorderMock, { isTypeSupported: isTypeSupportedMock })

    vi.stubGlobal('window', { MediaRecorder: mediaRecorderMock })
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(),
      },
    })
    vi.stubGlobal('MediaRecorder', mediaRecorderMock)

    expect(createAudioRecorder({} as MediaStream)).toEqual({ supported: false })
  })
})
