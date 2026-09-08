import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchMissionLineAudio } from '../audio-queries'
import type { ScriptLine } from '../../types'

describe('fetchMissionLineAudio', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns pre-existing modelAudio path directly without network call', async () => {
    const line: ScriptLine = {
      id: 'test-1',
      speaker: 'coach',
      text: 'Hello!',
      modelAudio: { path: 'https://storage.example.com/audio.wav' },
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const result = await fetchMissionLineAudio(line, 'mission-1')

    expect(result).toBe('https://storage.example.com/audio.wav')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fetches from /api/gemini/mission-audio and caches the result', async () => {
    const line: ScriptLine = {
      id: 'test-2',
      speaker: 'coach',
      text: 'Can I help you?',
    }

    const mockResponse = { audioUrl: 'https://storage.example.com/cached.wav' }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result1 = await fetchMissionLineAudio(line, 'mission-2')
    expect(result1).toBe('https://storage.example.com/cached.wav')
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Second call should return from in-memory cache without calling fetch again
    const result2 = await fetchMissionLineAudio(line, 'mission-2')
    expect(result2).toBe('https://storage.example.com/cached.wav')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
