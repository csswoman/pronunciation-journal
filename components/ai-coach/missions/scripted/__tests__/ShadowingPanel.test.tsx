// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ShadowingPanel } from '../ShadowingPanel'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

const speakMock = vi.fn()
vi.mock('@/lib/phoneme-practice/tts', () => ({
  speak: (...args: unknown[]) => speakMock(...args),
}))

const useMissionLineAudioMock = vi.fn()
vi.mock('@/hooks/useMissionLineAudio', () => ({
  useMissionLineAudio: (...args: unknown[]) => useMissionLineAudioMock(...args),
}))

const line: ScriptLine = {
  id: 'l1',
  speaker: 'learner',
  text: 'I would like a coffee.',
}

describe('ShadowingPanel', () => {
  let playMock: ReturnType<typeof vi.fn>
  let pauseMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    speakMock.mockReset()
    useMissionLineAudioMock.mockReturnValue({ hdAudioUrl: undefined })

    playMock = vi.fn().mockResolvedValue(undefined)
    pauseMock = vi.fn()
    vi.stubGlobal(
      'Audio',
      vi.fn(function () {
        return {
          play: playMock,
          pause: pauseMock,
          onended: null,
          onerror: null,
        }
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('escribe la frase una sola vez: cada palabra es su propio botón', () => {
    render(<ShadowingPanel line={line} missionId="mission-1" />)

    expect(screen.getByRole('button', { name: /escuchar frase/i })).toBeInTheDocument()
    // "I", "would", "like", "a", "coffee." -> 5 palabras, cada una tocable.
    for (const word of ['I', 'would', 'like', 'a', 'coffee.']) {
      expect(screen.getByRole('button', { name: `Escuchar ${word}` })).toBeInTheDocument()
    }
    // La frase no se repite como titulo aparte de las palabras.
    expect(screen.queryByText(line.text)).not.toBeInTheDocument()
  })

  it('tocar un chip de palabra invoca speak() con la palabra seleccionada', () => {
    render(<ShadowingPanel line={line} missionId="mission-1" />)

    const chip = screen.getByRole('button', { name: 'Escuchar coffee.' })
    fireEvent.click(chip)

    expect(speakMock).toHaveBeenCalledWith('coffee.', expect.anything())
  })

  it('reproduce audio HD cuando está disponible al pulsar escuchar frase', () => {
    useMissionLineAudioMock.mockReturnValue({ hdAudioUrl: 'https://example.com/audio.mp3' })
    render(<ShadowingPanel line={line} missionId="mission-1" />)

    const listenBtn = screen.getByRole('button', { name: /escuchar frase/i })
    fireEvent.click(listenBtn)

    expect(playMock).toHaveBeenCalled()
    expect(speakMock).not.toHaveBeenCalled()
  })

  it('cae a speak(line.text) si no hay audio HD disponible', () => {
    useMissionLineAudioMock.mockReturnValue({ hdAudioUrl: undefined })
    render(<ShadowingPanel line={line} missionId="mission-1" />)

    const listenBtn = screen.getByRole('button', { name: /escuchar frase/i })
    fireEvent.click(listenBtn)

    expect(speakMock).toHaveBeenCalledWith('I would like a coffee.', expect.anything())
  })
})
