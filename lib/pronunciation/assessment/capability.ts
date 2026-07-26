/**
 * Pure, testable logic for building a `CapabilitySnapshot` (plan 067, step 2
 * preflight) from browser state — mic permission, speech-recognition feature
 * detection, and online status. Kept separate from the React component so it
 * can be tested without mounting anything.
 *
 * Feature detection mirrors `hooks/useSpeechRecognition.ts`
 * (`'SpeechRecognition' in window || 'webkitSpeechRecognition' in window`) —
 * do not invent a different detection strategy here.
 */

import { isBrowserOnline } from '@/lib/practice/daily-plan/online'
import type { CapabilitySnapshot } from '@/lib/pronunciation/assessment/types'

type MicPermission = CapabilitySnapshot['micPermission']
type PermissionChangeCleanup = () => void

/**
 * Feature-detects the Web Speech API using the same check as
 * `useSpeechRecognition`. Guards `typeof window` for SSR safety.
 */
export function detectSpeechRecognitionSupport(): boolean {
  if (typeof window === 'undefined') return false
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

/**
 * Microphone capture is unavailable in insecure contexts such as a phone
 * opening the dev server through `http://192.168.x.x:3000`. Browsers expose
 * localhost as a trusted exception, but a LAN address needs HTTPS.
 */
export function detectMicrophoneCaptureSupport(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  if (window.isSecureContext === false) return false
  return typeof navigator.mediaDevices?.getUserMedia === 'function'
}

/**
 * Queries mic permission state via the Permissions API when available.
 * Falls back to `'unknown'` — the browser doesn't support querying
 * `microphone` permission (e.g. Safari) or the query itself failed/was
 * denied by policy, distinct from the user explicitly denying mic access.
 */
export async function queryMicPermission(): Promise<MicPermission> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'unknown'
  }
  try {
    const status = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    })
    if (status.state === 'granted' || status.state === 'denied' || status.state === 'prompt') {
      return status.state
    }
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Keeps the preflight in sync when the learner changes the site permission
 * from Chrome's address-bar controls. Returns a cleanup even when the
 * Permissions API cannot be observed.
 */
export async function subscribeToMicPermissionChanges(
  onChange: (permission: MicPermission) => void
): Promise<PermissionChangeCleanup> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return () => {}
  }

  try {
    const status = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    })
    const handleChange = () => {
      if (status.state === 'granted' || status.state === 'denied' || status.state === 'prompt') {
        onChange(status.state)
      }
    }

    status.addEventListener('change', handleChange)
    return () => status.removeEventListener('change', handleChange)
  } catch {
    return () => {}
  }
}

/**
 * Requests microphone access from a user gesture. Querying Permissions API is
 * intentionally not enough: Chrome only shows its permission prompt when
 * getUserMedia is actually called.
 */
export async function requestMicPermission(): Promise<MicPermission> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unknown'
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    return 'granted'
  } catch (error) {
    const name = error instanceof DOMException ? error.name : ''
    return name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'denied' : 'unknown'
  }
}

/**
 * Derives `browserSupport` from feature support + mic permission.
 * - `unsupported`: no SpeechRecognition API at all.
 * - `full`: API present and mic access isn't known to be blocked.
 * - `partial`: API present but mic permission is denied — recognition would
 *   fail in practice even though the API exists.
 */
export function deriveBrowserSupport(
  hasSpeechRecognition: boolean,
  micPermission: MicPermission,
  hasMicrophoneCapture = true
): CapabilitySnapshot['browserSupport'] {
  if (!hasSpeechRecognition) return 'unsupported'
  if (micPermission === 'denied' || !hasMicrophoneCapture) return 'partial'
  return 'full'
}

/**
 * Derives whether STT can actually be attempted right now. The Web Speech
 * API (as used in this codebase, see `useSpeechRecognition.ts`) is a
 * browser-mediated remote recognition service in Chrome/Chromium — it
 * requires network connectivity even though the API surface is on-device
 * JS. Conservatively treat offline as `sttAvailable: false`.
 */
export function deriveSttAvailable(
  hasSpeechRecognition: boolean,
  micPermission: MicPermission,
  online: boolean,
  hasMicrophoneCapture = true
): boolean {
  if (!hasSpeechRecognition) return false
  if (!hasMicrophoneCapture) return false
  if (micPermission === 'denied') return false
  if (!online) return false
  return true
}

/**
 * Builds a full `CapabilitySnapshot` by combining feature detection, mic
 * permission query, and online status. Safe to call from a client component
 * effect; each sub-check degrades gracefully (never throws).
 */
export async function buildCapabilitySnapshot(
  micPermissionOverride?: MicPermission
): Promise<CapabilitySnapshot> {
  const hasSpeechRecognition = detectSpeechRecognitionSupport()
  const hasMicrophoneCapture = detectMicrophoneCaptureSupport()
  const micPermission = micPermissionOverride ?? await queryMicPermission()
  const online = isBrowserOnline()

  return {
    micPermission,
    sttAvailable: deriveSttAvailable(
      hasSpeechRecognition,
      micPermission,
      online,
      hasMicrophoneCapture
    ),
    browserSupport: deriveBrowserSupport(
      hasSpeechRecognition,
      micPermission,
      hasMicrophoneCapture
    ),
    capturedAt: new Date().toISOString(),
  }
}

/** True when production (speaking) can be evaluated at all given a snapshot. */
export function canEvaluateProduction(snapshot: CapabilitySnapshot): boolean {
  return (
    snapshot.sttAvailable &&
    snapshot.browserSupport !== 'unsupported' &&
    snapshot.micPermission !== 'denied'
  )
}
