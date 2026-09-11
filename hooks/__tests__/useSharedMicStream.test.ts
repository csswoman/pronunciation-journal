// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSharedMicStream } from '../useSharedMicStream'

interface FakeTrack {
  readyState: MediaStreamTrackState
  stop: ReturnType<typeof vi.fn>
}

function makeStream(readyState: MediaStreamTrackState = 'live') {
  const track: FakeTrack = {
    readyState,
    stop: vi.fn(function (this: FakeTrack) {
      this.readyState = 'ended'
    }),
  }
  return {
    stream: { getTracks: () => [track] } as unknown as MediaStream,
    track,
  }
}

describe('useSharedMicStream', () => {
  let getUserMedia: ReturnType<typeof vi.fn>
  let originalMediaDevices: MediaDevices

  beforeEach(() => {
    getUserMedia = vi.fn()
    originalMediaDevices = navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    })
    vi.restoreAllMocks()
  })

  it('reuses a live stream across calls', async () => {
    const { stream } = makeStream('live')
    getUserMedia.mockResolvedValue(stream)

    const { result } = renderHook(() => useSharedMicStream())

    let first: MediaStream | undefined
    let second: MediaStream | undefined
    await act(async () => {
      first = await result.current.getStream()
      second = await result.current.getStream()
    })

    expect(first).toBe(stream)
    expect(second).toBe(stream)
    expect(getUserMedia).toHaveBeenCalledTimes(1)
  })

  it('re-acquires when the cached stream has ended tracks', async () => {
    const first = makeStream('live')
    const second = makeStream('live')
    getUserMedia.mockResolvedValueOnce(first.stream).mockResolvedValueOnce(second.stream)

    const { result } = renderHook(() => useSharedMicStream())

    await act(async () => {
      await result.current.getStream()
    })

    // Simulate the OS/browser revoking the device after acquisition.
    first.track.readyState = 'ended'

    let reacquired: MediaStream | undefined
    await act(async () => {
      reacquired = await result.current.getStream()
    })

    expect(reacquired).toBe(second.stream)
    expect(getUserMedia).toHaveBeenCalledTimes(2)
  })

  it('re-acquires after release', async () => {
    const first = makeStream('live')
    const second = makeStream('live')
    getUserMedia.mockResolvedValueOnce(first.stream).mockResolvedValueOnce(second.stream)

    const { result } = renderHook(() => useSharedMicStream())

    await act(async () => {
      await result.current.getStream()
    })

    act(() => {
      result.current.release()
    })

    expect(first.track.stop).toHaveBeenCalled()

    let reacquired: MediaStream | undefined
    await act(async () => {
      reacquired = await result.current.getStream()
    })

    expect(reacquired).toBe(second.stream)
    expect(getUserMedia).toHaveBeenCalledTimes(2)
  })

  it('does not cache a stream when acquisition fails', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'))
    const { stream } = makeStream('live')
    getUserMedia.mockResolvedValueOnce(stream)

    const { result } = renderHook(() => useSharedMicStream())

    await act(async () => {
      await expect(result.current.getStream()).rejects.toThrow()
    })

    let retried: MediaStream | undefined
    await act(async () => {
      retried = await result.current.getStream()
    })

    expect(retried).toBe(stream)
  })

  it('does not issue concurrent getUserMedia prompts', async () => {
    const { stream } = makeStream('live')
    getUserMedia.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(stream), 10))
    )

    const { result } = renderHook(() => useSharedMicStream())

    await act(async () => {
      await Promise.all([result.current.getStream(), result.current.getStream()])
    })

    expect(getUserMedia).toHaveBeenCalledTimes(1)
  })

  it('releases the stream on unmount', async () => {
    const { stream, track } = makeStream('live')
    getUserMedia.mockResolvedValue(stream)

    const { result, unmount } = renderHook(() => useSharedMicStream())

    await act(async () => {
      await result.current.getStream()
    })

    unmount()

    expect(track.stop).toHaveBeenCalled()
  })
})
