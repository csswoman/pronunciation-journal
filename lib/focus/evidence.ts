import { ATTRIBUTION_VERSION, attributeSingleTarget, nonSrsAttribution, topicId } from '@/lib/practice/attribution'
import type { ExerciseResult, PracticeAnswer } from '@/lib/practice/types'
import type { DailyStep } from '@/lib/practice/types'
import type { FocusContent } from './types'

/** A Focus target is safe only when this asset was generated for one gap. */
export function focusTargetId(content: Pick<FocusContent, 'gapIds'>): string | null {
  const target = content.gapIds.length === 1 ? content.gapIds[0] : null
  // Focus currently generates generic written exercises. A phoneme/contrast
  // gap lacks a canonical scored sound target here, so it remains activity.
  return target?.startsWith('grammar:') ? target : null
}

/**
 * Adds Focus provenance to an evaluated result without inventing a target.
 * Song STT is deliberately activity-only: word recognition is not phoneme or
 * rhythm evaluation, even when the surrounding content has a single gap.
 */
export function withFocusEvidence(
  content: FocusContent,
  result: ExerciseResult,
  options: { attemptId: string; allowTarget: boolean },
): ExerciseResult {
  const target = options.allowTarget ? focusTargetId(content) : null
  const payload = {
    ...(result.exercisePayload && typeof result.exercisePayload === 'object' ? result.exercisePayload : {}),
    focusContentId: content.id,
    focusTargetId: target ?? undefined,
  }

  return {
    ...result,
    attemptId: options.attemptId,
    context: 'practice',
    topic: target ?? undefined,
    attribution: target
      ? attributeSingleTarget({ target: { namespace: 'topic', id: topicId(target) }, correct: result.isCorrect })
      : nonSrsAttribution('no_target', 'Focus content has no single canonical target'),
    attributionVersion: ATTRIBUTION_VERSION,
    exercisePayload: payload,
  }
}

export function focusTargetRefs(results: readonly PracticeAnswer[]): string[] {
  return [...new Set(results.flatMap((result) => {
    const target = (result.exercisePayload as { focusTargetId?: unknown } | undefined)?.focusTargetId
    return typeof target === 'string' ? [`topic:${target}`] : []
  }))]
}

/** Focus may resolve only a Daily step that declares the same canonical target. */
export function reconcileFocusDailySteps(
  steps: readonly DailyStep[],
  results: readonly ExerciseResult[],
): string[] {
  const targets = new Set(focusTargetRefs(results))
  if (targets.size === 0) return []
  const hasEvaluatedTarget = results.some((result) =>
    result.status === 'answered'
      && typeof (result.exercisePayload as { focusTargetId?: unknown } | undefined)?.focusTargetId === 'string',
  )
  if (!hasEvaluatedTarget) return []
  return steps
    .filter((step) => step.selection?.targetRefs.some((target) => targets.has(target)))
    .map((step) => step.id)
}
