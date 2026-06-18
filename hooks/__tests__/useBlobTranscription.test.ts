// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useBlobTranscription } from '../useBlobTranscription'
import * as scoring from '@/lib/pronunciation/scoring'
import type { ScoringResult } from '@/lib/types'

const fakeScore: ScoringResult = {
  accuracy: 80,
  isCorrect: true,
  transcript: 'staff',
  wordResults: [{ expected: 'staff', got: 'staff', status: 'correct' }],
}

function makeBlob() {
  return new Blob(['audio'], { type: 'audio/webm' })
}

describe('useBlobTranscription', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // FileReader.readAsDataURL → emit a tiny data URL
    vi.spyOn(scoring, 'scorePronunciation').mockResolvedValue(fakeScore)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('empieza en idle', () => {
    const { result } = renderHook(() => useBlobTranscription())
    expect(result.current.state).toBe('idle')
    expect(result.current.score).toBeNull()
  })

  it('transcribe y puntúa en éxito', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ transcript: 'staff' }),
      }),
    )

    const { result } = renderHook(() => useBlobTranscription())
    await act(async () => {
      await result.current.run(makeBlob(), 'staff')
    })

    await waitFor(() => expect(result.current.state).toBe('done'))
    expect(result.current.score?.wordResults).toEqual(fakeScore.wordResults)
    expect(result.current.score?.transcript).toBe('staff')
    expect(scoring.scorePronunciation).toHaveBeenCalledWith('staff', 'staff')
  })

  it('pasa a error cuando el fetch rechaza', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))

    const { result } = renderHook(() => useBlobTranscription())
    await act(async () => {
      await result.current.run(makeBlob(), 'staff')
    })

    await waitFor(() => expect(result.current.state).toBe('error'))
    expect(result.current.score).toBeNull()
  })

  it('pasa a error cuando la respuesta no es ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'AI service unavailable' }),
      }),
    )

    const { result } = renderHook(() => useBlobTranscription())
    await act(async () => {
      await result.current.run(makeBlob(), 'staff')
    })

    await waitFor(() => expect(result.current.state).toBe('error'))
    expect(result.current.score).toBeNull()
  })

  it('reset vuelve a idle', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ transcript: 'staff' }) }),
    )

    const { result } = renderHook(() => useBlobTranscription())
    await act(async () => {
      await result.current.run(makeBlob(), 'staff')
    })
    await waitFor(() => expect(result.current.state).toBe('done'))

    act(() => result.current.reset())
    expect(result.current.state).toBe('idle')
    expect(result.current.score).toBeNull()
  })
})
