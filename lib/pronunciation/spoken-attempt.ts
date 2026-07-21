/**
 * Honest spoken-attempt contract.
 *
 * A `SpokenAttempt` is the single record produced whenever a user speaks at
 * the app and the app tries to evaluate it — regardless of whether that
 * evaluation actually happened. It exists so consumers (accuracy stats, SRS
 * mastery promotion, future connected-speech/oral-chat features) all agree
 * on one shape and, critically, all agree that only `outcome === 'scored'`
 * attempts may count toward accuracy or mastery.
 *
 * Do NOT persist audio here unless a separate consent/retention feature is
 * designed — this type intentionally has no audio/blob field.
 */

/**
 * Kind of scoring evaluator that produced `overallScore`. A discriminated
 * literal (not a plain `string`) so new evaluator families (e.g. a future
 * phoneme-level or prosody scorer) can be added as additional union members
 * without breaking existing consumers that switch on this field.
 */
export type ScoreKind = 'stt_intelligibility'

/**
 * Why this attempt does or doesn't carry a usable score.
 *
 * - 'scored'   — evaluation ran and `overallScore` is meaningful. The ONLY
 *                outcome allowed to affect accuracy aggregates or SRS mastery.
 * - 'unscored' — evaluation didn't run (e.g. STT unavailable, feature
 *                disabled). Not a pass, not a fail — excluded entirely.
 * - 'skipped'  — the user skipped the prompt without attempting it.
 * - 'failed'   — evaluation was attempted but errored (e.g. STT threw,
 *                empty transcript). Not a silent 0% or 100% — excluded.
 */
export type SpokenAttemptOutcome = 'scored' | 'unscored' | 'skipped' | 'failed'

export interface SpokenAttempt {
  /** Id of the user who produced this attempt. */
  userId: string
  /** The text the user was asked to say. */
  targetText: string
  /** What STT (or equivalent) transcribed from the user's audio, if any. */
  transcript: string
  /** Version tag of the evaluator that produced `overallScore`, e.g. "stt-v1". */
  evaluatorVersion: string
  /** Which evaluator family scored this attempt. */
  scoreKind: ScoreKind
  /**
   * Overall score on a 0-100 scale (matches `ScoringResult.accuracy` in
   * `lib/pronunciation/scoring.ts`, which is already 0-100 — kept consistent
   * so existing scoring code needs no rescaling to produce a SpokenAttempt).
   * Meaningless unless `outcome === 'scored'`; callers must not read it
   * otherwise — use `accuracyFromAttempt` instead of reading this directly.
   */
  overallScore: number
  /** Id of the specific target item (word/phrase/sentence), if tracked. */
  targetId?: string
  /** Id of the minimal-pair/phoneme contrast this attempt exercises, if any. */
  contrastId?: string
  /** Wall-clock duration of the spoken attempt, in milliseconds. */
  durationMs: number
  /** Outcome classification — see `SpokenAttemptOutcome`. */
  outcome: SpokenAttemptOutcome
}

/**
 * Guard: true only when this attempt is eligible to affect accuracy
 * aggregates or signal SRS mastery promotion. Every other outcome
 * ('unscored' | 'skipped' | 'failed') must be excluded, not treated as a
 * pass or a fail.
 */
export function isScorableAttempt(attempt: SpokenAttempt): boolean {
  return attempt.outcome === 'scored'
}

/**
 * Extracts the accuracy contribution of a single attempt.
 *
 * Returns the 0-100 score for a 'scored' attempt, or `null` for any other
 * outcome. `null` means "exclude from aggregation" — callers must filter
 * out nulls rather than coercing them to 0 or 100.
 */
export function accuracyFromAttempt(attempt: SpokenAttempt): number | null {
  return isScorableAttempt(attempt) ? attempt.overallScore : null
}
