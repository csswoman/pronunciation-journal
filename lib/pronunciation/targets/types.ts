/**
 * Canonical pronunciation target identity. See
 * `docs/architecture/pronunciation-targets.md` for the full contract.
 *
 * This module declares WHAT a target is and WHICH evidence capabilities it
 * may claim — it does not score anything and does not touch persisted
 * progress. `contrast_id` rows in `user_contrast_progress` keep their
 * existing shape; `registry.ts` provides adapters, not a migration.
 */

import type { CEFRLevel } from '@/lib/exercises/cefr'

export type PronunciationTargetCategory =
  | 'segmental.phoneme'
  | 'segmental.contrast'
  | 'prosody.word-stress'
  | 'prosody.sentence-stress'
  | 'prosody.rhythm'
  | 'prosody.intonation'
  | 'connected.reduction'
  | 'connected.linking'
  | 'connected.elision'
  | 'connected.assimilation'

/**
 * Stable, versionable target id, e.g. `segmental.phoneme./θ/`,
 * `segmental.contrast.θ|ð`, `prosody.word-stress`,
 * `prosody.intonation.rising-question`, `connected.reduction.gonna`.
 * Renaming an id is a breaking change to every content file that
 * references it — do not rename casually.
 */
export type PronunciationTargetId = string & { readonly __brand: 'PronunciationTargetId' }

/**
 * Evidence modes that can legitimately establish progress or mastery for a
 * target. `stt_intelligibility` and `acoustic` are the only OBJECTIVE
 * modalities — see `EVIDENCE_CAPABILITY_KINDS` and the mastery-eligibility
 * rule enforced in `registry.ts`.
 */
export type EvidenceCapability =
  | 'perception'
  | 'controlled_production'
  | 'contextual_production'
  | 'stt_intelligibility'
  | 'acoustic'

export const OBJECTIVE_EVIDENCE_CAPABILITIES: readonly EvidenceCapability[] = [
  'stt_intelligibility',
  'acoustic',
]

/**
 * `acoustic` cannot be claimed by any target until plan 071's benchmark
 * ships a validated evaluator (see ADR 064). The registry validator rejects
 * targets that violate this today.
 */
export const UNAVAILABLE_EVIDENCE_CAPABILITIES: readonly EvidenceCapability[] = ['acoustic']

export interface PronunciationTarget {
  id: PronunciationTargetId
  category: PronunciationTargetCategory
  /** Human-readable label for UI/content authoring, not user-facing copy. */
  label: string
  /** Pedagogical sequencing guidance only — never proof of mastery. */
  recommendedCefr: CEFRLevel
  /** Target ids that should be introduced before this one. Must be acyclic. */
  prerequisites: PronunciationTargetId[]
  /** Which evidence modes are meaningful for this target. */
  evidenceCapabilities: EvidenceCapability[]
  /**
   * True when this target can be promoted to "mastered" by progress logic.
   * Must declare at least one objective evidence capability — enforced by
   * `validateTarget`.
   */
  masteryEligible: boolean
  /**
   * For `segmental.contrast` targets only: the two IPA symbols that make up
   * the contrast, in canonical order (see `contrastKey` in
   * `lib/phoneme-practice/phoneme-similarity.ts`).
   */
  contrastPair?: readonly [string, string]
}

export type TargetLookupError =
  | { kind: 'not_found'; id: string }
  | { kind: 'invalid_id_format'; id: string }

export type TargetLookupResult =
  | { ok: true; target: PronunciationTarget }
  | { ok: false; error: TargetLookupError }

export interface TargetValidationIssue {
  targetId: string
  code:
    | 'duplicate_id'
    | 'cycle'
    | 'missing_prerequisite'
    | 'no_objective_capability'
    | 'unavailable_capability'
    | 'invalid_contrast_pair'
  detail: string
}
