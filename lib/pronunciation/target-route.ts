/**
 * Maps a `PronunciationTargetId` to a direct practice route, when one
 * exists (plan 067, step 7 — CTAs on the diagnostic results screen).
 *
 * The registry (`lib/pronunciation/targets/registry.ts`) has no route field
 * by design — routing is a UI concern, not target identity. This module is
 * the single place that owns the mapping.
 *
 * Coverage is deliberately partial: `/practice/sounds/sound/[soundId]`
 * expects a numeric, DB-backed `soundId` (see
 * `app/(authenticated)/practice/sounds/sound/[soundId]/page.tsx` and
 * `lib/phoneme-practice/queries.ts`'s `getSoundById`). There is no static
 * IPA → numeric-id table available synchronously to this pure mapping
 * function, so `segmental.*` targets route to the sound browse/lab index
 * (`/practice/sounds`) rather than a specific sound's session — still a
 * direct, correct entry point into practice for that category, just not
 * deep-linked to the exact sound. `prosody.*` and `connected.*` targets have
 * no dedicated practice route in this codebase yet, so they resolve to
 * `null` — callers must handle that gracefully (omit the CTA or show a
 * fallback message), never crash or emit a broken link.
 */

import type { PronunciationTargetId } from './targets/types'

const SOUND_LAB_ROUTE = '/practice/sounds'

/**
 * Returns the best available practice route for a target id, or `null` when
 * no direct route exists yet for that target's category.
 */
export function targetIdToPracticeRoute(targetId: string): string | null {
  if (targetId.startsWith('segmental.phoneme.') || targetId.startsWith('segmental.contrast.')) {
    return SOUND_LAB_ROUTE
  }
  // prosody.* and connected.* categories have no dedicated practice route yet.
  return null
}

export type { PronunciationTargetId }
