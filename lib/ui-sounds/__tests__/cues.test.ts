import { describe, it, expect, vi, beforeEach } from 'vitest'
import { playUiCue, UI_CUE_SOUNDS } from '../cues'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

const play = vi.fn()
const setEnabled = vi.fn()

vi.mock('cuelume', () => ({
  play: (...args: unknown[]) => play(...args),
  setEnabled: (...args: unknown[]) => setEnabled(...args),
  bind: vi.fn(),
}))

beforeEach(() => {
  play.mockClear()
  setEnabled.mockClear()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
  useUISoundsStore.setState({ soundEnabled: true })
})

describe('UI_CUE_SOUNDS', () => {
  it('maps only the product palette', () => {
    expect(UI_CUE_SOUNDS).toEqual({
      tap: 'tick',
      correct: 'sparkle',
      wrong: 'droplet',
      press: 'press',
      release: 'release',
      toggle: 'toggle',
      hover: 'chime',
      reveal: 'bloom',
      soft: 'whisper',
    })
  })
})

describe('playUiCue', () => {
  it('plays the mapped sound', () => {
    playUiCue('correct')
    expect(play).toHaveBeenCalledWith('sparkle')
  })

  it('no-ops when sounds disabled', () => {
    useUISoundsStore.setState({ soundEnabled: false })
    playUiCue('tap')
    expect(play).not.toHaveBeenCalled()
  })
})
