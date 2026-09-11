// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMissionLineAudio } from '../useMissionLineAudio'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

const fetchMissionLineAudioMock = vi.fn()
const updateGeneratedScriptLineAudioMock = vi.fn()

vi.mock('@/lib/ai-practice/missions/scripted/audio-queries', () => ({
  fetchMissionLineAudio: (...args: unknown[]) => fetchMissionLineAudioMock(...args),
}))

vi.mock('@/lib/ai-practice/missions/scripted/generated-store', () => ({
  updateGeneratedScriptLineAudio: (...args: unknown[]) =>
    updateGeneratedScriptLineAudioMock(...args),
}))

describe('useMissionLineAudio', () => {
  const originalOnLine = navigator.onLine

  beforeEach(() => {
    fetchMissionLineAudioMock.mockReset()
    updateGeneratedScriptLineAudioMock.mockReset()
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true })
  })

  it('devuelve hdAudioUrl directo sin fetch si line.modelAudio.path ya existe', () => {
    const line: ScriptLine = {
      id: 'line-1',
      speaker: 'coach',
      text: 'Hello world',
      modelAudio: { path: 'https://example.com/audio.mp3' },
    }

    const { result } = renderHook(() => useMissionLineAudio(line, 'mission-123'))

    expect(result.current.hdAudioUrl).toBe('https://example.com/audio.mp3')
    expect(fetchMissionLineAudioMock).not.toHaveBeenCalled()
  })

  it('hace fetch de audio si falta y estamos online', async () => {
    fetchMissionLineAudioMock.mockResolvedValueOnce('https://example.com/fetched.mp3')
    const line: ScriptLine = {
      id: 'line-2',
      speaker: 'learner',
      text: 'Can I get a coffee?',
    }

    const { result } = renderHook(() => useMissionLineAudio(line, 'mission-123'))

    await waitFor(() => {
      expect(result.current.hdAudioUrl).toBe('https://example.com/fetched.mp3')
    })
    expect(fetchMissionLineAudioMock).toHaveBeenCalledWith(line, 'mission-123')
    expect(updateGeneratedScriptLineAudioMock).not.toHaveBeenCalled()
  })

  it('actualiza el store de misiones generadas si missionId empieza por generated.', async () => {
    fetchMissionLineAudioMock.mockResolvedValueOnce('https://example.com/gen.mp3')
    const line: ScriptLine = {
      id: 'line-gen',
      speaker: 'coach',
      text: 'Generated phrase',
    }

    const { result } = renderHook(() => useMissionLineAudio(line, 'generated.mission-456'))

    await waitFor(() => {
      expect(result.current.hdAudioUrl).toBe('https://example.com/gen.mp3')
    })
    expect(updateGeneratedScriptLineAudioMock).toHaveBeenCalledWith(
      'generated.mission-456',
      'line-gen',
      'https://example.com/gen.mp3',
    )
  })

  it('no hace fetch si navigator.onLine es false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const line: ScriptLine = {
      id: 'line-offline',
      speaker: 'coach',
      text: 'Offline phrase',
    }

    const { result } = renderHook(() => useMissionLineAudio(line, 'mission-123'))

    expect(result.current.hdAudioUrl).toBeUndefined()
    expect(fetchMissionLineAudioMock).not.toHaveBeenCalled()
  })

  it('no hace fetch si missionId no está definido', () => {
    const line: ScriptLine = {
      id: 'line-no-mission',
      speaker: 'coach',
      text: 'No mission id',
    }

    const { result } = renderHook(() => useMissionLineAudio(line))

    expect(result.current.hdAudioUrl).toBeUndefined()
    expect(fetchMissionLineAudioMock).not.toHaveBeenCalled()
  })
})
