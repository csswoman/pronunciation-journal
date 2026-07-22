/**
 * Honesty gate for production-stage diagnostic scoring (plan 067, step 4).
 *
 * Isolated from `scoring.ts` so the one rule this whole step exists to
 * enforce — "never let a transcript-perfect attempt leak a numeric score
 * for a dimension we can't actually measure" — has a single, small,
 * easy-to-audit home.
 */

import { isProsodyOnlyTargetId } from './types'
import type { PronunciationTarget } from '@/lib/pronunciation/targets/types'
import { UNAVAILABLE_EVIDENCE_CAPABILITIES } from '@/lib/pronunciation/targets/types'

/**
 * True when `target`'s production dimension must abstain
 * (`not_measured`/`no_evaluator_available`) regardless of what a
 * `SpokenAttempt` claims, because:
 *
 * - it's a prosody-only category (word-stress/sentence-stress/rhythm/
 *   intonation) — STT measures segmental intelligibility, not stress or
 *   intonation contour, so a perfect transcript proves nothing about
 *   prosody; or
 * - its only production-capable evidence capability is `acoustic`, which
 *   is globally unavailable (`UNAVAILABLE_EVIDENCE_CAPABILITIES`) until a
 *   validated evaluator ships (ADR 064 / plan 071).
 */
export function mustAbstainFromProductionScore(target: PronunciationTarget): boolean {
  if (isProsodyOnlyTargetId(target.id)) return true

  const productionCapabilities = target.evidenceCapabilities.filter(
    (c) => c === 'controlled_production' || c === 'contextual_production' || c === 'acoustic' || c === 'stt_intelligibility'
  )
  const hasSttCapability = productionCapabilities.includes('stt_intelligibility')
  const onlyAcousticCapable =
    !hasSttCapability &&
    productionCapabilities.some((c) => c === 'acoustic' && UNAVAILABLE_EVIDENCE_CAPABILITIES.includes(c))

  // A target with no stt_intelligibility capability at all cannot be
  // scored from a SpokenAttempt (which only carries stt_intelligibility
  // today) — treat that as an abstention too, not a crash.
  return onlyAcousticCapable || !hasSttCapability
}
