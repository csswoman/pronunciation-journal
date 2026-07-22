/**
 * Versioned result schema for the oral pronunciation diagnostic (plan 067).
 *
 * This schema is deliberately separate from `lib/courses/assessment-schema.ts`
 * (CEFR grammar placement) — different domain, different evidence model.
 *
 * Core distinctions this schema enforces (see `types.ts` for the building
 * blocks):
 * - `not_measured` (abstention — no evaluator exists for this dimension yet)
 *   is never conflated with `failed` (evaluator ran, errored) or a genuine
 *   `low_score` (evaluator ran, produced a real low number).
 * - A numeric score can only be claimed by a target/signal combination that
 *   is actually backed by an available, objective evaluator. Prosody
 *   categories and the `acoustic` capability (gated behind plan 071) can
 *   never carry a score in this schema version.
 * - Evaluator kind + version must be present whenever a measurement was
 *   actually attempted (`scored` or `failed`); `not_measured` targets carry
 *   `evaluatorKind: null` / `evaluatorVersion: null` because nothing ran.
 */

import { z } from 'zod'
import { getTarget } from '@/lib/pronunciation/targets/registry'
import { CapabilitySnapshotSchema, SelfReportSchema, TargetResultSchema } from './types'

export * from './types'

// ---------------------------------------------------------------------------
// Five-session prescription
// ---------------------------------------------------------------------------

export const PrescriptionSessionStyleSchema = z.enum(['drill', 'perception', 'transfer'])

export type PrescriptionSessionStyle = z.infer<typeof PrescriptionSessionStyleSchema>

export const PrescriptionSessionSchema = z
  .object({
    targetId: z.string().min(1),
    reason: z.string().trim().min(1).max(300),
    style: PrescriptionSessionStyleSchema,
  })
  .strict()

export type PrescriptionSession = z.infer<typeof PrescriptionSessionSchema>

export const PronunciationWeekPrescriptionSchema = z
  .object({
    generatedAt: z.iso.datetime({ offset: true }),
    sessions: z
      .array(PrescriptionSessionSchema)
      .length(5, 'a diagnostic prescription must contain exactly five sessions'),
  })
  .strict()
  .refine((prescription) => prescription.sessions.some((s) => s.style === 'transfer'), {
    message: 'at least one session must be a transfer-style session (contextual/phrase-level)',
    path: ['sessions'],
  })

export type PronunciationWeekPrescription = z.infer<typeof PronunciationWeekPrescriptionSchema>

// ---------------------------------------------------------------------------
// Top-level diagnostic result
// ---------------------------------------------------------------------------

export const PronunciationDiagnosticResultSchema = z
  .object({
    userId: z.string().min(1),
    completedAt: z.iso.datetime({ offset: true }),
    capabilitySnapshot: CapabilitySnapshotSchema,
    selfReport: SelfReportSchema,
    targetResults: z.array(TargetResultSchema).min(1).max(50),
    prescription: PronunciationWeekPrescriptionSchema,
  })
  .strict()
  .refine(
    (result) => result.targetResults.filter((r) => r.status === 'priority').length <= 3,
    {
      message: 'at most 3 targets may have status "priority"',
      path: ['targetResults'],
    }
  )

export type PronunciationDiagnosticResult = z.infer<typeof PronunciationDiagnosticResultSchema>

// ---------------------------------------------------------------------------
// Registry cross-validation (unknown target ids) — separate from Zod shape
// validation because the registry lookup is a plain synchronous function,
// not expressible as a reusable schema without importing registry state into
// every schema-only consumer.
// ---------------------------------------------------------------------------

export interface DiagnosticValidationIssue {
  code: 'unknown_target_id' | 'schema_invalid'
  detail: string
  path?: (string | number)[]
}

export type DiagnosticValidationResult =
  | { ok: true; result: PronunciationDiagnosticResult }
  | { ok: false; issues: DiagnosticValidationIssue[] }

/**
 * Validates a candidate diagnostic result against both the Zod schema and
 * the pronunciation target registry (rejecting unknown/unresolvable target
 * ids referenced by `targetResults` or `prescription.sessions`).
 */
export function validateDiagnosticResult(candidate: unknown): DiagnosticValidationResult {
  const parsed = PronunciationDiagnosticResultSchema.safeParse(candidate)
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        code: 'schema_invalid',
        detail: issue.message,
        path: issue.path as (string | number)[],
      })),
    }
  }

  const issues: DiagnosticValidationIssue[] = []

  for (const [index, targetResult] of parsed.data.targetResults.entries()) {
    const lookup = getTarget(targetResult.targetId)
    if (!lookup.ok) {
      issues.push({
        code: 'unknown_target_id',
        detail: `targetResults[${index}].targetId "${targetResult.targetId}" is not a known pronunciation target`,
        path: ['targetResults', index, 'targetId'],
      })
    }
  }

  for (const [index, session] of parsed.data.prescription.sessions.entries()) {
    const lookup = getTarget(session.targetId)
    if (!lookup.ok) {
      issues.push({
        code: 'unknown_target_id',
        detail: `prescription.sessions[${index}].targetId "${session.targetId}" is not a known pronunciation target`,
        path: ['prescription', 'sessions', index, 'targetId'],
      })
    }
  }

  if (issues.length > 0) return { ok: false, issues }
  return { ok: true, result: parsed.data }
}
