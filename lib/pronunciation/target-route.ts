/**
 * Maps a `PronunciationTargetId` to a direct practice route, when one
 * exists (plan 067, step 7 — CTAs on the diagnostic results screen).
 *
 * The registry (`lib/pronunciation/targets/registry.ts`) has no route field
 * by design — routing is a UI concern, not target identity. This module is
 * the single place that owns the mapping.
 *
 * Coverage is deliberately partial: `/practice/sounds/sound/[soundId]`
 * expects a numeric, DB-backed `soundId`. There is no static IPA → numeric-id
 * table available synchronously here, so `segmental.*` targets deep-link into
 * Sound Lab with a `?focus=` query that filters the grid to the relevant IPA
 * symbols. Callers still get a correct, focused entry — not a blind dump on
 * the full lab index. `prosody.*` and `connected.*` targets have no dedicated
 * practice route yet, so they resolve to `null` — callers must handle that
 * gracefully (omit the CTA or show a fallback), never crash or emit a broken
 * link.
 */

import type { PronunciationTargetId } from './targets/types'

const SOUND_LAB_ROUTE = '/practice/sounds'

function stripIpaSlashes(ipa: string): string {
  return ipa.trim().replace(/^\/+|\/+$/g, '')
}

/** Sound Lab index filtered to the given IPA symbols (no leading/trailing `/`). */
export function soundLabFocusHref(tokens: readonly string[]): string {
  const cleaned = tokens.map(stripIpaSlashes).filter(Boolean)
  if (cleaned.length === 0) return SOUND_LAB_ROUTE
  return `${SOUND_LAB_ROUTE}?focus=${encodeURIComponent(cleaned.join(','))}`
}

function focusTokensFromTargetId(targetId: string): string[] | null {
  const phonemePrefix = 'segmental.phoneme.'
  if (targetId.startsWith(phonemePrefix)) {
    const ipa = targetId.slice(phonemePrefix.length)
    return ipa ? [ipa] : null
  }

  const contrastPrefix = 'segmental.contrast.'
  if (targetId.startsWith(contrastPrefix)) {
    const pair = targetId.slice(contrastPrefix.length)
    const parts = pair.split('|').map(stripIpaSlashes).filter(Boolean)
    return parts.length >= 2 ? parts : null
  }

  return null
}

/**
 * Returns the best available practice route for a target id, or `null` when
 * no direct route exists yet for that target's category.
 */
export function targetIdToPracticeRoute(targetId: string): string | null {
  const tokens = focusTokensFromTargetId(targetId)
  if (tokens) return soundLabFocusHref(tokens)
  // prosody.* and connected.* categories have no dedicated practice route yet.
  return null
}

export type { PronunciationTargetId }
