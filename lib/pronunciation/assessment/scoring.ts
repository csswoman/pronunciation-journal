/**
 * Scores a single diagnostic prompt into a `TargetResult` (plan 067, step 4).
 *
 * Two input shapes, one per `DiagnosticStage` family:
 * - `perception` prompts are scored directly from a forced-choice answer —
 *   no `SpokenAttempt` is ever involved, since no speech was evaluated.
 * - `controlled_production` / `contextual_production` prompts are scored
 *   from a `SpokenAttempt`, gated by `mustAbstainFromProductionScore` so a
 *   prosody-only or acoustic-only target can never leak a numeric score
 *   just because STT transcribed the words correctly.
 *
 * Deliberately does NOT rank/prioritize targets — that's plan 067 step 5's
 * job. `status` here is a conservative, single-target classification with
 * no cross-target comparison and never assigns `'priority'`.
 */

import { getTarget } from '@/lib/pronunciation/targets/registry'
import { accuracyFromAttempt, isScorableAttempt, type SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import type { DiagnosticPromptSelection } from './prompt-selection'
import { mustAbstainFromProductionScore } from './scoring-guards'
import type { EvaluatorKind, Measurement, TargetResult, TargetResultStatus } from './types'

/** A learner's answer to a perception (forced-choice discrimination) prompt. */
export interface PerceptionAnswer {
  /** Whether the learner picked the correct option. Objective — not self-report. */
  correct: boolean
}

/** Score threshold above which a scored production attempt counts as a 'strength'. Step 5 owns real thresholding — this is a conservative default. */
const STRENGTH_SCORE_THRESHOLD = 80

/**
 * Status heuristic, intentionally simple (step 5 does real prioritization):
 * - measurement not attempted or errored → 'needs_evidence' (we have nothing to act on)
 * - scored below threshold → 'observed' (we have a data point, not yet a strength)
 * - scored at/above threshold → 'strength'
 * - never 'priority' — that requires cross-target ranking this module doesn't do
 */
function statusFor(measurement: Measurement): TargetResultStatus {
  if (measurement.kind !== 'scored') return 'needs_evidence'
  return measurement.score >= STRENGTH_SCORE_THRESHOLD ? 'strength' : 'observed'
}

/**
 * Confidence heuristic (0-1), intentionally simple:
 * - scored, objective evaluator (stt_intelligibility) → 0.8 (real evidence, single sample)
 * - scored perception (objective forced-choice, single item) → 0.6
 * - failed → 0.2 (we tried, but learned nothing about the skill itself)
 * - not_measured → 0 (no evidence at all)
 */
function confidenceFor(measurement: Measurement, signalType: TargetResult['signalType']): number {
  if (measurement.kind === 'not_measured') return 0
  if (measurement.kind === 'failed') return 0.2
  return signalType === 'stt_intelligibility' ? 0.8 : 0.6
}

function buildResult(params: {
  targetId: string
  signalType: TargetResult['signalType']
  measurement: Measurement
  evaluatorKind: EvaluatorKind | null
  evaluatorVersion: string | null
}): TargetResult {
  const { targetId, signalType, measurement, evaluatorKind, evaluatorVersion } = params
  return {
    targetId,
    status: statusFor(measurement),
    signalType,
    confidence: confidenceFor(measurement, signalType),
    evaluatorKind,
    evaluatorVersion,
    measurement,
  }
}

/**
 * Scores a `perception` prompt directly from the learner's forced-choice
 * answer. Never routes through `SpokenAttempt` — no speech was evaluated,
 * so this is not an STT/acoustic measurement.
 *
 * Evaluator-kind decision: `EvaluatorKindSchema` is a closed enum
 * (`stt_intelligibility | acoustic | self_report_only`) with no dedicated
 * "objective forced-choice" member, yet `TargetResultSchema` requires a
 * non-null `evaluatorKind` whenever a measurement is attempted (scored or
 * failed). `self_report_only` is explicitly wrong here — a forced-choice
 * discrimination task with a correct/incorrect answer is objective, not
 * subjective. `acoustic` is wrong — no acoustic evaluator ran. We record
 * `'stt_intelligibility'` with a distinct, self-describing
 * `evaluatorVersion` ("perception-forced-choice-v1") so downstream
 * consumers can still distinguish "actual speech-to-text ran" from
 * "the forced-choice engine scored this" by evaluatorVersion, while
 * satisfying the schema's closed enum honestly-as-possible. This is a
 * deliberate, narrow choice scoped to this function only — do not reuse
 * this pattern elsewhere without revisiting `EvaluatorKindSchema` itself
 * (adding a real `forced_choice` member is the cleaner long-term fix).
 */
export function scorePerceptionPrompt(
  selection: DiagnosticPromptSelection,
  answer: PerceptionAnswer | null
): TargetResult {
  if (answer === null) {
    return buildResult({
      targetId: selection.targetId,
      signalType: 'perception',
      measurement: { kind: 'not_measured', abstentionReason: 'skipped_by_user' },
      evaluatorKind: null,
      evaluatorVersion: null,
    })
  }

  // See the deliberate evaluatorKind decision documented above this
  // function — evaluatorVersion is the actual signal for "this was
  // forced-choice scoring, not literal STT".
  return buildResult({
    targetId: selection.targetId,
    signalType: 'perception',
    measurement: { kind: 'scored', score: answer.correct ? 100 : 0 },
    evaluatorKind: 'stt_intelligibility',
    evaluatorVersion: 'perception-forced-choice-v1',
  })
}

/**
 * Scores a `controlled_production` / `contextual_production` prompt from a
 * `SpokenAttempt`. Looks up the target to apply the honesty gate
 * (`mustAbstainFromProductionScore`) BEFORE looking at the attempt's
 * outcome/score at all — a prosody-only or acoustic-only target always
 * abstains, no matter how good the transcript was.
 */
export function scoreProductionPrompt(
  selection: DiagnosticPromptSelection,
  attempt: SpokenAttempt
): TargetResult {
  const lookup = getTarget(selection.targetId)
  const signalType = 'stt_intelligibility' as const

  if (!lookup.ok || mustAbstainFromProductionScore(lookup.target)) {
    return buildResult({
      targetId: selection.targetId,
      signalType,
      measurement: { kind: 'not_measured', abstentionReason: 'no_evaluator_available' },
      evaluatorKind: null,
      evaluatorVersion: null,
    })
  }

  switch (attempt.outcome) {
    case 'scored': {
      // Use accuracyFromAttempt/isScorableAttempt per spoken-attempt.ts's
      // own contract rather than reading overallScore directly.
      if (!isScorableAttempt(attempt)) {
        // Defensive: outcome said 'scored' but the guard disagrees. Treat
        // as a failure rather than trusting the raw field.
        return buildResult({
          targetId: selection.targetId,
          signalType,
          measurement: { kind: 'failed', failureReason: 'unknown_error' },
          evaluatorKind: 'stt_intelligibility',
          evaluatorVersion: attempt.evaluatorVersion,
        })
      }
      const score = accuracyFromAttempt(attempt) as number
      return buildResult({
        targetId: selection.targetId,
        signalType,
        measurement: { kind: 'scored', score },
        evaluatorKind: 'stt_intelligibility',
        evaluatorVersion: attempt.evaluatorVersion,
      })
    }
    case 'failed':
      // spoken-attempt.ts doesn't carry a finer error classification than
      // outcome itself, so we fall back to the generic 'unknown_error'
      // reason — a documented choice, not a guess dressed as precision.
      return buildResult({
        targetId: selection.targetId,
        signalType,
        measurement: { kind: 'failed', failureReason: 'unknown_error' },
        evaluatorKind: 'stt_intelligibility',
        evaluatorVersion: attempt.evaluatorVersion,
      })
    case 'unscored':
      return buildResult({
        targetId: selection.targetId,
        signalType,
        measurement: { kind: 'not_measured', abstentionReason: 'stt_unavailable' },
        evaluatorKind: null,
        evaluatorVersion: null,
      })
    case 'skipped':
      return buildResult({
        targetId: selection.targetId,
        signalType,
        measurement: { kind: 'not_measured', abstentionReason: 'skipped_by_user' },
        evaluatorKind: null,
        evaluatorVersion: null,
      })
  }
}
