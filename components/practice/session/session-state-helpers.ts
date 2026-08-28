import type {
  ExerciseResult,
  PracticeExercise,
} from '@/lib/practice/types'
import { ATTRIBUTION_VERSION } from '@/lib/practice/attribution'
import { resolveAnswerAttribution } from '@/lib/practice/resolve-attribution'

export const FEEDBACK_MS = 1500

export type SessionPhase = 'exercising' | 'feedback' | 'hints' | 'complete'

/**
 * `saved_local`: the session and its answers are durably in Dexie, but the
 * outbox flush left work pending or failed remotely — never call this "synced".
 * `synced`: this flush pass confirmed every operation it processed.
 * `error` (from an answer enqueue failure) is sticky: a later flush outcome
 * must never silently overwrite it with a success state (plan 061 step 6).
 */
export type ProgressSaveStatus = 'idle' | 'saving' | 'saved_local' | 'synced' | 'error'

export function buildExerciseResult(params: {
  current: PracticeExercise
  isCorrect: boolean
  userAnswer: string
  timeMs: number
  context: ExerciseResult['context']
  extras?: import('@/lib/practice/types').PracticeSubmitExtras
}): ExerciseResult {
  const { current, isCorrect, userAnswer, timeMs, context, extras } = params
  const attribution = resolveAnswerAttribution(current, isCorrect, extras?.score)
  const status = extras?.status ?? (userAnswer === 'skip' ? 'skipped' : 'answered')
  const responseTimeMs = extras?.responseTimeMs ?? timeMs

  return {
    exerciseId: current.id,
    slug: current.slug,
    exerciseTypeId: current.exerciseTypeId,
    isCorrect,
    userAnswer,
    timeMs: responseTimeMs,
    status,
    responseTimeMs,
    totalInteractionMs: extras?.totalInteractionMs,
    firstTryFailed: extras?.firstTryFailed,
    score: extras?.score,
    feedback: extras?.feedback,
    contentId: current.contentId,
    context,
    soundId: current.soundId,
    sourceRef: current.sourceRef,
    topic: current.payload.kind === 'generic' ? current.payload.data.topic : undefined,
    attribution,
    attributionVersion: ATTRIBUTION_VERSION,
    exercisePayload:
      current.payload.kind === 'phoneme'
        ? {
            type: current.slug,
            soundId: current.soundId,
            options: current.payload.options,
            targetWord: current.payload.targetWord,
            contrastId: current.contrastId,
            status,
            firstTryFailed: extras?.firstTryFailed,
          }
        : {
            type: current.slug,
            contentId: current.contentId,
            constraintId:
              current.payload.kind === 'generic'
                ? ((current.payload.data as { constraintId?: string; constraint?: { id?: string } }).constraintId ??
                   (current.payload.data as { constraintId?: string; constraint?: { id?: string } }).constraint?.id)
                : undefined,
            feedbackCategory: extras?.feedback?.category,
            errorCode: extras?.feedback?.errorCode,
            expectedAnswer: extras?.feedback?.expectedAnswer,
            hintUsed: extras?.feedback?.category?.includes('hint_used') || undefined,
            nextAction: extras?.feedback?.nextAction,
            status,
            firstTryFailed: extras?.firstTryFailed,
          },
    completedAt: new Date(),
  }
}
