import type { DailyStep, ExerciseResult, PracticeContext, SessionResult } from '@/lib/practice/types'

const MIN_PHONEME_ANSWERS = 3
const OBJECTIVE_OVERLAP_RATIO = 0.4

const EXERCISE_RECONCILABLE_KINDS = new Set<DailyStep['kind']>([
  'word_review',
  'context_practice',
  'sentence_builder',
  'connected_speech',
  'false_friends',
  'grammar_focus',
  'chunk_review',
  'ed_cluster_drill',
])

function isEvaluable(result: ExerciseResult): boolean {
  return result.status === 'answered' || (result.status === undefined && result.userAnswer !== 'skip')
}

/** A source row is the canonical target; legacy content ids are only comparable without provenance. */
function objectiveIdentity(item: { contentId: string; sourceRef?: { source: string; id: string } }): string | null {
  if (item.sourceRef) return `${item.sourceRef.source}:${item.sourceRef.id}`
  return item.contentId || null
}

function matchingObjectiveCount(step: DailyStep, results: ExerciseResult[]): { matched: number; total: number } {
  const stepWithSource = step.exercises.filter((exercise) => exercise.sourceRef)
  const resultWithSource = results.filter((result) => result.sourceRef)
  const targets = new Set<string>()
  const answers = new Set<string>()

  if (stepWithSource.length > 0 || resultWithSource.length > 0) {
    for (const exercise of stepWithSource) {
      const identity = objectiveIdentity(exercise)
      if (identity) targets.add(identity)
    }
    for (const result of resultWithSource) {
      const identity = objectiveIdentity(result)
      if (identity) answers.add(identity)
    }
  } else {
    for (const exercise of step.exercises) {
      const identity = objectiveIdentity(exercise)
      if (identity) targets.add(identity)
    }
    for (const result of results) {
      const identity = objectiveIdentity(result)
      if (identity) answers.add(identity)
    }
  }

  let matched = 0
  for (const target of targets) if (answers.has(target)) matched++
  return { matched, total: targets.size }
}

function resolvesExerciseStep(step: DailyStep, results: ExerciseResult[]): boolean {
  if (!EXERCISE_RECONCILABLE_KINDS.has(step.kind) || step.exercises.length === 0) return false
  const { matched, total } = matchingObjectiveCount(step, results)
  return total > 0 && matched / total >= OBJECTIVE_OVERLAP_RATIO
}

function resolvePhonemeStepIds(steps: DailyStep[], soundId: number): string[] {
  const candidates = [`phoneme_focus:${soundId}`, `minimal_pairs:${soundId}`, `listening:${soundId}`]
  return candidates.filter((id) => steps.some((step) => step.id === id))
}

/** Marks daily steps as resolved only after equivalent, evaluated external practice. */
export function reconcileDailySteps(
  steps: DailyStep[],
  result: SessionResult,
  practiceContext: PracticeContext,
  metadata: { lessonSlug?: string; dailyTargetId?: string; immersionLessonId?: string } = {},
): string[] {
  if (practiceContext === 'daily' || result.results.length === 0) return []

  const evaluatedResults = result.results.filter(isEvaluable)
  if (evaluatedResults.length === 0) return []
  const resolved = new Set<string>()

  for (const soundId of new Set(evaluatedResults.flatMap((entry) => entry.soundId == null ? [] : [entry.soundId]))) {
    const distinctAnswers = new Set(
      evaluatedResults.filter((entry) => entry.soundId === soundId).map(objectiveIdentity).filter((identity): identity is string => identity != null),
    )
    if (distinctAnswers.size >= MIN_PHONEME_ANSWERS) {
      for (const id of resolvePhonemeStepIds(steps, soundId)) resolved.add(id)
    }
  }

  for (const step of steps) if (resolvesExerciseStep(step, evaluatedResults)) resolved.add(step.id)

  if (practiceContext === 'courses') {
    const candidates = new Set<string>()
    if (metadata.dailyTargetId) {
      candidates.add(`study_deck:${metadata.dailyTargetId}`)
      candidates.add(`concept:${metadata.dailyTargetId}`)
    }
    if (metadata.lessonSlug) {
      candidates.add(`concept:${metadata.lessonSlug}`)
      for (const step of steps) {
        if (step.kind === 'study_deck' && step.id.endsWith(`:${metadata.lessonSlug}`)) candidates.add(step.id)
      }
    }
    for (const step of steps) {
      if ((step.kind === 'concept' || step.kind === 'study_deck') && candidates.has(step.id)) resolved.add(step.id)
    }
  }

  if (metadata.immersionLessonId) {
    const hasExactImmersionEvidence = evaluatedResults.some((result) => {
      const payload = result.exercisePayload as { immersionLessonId?: unknown } | undefined
      return payload?.immersionLessonId === metadata.immersionLessonId
    })
    const dailyStepId = `immersion_lesson:${metadata.immersionLessonId}`
    if (hasExactImmersionEvidence && steps.some((step) => step.id === dailyStepId)) {
      resolved.add(dailyStepId)
    }
  }

  return [...resolved]
}
