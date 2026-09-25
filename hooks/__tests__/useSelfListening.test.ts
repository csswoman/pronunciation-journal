// @vitest-environment jsdom
// hooks/__tests__/useSelfListening.test.ts
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSelfListening } from '../useSelfListening'
import type { RecorderHandlers } from '@/lib/speech/self-listening-recorder'

const started: { handlers: RecorderHandlers; recorder: { state: string; stop: () => void } }[] = []

vi.mock('@/lib/speech/self-listening-recorder', () => ({
  startSelfListeningRecorder: (_stream: MediaStream, handlers: RecorderHandlers) => {
    const recorder = { state: 'recording', stop: () => { recorder.state = 'inactive' } }
    started.push({ handlers, recorder })
    return recorder as unknown as MediaRecorder
  },
}))

const stream = {} as MediaStream

beforeEach(() => {
  started.length = 0
  vi.stubGlobal('URL', {
    createObjectURL: () => 'blob:mock',
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useSelfListening', () => {
  it('empieza sin grabación', () => {
    const { result } = renderHook(() => useSelfListening())
    expect(result.current.audioUrl).toBeNull()
  })

  it('expone la URL cuando el grabador entrega audio audible', () => {
    const { result } = renderHook(() => useSelfListening())
    act(() => result.current.begin(stream))
    act(() => {
      result.current.end()
      started[0].handlers.onAudioUrl('blob:take-1')
      started[0].handlers.onStopped()
    })
    expect(result.current.audioUrl).toBe('blob:take-1')
  })

  it('no abre un segundo grabador si ya está grabando', () => {
    const { result } = renderHook(() => useSelfListening())
    act(() => result.current.begin(stream))
    act(() => result.current.begin(stream))
    expect(started).toHaveLength(1)
  })

  it('descarta el audio que llega después de clear()', () => {
    const { result } = renderHook(() => useSelfListening())
    act(() => result.current.begin(stream))
    act(() => result.current.clear())
    act(() => {
      // `stop()` entrega el blob de forma asíncrona, ya descartado.
      started[0].handlers.onAudioUrl('blob:late')
      started[0].handlers.onStopped()
    })
    expect(result.current.audioUrl).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:late')
  })

  it('libera la URL de la toma anterior al grabar otra', () => {
    const { result } = renderHook(() => useSelfListening())
    act(() => result.current.begin(stream))
    act(() => {
      result.current.end()
      started[0].handlers.onAudioUrl('blob:take-1')
      started[0].handlers.onStopped()
    })
    act(() => result.current.begin(stream))
    act(() => {
      result.current.end()
      started[1].handlers.onAudioUrl('blob:take-2')
      started[1].handlers.onStopped()
    })
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:take-1')
    expect(result.current.audioUrl).toBe('blob:take-2')
  })

  it('libera la URL al desmontar, sin dejar el blob en memoria', () => {
    const { result, unmount } = renderHook(() => useSelfListening())
    act(() => result.current.begin(stream))
    act(() => {
      result.current.end()
      started[0].handlers.onAudioUrl('blob:take-1')
      started[0].handlers.onStopped()
    })
    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:take-1')
  })
})
