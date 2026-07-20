/**
 * App interaction cues.
 * Only the curated subset we ship in product UI (no success/error/page/…).
 *
 * Imperative cues (exercise feedback: tap/correct/wrong, reveals, etc.) are
 * played through our own {@link playCue} engine so they use the app's boosted
 * volume — cuelume exposes no volume control and its baked gain is too quiet.
 * Ambient `data-cuelume-*` button sounds stay on cuelume's `bind()`.
 */
import { bind, setEnabled, type SoundName } from 'cuelume'
import { playCue, setEngineEnabled, type CueSound } from '@/lib/ui-sounds/engine'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

/** Semantic app cues → cuelume sound names */
export const UI_CUE_SOUNDS = {
  /** Option / chip select before grading */
  tap: 'tick',
  /** Answer correct */
  correct: 'sparkle',
  /** Answer wrong or soft dismiss */
  wrong: 'droplet',
  /** Pointer down on primary controls */
  press: 'press',
  /** Pointer up on primary controls */
  release: 'release',
  /** Switches, tabs, menus */
  toggle: 'toggle',
  /** Fine-pointer hover (nav, links) */
  hover: 'chime',
  /** Reveal / expand (hints, panels) */
  reveal: 'bloom',
  /** Dense lists / quiet accents */
  soft: 'whisper',
} as const satisfies Record<string, SoundName & CueSound>

export type UiCue = keyof typeof UI_CUE_SOUNDS

function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Keep both sound engines' global gate in sync with app + a11y prefs. */
export function syncCuelumeEnabled(): void {
  const enabled = useUISoundsStore.getState().soundEnabled && !isReducedMotion()
  setEnabled(enabled)
  setEngineEnabled(enabled)
}

/** Call once on the client after mount. Idempotent. */
export function initCuelume(): void {
  syncCuelumeEnabled()
  bind()
}

export function playUiCue(cue: UiCue): void {
  if (!useUISoundsStore.getState().soundEnabled || isReducedMotion()) return
  playCue(UI_CUE_SOUNDS[cue])
}
