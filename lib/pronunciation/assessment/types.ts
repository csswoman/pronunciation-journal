/**
 * Zod building blocks for the pronunciation diagnostic result (plan 067,
 * step 1). Split from `schema.ts` to stay under the 250-line file limit —
 * this file owns capability snapshot, self-report, evaluator identity,
 * measurement (the not_measured / failed / scored trichotomy), and
 * per-target results. `schema.ts` composes these into the prescription and
 * top-level diagnostic result, plus registry cross-validation.
 */

import { z } from 'zod'
import { UNAVAILABLE_EVIDENCE_CAPABILITIES } from '@/lib/pronunciation/targets/types'

/** Prosody categories that may never receive a numeric/acoustic score in this schema version. */
const PROSODY_ONLY_TARGET_PREFIXES = [
  'prosody.word-stress',
  'prosody.sentence-stress',
  'prosody.rhythm',
  'prosody.intonation',
] as const

function isProsodyOnlyTargetId(targetId: string): boolean {
  return PROSODY_ONLY_TARGET_PREFIXES.some(
    (prefix) => targetId === prefix || targetId.startsWith(`${prefix}.`)
  )
}

// ---------------------------------------------------------------------------
// Capability snapshot — what was actually possible during this diagnostic run
// ---------------------------------------------------------------------------

export const CapabilitySnapshotSchema = z
  .object({
    micPermission: z.enum(['granted', 'denied', 'prompt', 'unknown']),
    sttAvailable: z.boolean(),
    browserSupport: z.enum(['full', 'partial', 'unsupported']),
    capturedAt: z.iso.datetime({ offset: true }),
  })
  .strict()

export type CapabilitySnapshot = z.infer<typeof CapabilitySnapshotSchema>

// ---------------------------------------------------------------------------
// Self-report — subjective learner input, distinct from measured evidence
// ---------------------------------------------------------------------------

export const SelfReportSchema = z
  .object({
    overallConfidence: z.enum(['not_confident', 'somewhat_confident', 'confident']),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict()

export type SelfReport = z.infer<typeof SelfReportSchema>

// ---------------------------------------------------------------------------
// Evaluator identity
// ---------------------------------------------------------------------------

export const EvaluatorKindSchema = z.enum(['stt_intelligibility', 'acoustic', 'self_report_only'])

export type EvaluatorKind = z.infer<typeof EvaluatorKindSchema>

export const SignalTypeSchema = z.enum([
  'stt_intelligibility',
  'acoustic',
  'perception',
  'self_report',
])

export type SignalType = z.infer<typeof SignalTypeSchema>

// ---------------------------------------------------------------------------
// Abstention / failure reasons
// ---------------------------------------------------------------------------

export const AbstentionReasonSchema = z.enum([
  'no_evaluator_available',
  'mic_permission_denied',
  'stt_unavailable',
  'browser_unsupported',
  'skipped_by_user',
])

export type AbstentionReason = z.infer<typeof AbstentionReasonSchema>

export const FailureReasonSchema = z.enum([
  'stt_error',
  'empty_transcript',
  'mic_error',
  'timeout',
  'unknown_error',
])

export type FailureReason = z.infer<typeof FailureReasonSchema>

// ---------------------------------------------------------------------------
// Measurement — the three non-conflatable outcomes for a target
// ---------------------------------------------------------------------------

const NotMeasuredMeasurementSchema = z
  .object({
    kind: z.literal('not_measured'),
    abstentionReason: AbstentionReasonSchema,
  })
  .strict()

const FailedMeasurementSchema = z
  .object({
    kind: z.literal('failed'),
    failureReason: FailureReasonSchema,
  })
  .strict()

const ScoredMeasurementSchema = z
  .object({
    kind: z.literal('scored'),
    /** 0-100 scale, consistent with `SpokenAttempt.overallScore`. */
    score: z.number().min(0).max(100),
  })
  .strict()

export const MeasurementSchema = z.discriminatedUnion('kind', [
  NotMeasuredMeasurementSchema,
  FailedMeasurementSchema,
  ScoredMeasurementSchema,
])

export type Measurement = z.infer<typeof MeasurementSchema>

// ---------------------------------------------------------------------------
// Target result
// ---------------------------------------------------------------------------

export const TargetResultStatusSchema = z.enum(['observed', 'needs_evidence', 'strength', 'priority'])

export type TargetResultStatus = z.infer<typeof TargetResultStatusSchema>

export const TargetResultSchema = z
  .object({
    /** Canonical target id — validated against the registry by `validateDiagnosticResult`, not by shape alone. */
    targetId: z.string().min(1),
    status: TargetResultStatusSchema,
    signalType: SignalTypeSchema,
    confidence: z.number().min(0).max(1),
    /** Null only when `measurement.kind === 'not_measured'` — nothing ran. */
    evaluatorKind: EvaluatorKindSchema.nullable(),
    evaluatorVersion: z.string().min(1).nullable(),
    measurement: MeasurementSchema,
  })
  .strict()
  .superRefine((result, ctx) => {
    const attempted = result.measurement.kind === 'scored' || result.measurement.kind === 'failed'

    if (attempted) {
      if (result.evaluatorKind === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['evaluatorKind'],
          message: 'evaluatorKind is required when a measurement was attempted (scored or failed)',
        })
      }
      if (result.evaluatorVersion === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['evaluatorVersion'],
          message: 'evaluatorVersion is required when a measurement was attempted (scored or failed)',
        })
      }
    }

    if (result.measurement.kind === 'scored') {
      if (UNAVAILABLE_EVIDENCE_CAPABILITIES.includes(result.signalType as never)) {
        ctx.addIssue({
          code: 'custom',
          path: ['measurement', 'score'],
          message: `cannot claim a numeric score for unavailable capability "${result.signalType}" (see UNAVAILABLE_EVIDENCE_CAPABILITIES)`,
        })
      }
      if (isProsodyOnlyTargetId(result.targetId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['measurement', 'score'],
          message: `target "${result.targetId}" is a prosody-only category (stress/rhythm/intonation) and may never carry a numeric score in this schema version — use not_measured with a self-report instead`,
        })
      }
    }
  })

export type TargetResult = z.infer<typeof TargetResultSchema>
