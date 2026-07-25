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
import {
  isProsodyOnlyTargetId,
  type EvaluatorKind,
  type Measurement,
  type TargetResult,
  type TargetResultStatus,
} from './types'

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
 * Perception is evaluated by the deterministic forced-choice key, not STT:
 * no speech or acoustic evaluator ran. Its distinct evaluator kind prevents
 * downstream consumers from treating a perception result as speech evidence.
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

  // Prosody-only targets cannot carry a numeric score in this schema version
  // (see TargetResultSchema). Without audio discrimination we only keep a
  // self-report abstention — never a fake forced-choice score.
  // Confidence encodes direction so prescription can seed Day 1:
  // struggle ("Me cuesta") > comfort ("Me desenvuelvo bien") > skip (0).
  if (isProsodyOnlyTargetId(selection.targetId)) {
    return {
      ...buildResult({
        targetId: selection.targetId,
        signalType: 'self_report',
        measurement: { kind: 'not_measured', abstentionReason: 'no_evaluator_available' },
        evaluatorKind: null,
        evaluatorVersion: null,
      }),
      confidence: answer.correct ? 0.15 : 0.4,
    }
  }

  return buildResult({
    targetId: selection.targetId,
    signalType: 'perception',
    measurement: { kind: 'scored', score: answer.correct ? 100 : 0 },
    evaluatorKind: 'perception_forced_choice',
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

  // Explicit skip always wins over structural abstention — same user action
  // should read as "La saltaste" in evidence, even on prosody-only targets.
  if (attempt.outcome === 'skipped') {
    return buildResult({
      targetId: selection.targetId,
      signalType,
      measurement: { kind: 'not_measured', abstentionReason: 'skipped_by_user' },
      evaluatorKind: null,
      evaluatorVersion: null,
    })
  }

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
    // 'skipped' is handled above so it wins over structural abstention.
  }
}
