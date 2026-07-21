/**
 * Adapters resolving legacy `focus=<ipa>` deep links and `sounds[]` fields
 * through the pronunciation target registry, without deleting either legacy
 * shape. See `docs/architecture/pronunciation-targets.md` Step 6.
 *
 * Callers that still read `focus`/`sounds` directly (e.g. `SoundLabPage`)
 * are unaffected — this module gives future callers a typed path onto the
 * registry instead of guessing at title/IPA substrings.
 */

import { contrastTargetId, phonemeTargetId, PRONUNCIATION_TARGETS } from './registry'
import type { PronunciationTargetId } from './types'

export interface ResolvedLegacyRef {
  raw: string
  targetId: PronunciationTargetId | null
}

/**
 * Resolves a single legacy IPA token (as used in `focus=` query params and
 * `GrammarStudyDeckData.sounds`) to a registry target id, trying the
 * phoneme namespace first.
 *
 * Returns `null` in `targetId` when nothing in the registry matches — this
 * is expected for the majority of legacy tokens today (only phonemes with
 * an authored target resolve). Callers must not fall back to a guessed
 * target; `null` means "not yet in the registry".
 */
export function resolveLegacyIpaToken(raw: string): ResolvedLegacyRef {
  const normalized = raw.trim()
  const candidate = phonemeTargetId(normalized.startsWith('/') ? normalized : `/${normalized}/`)
  if (PRONUNCIATION_TARGETS[candidate]) {
    return { raw, targetId: candidate }
  }
  return { raw, targetId: null }
}

/**
 * Resolves a pair of legacy IPA tokens (as used for `contrast_id` rows) to
 * a `segmental.contrast.*` target id, canonical regardless of argument
 * order.
 */
export function resolveLegacyContrastPair(ipaA: string, ipaB: string): ResolvedLegacyRef {
  const targetId = contrastTargetId(ipaA, ipaB)
  const raw = `${ipaA},${ipaB}`
  if (PRONUNCIATION_TARGETS[targetId]) {
    return { raw, targetId }
  }
  return { raw, targetId: null }
}

/**
 * Resolves every token in a legacy `sounds[]` / `focus=` list. In
 * development/test, throws if ANY token is unresolvable so authors notice
 * immediately rather than silently losing a link. In production, returns
 * partial results (entries with `targetId: null`) so the app degrades
 * instead of crashing.
 */
export function resolveLegacySoundList(tokens: readonly string[]): ResolvedLegacyRef[] {
  const resolved = tokens.map(resolveLegacyIpaToken)

  if (process.env.NODE_ENV !== 'production') {
    const unresolved = resolved.filter((r) => r.targetId === null)
    if (unresolved.length > 0) {
      throw new Error(
        `[pronunciation/targets] unresolved legacy sound tokens: ${unresolved
          .map((r) => r.raw)
          .join(', ')} — add a registry target or fix the authored data`
      )
    }
  }

  return resolved
}
