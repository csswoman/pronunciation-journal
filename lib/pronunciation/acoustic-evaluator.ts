/**
 * Provider-neutral contract for an acoustic pronunciation evaluator.
 *
 * NOT WIRED TO PRODUCTION. This is spike groundwork from plan 064 — no
 * implementation of `AcousticEvaluator` exists yet (no forced aligner, no
 * vendor). See `docs/architecture/adr-064-acoustic-pronunciation-assessment.md`
 * for why: no consented/licensed benchmark corpus and no approved vendor.
 *
 * The point of this interface is that learning code can depend on
 * `AcousticEvaluator` and swap the underlying implementation (a real forced
 * aligner, a vendor API, or a test fake) without changing callers. STT
 * transcript is explicitly one *input*, never treated as ground truth for
 * acoustic dimensions — see plan 064 STOP conditions.
 */

import type { SpokenAttemptOutcome } from './spoken-attempt'

/** Which acoustic dimension a score applies to. See ADR 064 Step 2 rubric. */
export type AcousticDimension = 'segmental' | 'wordStress' | 'rhythm' | 'intonation'

/** Opaque handle to audio the evaluator can access — never raw bytes in this type. */
export interface AudioRef {
  uri: string
  durationMs: number
}

export interface AcousticEvaluationInput {
  audio: AudioRef
  targetText: string
  /** STT transcript, provided as auxiliary context only — not ground truth. */
  transcript: string
  /** Which dimensions to score. An evaluator may abstain on any subset. */
  dimensions: AcousticDimension[]
}

/** A span of evidence (e.g. a timestamp range) backing a dimension score. */
export interface EvidenceSpan {
  startMs: number
  endMs: number
  label: string
}

export interface DimensionScore {
  dimension: AcousticDimension
  /** 0-100. Meaningless when `abstained` is true — callers must check `abstained` first. */
  score: number
  /** 0-1 calibrated confidence. */
  confidence: number
  /** True when the evaluator declines to score this dimension (see ADR 064 Step 2 abstention rules). */
  abstained: boolean
  /** Why abstained, if `abstained` is true (e.g. "low_snr", "clip_too_short"). */
  abstainReason?: string
  evidenceSpans: EvidenceSpan[]
}

export interface AcousticEvaluationResult {
  /** Discriminated union member — mirrors `SpokenAttempt.scoreKind`'s pattern so new evaluator families can be added without breaking switches on this field. */
  evaluatorKind: 'forced_alignment' | 'vendor_api'
  evaluatorVersion: string
  dimensionScores: DimensionScore[]
  /** Overall outcome classification, reusing the same vocabulary as SpokenAttempt. */
  outcome: SpokenAttemptOutcome
}

export interface AcousticEvaluator {
  evaluate(input: AcousticEvaluationInput): Promise<AcousticEvaluationResult>
}

/**
 * Thin helper proving learning-facing code can consume any AcousticEvaluator
 * without knowing which implementation is behind it. Not used in production.
 */
export async function scoreWithEvaluator(
  evaluator: AcousticEvaluator,
  input: AcousticEvaluationInput
): Promise<AcousticEvaluationResult> {
  return evaluator.evaluate(input)
}
