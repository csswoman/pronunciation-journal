import { describe, it, expect, vi, beforeEach } from 'vitest'
import { playUiCue, UI_CUE_SOUNDS, isCueAllowed } from '../cues'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

const playCue = vi.fn()
const setEngineEnabled = vi.fn()
const setEnabled = vi.fn()

vi.mock('cuelume', () => ({
  setEnabled: (...args: unknown[]) => setEnabled(...args),
  bind: vi.fn(),
}))

vi.mock('@/lib/ui-sounds/engine', () => ({
  playCue: (...args: unknown[]) => playCue(...args),
  setEngineEnabled: (...args: unknown[]) => setEngineEnabled(...args),
}))

beforeEach(() => {
  playCue.mockClear()
  setEngineEnabled.mockClear()
  setEnabled.mockClear()
  useUISoundsStore.setState({ soundPreference: 'exercise', soundEnabled: true })
})

describe('UI_CUE_SOUNDS', () => {
  it('maps all product cues correctly', () => {
    expect(UI_CUE_SOUNDS).toMatchObject({
      tap: 'tick',
      correct: 'sparkle',
      wrong: 'droplet',
      press: 'press',
      release: 'release',
      toggle: 'toggle',
      hover: 'chime',
      reveal: 'bloom',
      soft: 'whisper',
      'nav-open': 'nav-open',
      'nav-close': 'nav-close',
      'nav-switch': 'nav-switch',
      create: 'create',
      save: 'save',
      duplicate: 'duplicate',
      delete: 'delete',
      archive: 'archive',
      streak: 'streak',
      milestone: 'milestone',
      'level-up': 'level-up',
      'message-send': 'message-send',
      'message-receive': 'message-receive',
    })
  })
})

describe('isCueAllowed category filtering', () => {
  it('handles off preference', () => {
    expect(isCueAllowed('tap', 'off')).toBe(false)
    expect(isCueAllowed('nav-switch', 'off')).toBe(false)
  })

  it('handles exercise preference (default) — all 9 original cues allowed, new cues blocked', () => {
    // 9 originals -> allowed
    expect(isCueAllowed('tap', 'exercise')).toBe(true)
    expect(isCueAllowed('correct', 'exercise')).toBe(true)
    expect(isCueAllowed('wrong', 'exercise')).toBe(true)
    expect(isCueAllowed('press', 'exercise')).toBe(true)
    expect(isCueAllowed('release', 'exercise')).toBe(true)
    expect(isCueAllowed('toggle', 'exercise')).toBe(true)
    expect(isCueAllowed('hover', 'exercise')).toBe(true)
    expect(isCueAllowed('reveal', 'exercise')).toBe(true)
    expect(isCueAllowed('soft', 'exercise')).toBe(true)

    // New cues -> blocked under exercise
    expect(isCueAllowed('nav-switch', 'exercise')).toBe(false)
    expect(isCueAllowed('streak', 'exercise')).toBe(false)
    expect(isCueAllowed('milestone', 'exercise')).toBe(false)
    expect(isCueAllowed('level-up', 'exercise')).toBe(false)
    expect(isCueAllowed('create', 'exercise')).toBe(false)
  })

  it('handles ui preference — allows 12 new cues, blocks 9 exercise cues', () => {
    expect(isCueAllowed('correct', 'ui')).toBe(false)
    expect(isCueAllowed('tap', 'ui')).toBe(false)
    expect(isCueAllowed('nav-switch', 'ui')).toBe(true)
    expect(isCueAllowed('save', 'ui')).toBe(true)
    expect(isCueAllowed('streak', 'ui')).toBe(true)
  })

  it('handles all preference', () => {
    expect(isCueAllowed('correct', 'all')).toBe(true)
    expect(isCueAllowed('nav-switch', 'all')).toBe(true)
    expect(isCueAllowed('streak', 'all')).toBe(true)
  })
})

describe('playUiCue', () => {
  it('plays exercise cues on default preference and mutes nav-switch', () => {
    playUiCue('correct')
    expect(playCue).toHaveBeenCalledWith('sparkle')

    playUiCue('nav-switch')
    // nav-switch is category ui -> silent under default exercise pref
    expect(playCue).not.toHaveBeenCalledWith('nav-switch')
  })

  it('plays navigation when preference is all', () => {
    useUISoundsStore.setState({ soundPreference: 'all', soundEnabled: true })
    playUiCue('nav-switch')
    expect(playCue).toHaveBeenCalledWith('nav-switch')
  })

  it('no-ops when preference is off', () => {
    useUISoundsStore.setState({ soundPreference: 'off', soundEnabled: false })
    playUiCue('tap')
    playUiCue('nav-open')
    expect(playCue).not.toHaveBeenCalled()
  })
})
