/**
 * Shared AudioContext singleton and iOS early unlock management.
 */

let sharedContext: AudioContext | null = null
let unlockListenerAttached = false

export function getAudioContext(): AudioContext | null {
  if (sharedContext) return sharedContext
  if (typeof window === 'undefined') return null

  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null

  try {
    sharedContext = new Ctor()
  } catch {
    return null
  }
  return sharedContext
}

/**
 * Registers an early pointerdown listener on window to proactively resume
 * AudioContext on iOS/WebKit before the first navigation cue fires.
 */
export function initEarlyAudioUnlock(): void {
  if (typeof window === 'undefined' || unlockListenerAttached) return
  unlockListenerAttached = true

  const unlock = () => {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume().catch(() => {})
    }
  }

  window.addEventListener('pointerdown', unlock, { once: true, capture: true })
}

export function resetAudioContextForTests(): void {
  sharedContext = null
  unlockListenerAttached = false
}
