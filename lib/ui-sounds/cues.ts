/**
 * App interaction cues and playback gating.
 *
 * Imperative cues (exercise feedback, navigation, actions, celebrations)
 * are played through {@link playCue} engine at the boosted app volume.
 * Ambient `data-cuelume-*` button sounds stay on cuelume's `bind()`.
 */
import { bind, setEnabled } from 'cuelume'
import { playCue, setEngineEnabled, type CueSound } from '@/lib/ui-sounds/engine'
import { initEarlyAudioUnlock } from '@/lib/ui-sounds/context'
import { useUISoundsStore, type SoundPreference } from '@/lib/stores/uiSoundsStore'

/** Semantic app cues → internal recipe sound names */
export const UI_CUE_SOUNDS = {
  // Exercise & feedback cues
  tap: 'tick',
  correct: 'sparkle',
  wrong: 'droplet',
  press: 'press',
  release: 'release',
  toggle: 'toggle',
  hover: 'chime',
  reveal: 'bloom',
  soft: 'whisper',

  // Navigation & Panel
  'nav-open': 'nav-open',
  'nav-close': 'nav-close',
  'nav-switch': 'nav-switch',

  // Positive Actions
  create: 'create',
  save: 'save',
  duplicate: 'duplicate',

  // Negative Actions
  delete: 'delete',
  archive: 'archive',

  // Progress & Celebrations
  streak: 'streak',
  milestone: 'milestone',
  'level-up': 'level-up',

  // Chat Interactions
  'message-send': 'message-send',
  'message-receive': 'message-receive',

  // Mechanical Keyboard Cues
  'mech-key': 'mech-key',
  'mech-space': 'mech-space',
} as const satisfies Record<string, CueSound>

export type UiCue = keyof typeof UI_CUE_SOUNDS

export type CueCategory = 'exercise' | 'ui'

export const CUE_CATEGORIES: Record<UiCue, CueCategory> = {
  // Exactly the 9 original cues -> exercise
  tap: 'exercise',
  correct: 'exercise',
  wrong: 'exercise',
  press: 'exercise',
  release: 'exercise',
  toggle: 'exercise',
  hover: 'exercise',
  reveal: 'exercise',
  soft: 'exercise',

  // Exactly the 12 new cues -> ui
  'nav-open': 'ui',
  'nav-close': 'ui',
  'nav-switch': 'ui',
  create: 'ui',
  save: 'ui',
  duplicate: 'ui',
  delete: 'ui',
  archive: 'ui',
  streak: 'ui',
  milestone: 'ui',
  'level-up': 'ui',
  'message-send': 'ui',
  'message-receive': 'ui',
  'mech-key': 'ui',
  'mech-space': 'ui',
}

const NAV_CUES = new Set<UiCue>(['nav-open', 'nav-close', 'nav-switch'])

/**
 * Runtime kill switch for navigation domain cues.
 * Evaluates env flags, window global, or localStorage without redeploying.
 */
export function isNavCuesEnabled(): boolean {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DISABLE_NAV_CUES === 'true') {
    return false
  }
  if (typeof window !== 'undefined') {
    if ((window as unknown as { __DISABLE_NAV_CUES__?: boolean }).__DISABLE_NAV_CUES__ === true) {
      return false
    }
    try {
      if (window.localStorage?.getItem('disable-nav-cues') === 'true') {
        return false
      }
    } catch {}
  }
  return true
}

export function isCueAllowed(cue: UiCue, preference: SoundPreference): boolean {
  if (preference === 'off') return false
  if (NAV_CUES.has(cue) && !isNavCuesEnabled()) return false
  if (preference === 'all') return true
  const category = CUE_CATEGORIES[cue]
  return preference === category
}

/** Keep both sound engines' global gate in sync with app preference. */
export function syncCuelumeEnabled(): void {
  const pref = useUISoundsStore.getState().soundPreference
  const cuelumeActive = pref === 'all' || pref === 'ui'
  setEnabled(cuelumeActive)
  setEngineEnabled(pref !== 'off')
}

/** Call once on the client after mount. Idempotent. */
export function initCuelume(): void {
  initEarlyAudioUnlock()
  syncCuelumeEnabled()
  bind()
}

export function playUiCue(cue: UiCue): void {
  const pref = useUISoundsStore.getState().soundPreference
  if (!isCueAllowed(cue, pref)) return

  const soundName = UI_CUE_SOUNDS[cue]
  if (soundName) {
    playCue(soundName)
  }
}
