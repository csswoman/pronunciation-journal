/**
 * Plan 062 — explicit evidence attribution for practice results.
 *
 * SRS updates must read canonical target identity from here (or from a
 * declared non-SRS policy). Do not invent a single-row update from an
 * aggregate score or from a mismatched id namespace.
 */

// ── Branded target ids (namespace = brand) ─────────────────────────────────

declare const wordBankBrand: unique symbol
declare const lexiconBrand: unique symbol
declare const textFragmentBrand: unique symbol
declare const core1kBrand: unique symbol
declare const wordsBrand: unique symbol
declare const contrastBrand: unique symbol

export type WordBankId = string & { readonly [wordBankBrand]: 'word_bank' }
export type LexiconContentId = string & { readonly [lexiconBrand]: 'lexicon' }
export type TextFragmentId = string & { readonly [textFragmentBrand]: 'text_fragments' }
export type Core1kId = string & { readonly [core1kBrand]: 'core1k' }
export type WordsSoundId = string & { readonly [wordsBrand]: 'words' }
/** Canonical contrast key, e.g. `θ|ð` from `contrastKey()`. */
export type ContrastId = string & { readonly [contrastBrand]: 'contrast' }

export function wordBankId(id: string): WordBankId {
  return id as WordBankId
}

export function lexiconContentId(id: string): LexiconContentId {
  return id as LexiconContentId
}

export function textFragmentId(id: string): TextFragmentId {
  return id as TextFragmentId
}

export function core1kId(id: string): Core1kId {
  return id as Core1kId
}

export function wordsSoundId(id: string): WordsSoundId {
  return id as WordsSoundId
}

export function contrastId(id: string): ContrastId {
  return id as ContrastId
}

// ── Discriminated targets ──────────────────────────────────────────────────

export type EvidenceTarget =
  | { namespace: 'word_bank'; id: WordBankId }
  | { namespace: 'lexicon'; id: LexiconContentId }
  | { namespace: 'text_fragments'; id: TextFragmentId }
  | { namespace: 'core1k'; id: Core1kId }
  | { namespace: 'words'; id: WordsSoundId }
  | { namespace: 'contrast'; id: ContrastId }

/**
 * The kind of objective evidence produced by an exercise. This is metadata
 * for provenance/reporting; it does not claim acoustic phoneme accuracy.
 */
export type EvidenceModality =
  | 'meaning_recall'
  | 'contextual_use'
  | 'written_production'
  | 'spoken_production'
  | 'perception'
  | 'stt_intelligibility'

export type TargetOutcome = {
  target: EvidenceTarget
  correct: boolean
  /** 0–100 when the evaluator produced a graded score for this target. */
  score?: number
  modality?: EvidenceModality
}

export type NonSrsReason =
  | 'aggregate'
  | 'non_objective'
  | 'unsaved'
  | 'no_target'

/**
 * How a completed exercise maps onto SRS-eligible entities.
 * - `srsEligible: false` → answer evidence may still be stored; no SRS write.
 * - `srsEligible: true` → one or more explicit target outcomes.
 */
export type EvidenceAttribution =
  | {
      srsEligible: false
      reason: NonSrsReason
      detail?: string
    }
  | {
      srsEligible: true
      outcomes: [TargetOutcome, ...TargetOutcome[]]
    }

/** Contract version stamped on new evidence (plan 062 step 6). */
export const ATTRIBUTION_VERSION = 1 as const
export type AttributionVersion = typeof ATTRIBUTION_VERSION

// ── Builders ───────────────────────────────────────────────────────────────

export function nonSrsAttribution(
  reason: NonSrsReason,
  detail?: string,
): EvidenceAttribution {
  return detail === undefined
    ? { srsEligible: false, reason }
    : { srsEligible: false, reason, detail }
}

export function attributeSingleTarget(outcome: TargetOutcome): EvidenceAttribution {
  return { srsEligible: true, outcomes: [outcome] }
}

/**
 * Group / multi-item exercises must declare how (or whether) to attribute SRS.
 * There is no "use the first word" option — that was the 062 bug.
 */
export type GroupExercisePolicy =
  | { mode: 'per_target'; outcomes: TargetOutcome[] }
  | { mode: 'non_srs'; reason: string }

export function attributeGroupResult(policy: GroupExercisePolicy): EvidenceAttribution {
  if (policy.mode === 'non_srs') {
    return nonSrsAttribution('aggregate', policy.reason)
  }

  const [first, ...rest] = policy.outcomes
  if (!first) {
    return nonSrsAttribution('no_target', 'group exercise produced zero outcomes')
  }

  return { srsEligible: true, outcomes: [first, ...rest] }
}

/**
 * Adapter: a lexicon catalog id becomes a word_bank target only when the
 * caller already resolved the real bank UUID. Content id alone is never enough.
 */
export function wordBankTargetFromResolvedBank(
  bankUuid: WordBankId,
): Extract<EvidenceTarget, { namespace: 'word_bank' }> {
  return { namespace: 'word_bank', id: bankUuid }
}

/** True when exercise_payload carries plan-062 corrected-target evidence. */
export function isAttributedTargetEvidence(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false
  const meta = payload as {
    attributionVersion?: number
    attribution?: EvidenceAttribution
  }
  return (
    meta.attributionVersion === ATTRIBUTION_VERSION
    && meta.attribution?.srsEligible === true
  )
}

/** Legacy rows lack attributionVersion — keep visible, never invent targets. */
export function isLegacyAnswerPayload(payload: unknown): boolean {
  return !isAttributedTargetEvidence(payload)
}

export function mergeAttributionIntoPayload(
  existing: unknown,
  attribution: EvidenceAttribution | undefined,
  version: AttributionVersion = ATTRIBUTION_VERSION,
): Record<string, unknown> {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {}
  if (!attribution) return base
  return {
    ...base,
    attribution,
    attributionVersion: version,
  }
}

