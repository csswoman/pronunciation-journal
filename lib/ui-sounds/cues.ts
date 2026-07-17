/**
 * App interaction cues via cuelume.
 * Only the curated subset we ship in product UI (no success/error/page/…).
 */
import { bind, play, setEnabled, type SoundName } from 'cuelume'
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
} as const satisfies Record<string, SoundName>

export type UiCue = keyof typeof UI_CUE_SOUNDS

function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Keep cuelume's global gate in sync with app + a11y prefs. */
export function syncCuelumeEnabled(): void {
  const enabled = useUISoundsStore.getState().soundEnabled && !isReducedMotion()
  setEnabled(enabled)
}

/** Call once on the client after mount. Idempotent. */
export function initCuelume(): void {
  syncCuelumeEnabled()
  bind()
}

export function playUiCue(cue: UiCue): void {
  if (!useUISoundsStore.getState().soundEnabled || isReducedMotion()) return
  play(UI_CUE_SOUNDS[cue])
}
