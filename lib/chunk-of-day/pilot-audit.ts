import type { DailyPlan } from '@/lib/practice/types'
import type { LearningChunk } from './types'

/** Editorial planning target, not a learner-progress threshold. */
export const PLANNED_CHUNK_ACTION_TARGET = 0.7

export interface ChunkPilotAudit {
  chunkCount: number
  a1ChunkCount: number
  linkedChunkCount: number
  pronunciationLinkedChunkCount: number
  dialogueReadyChunkCount: number
  ipaReadyChunkCount: number
  issues: string[]
}

/** Structural editorial audit only. It never promotes completion to mastery. */
export function auditA1ChunkPilot(chunks: readonly LearningChunk[]): ChunkPilotAudit {
  const issues: string[] = []
  if (chunks.length < 25 || chunks.length > 40) issues.push('pilot_count_out_of_range')
  for (const chunk of chunks) {
    if (chunk.learning.cefr !== 'A1') issues.push(`non_a1:${chunk.id}`)
    if (chunk.contentGraph.anchors.length === 0) issues.push(`missing_anchor:${chunk.id}`)
    if (!chunk.learning.practiceAnswer) issues.push(`missing_practice_answer:${chunk.id}`)
    if ((chunk.example_dialogue?.length ?? 0) < 2) issues.push(`missing_microdialogue:${chunk.id}`)
    if (!chunk.ipa.trim()) issues.push(`missing_phrase_ipa:${chunk.id}`)
  }
  return {
    chunkCount: chunks.length,
    a1ChunkCount: chunks.filter((chunk) => chunk.learning.cefr === 'A1').length,
    linkedChunkCount: chunks.filter((chunk) => chunk.contentGraph.anchors.length > 0).length,
    pronunciationLinkedChunkCount: chunks.filter((chunk) => chunk.contentGraph.pronunciationTargetIds.length > 0).length,
    dialogueReadyChunkCount: chunks.filter((chunk) => (chunk.example_dialogue?.length ?? 0) >= 2).length,
    ipaReadyChunkCount: chunks.filter((chunk) => chunk.ipa.trim() !== '').length,
    issues,
  }
}

export function observedChunkActionShare(plan: DailyPlan): number | null {
  const mix = plan.contentMix
  if (!mix) return null
  const total = mix.chunkActions + mix.wordOrSoundActions
  return total === 0 ? null : mix.chunkActions / total
}

export interface PlannedChunkMixAssessment {
  targetShare: number
  chunkActionShare: number | null
  status: 'on_target' | 'below_target' | 'not_applicable'
}

/**
 * Evaluates plan composition only. `below_target` is a calibration signal for
 * an aggregate pilot review, never a failure or a learner-facing judgment for
 * one short session.
 */
export function assessPlannedChunkMix(plan: DailyPlan): PlannedChunkMixAssessment {
  const chunkActionShare = observedChunkActionShare(plan)
  if (chunkActionShare === null) {
    return { targetShare: PLANNED_CHUNK_ACTION_TARGET, chunkActionShare, status: 'not_applicable' }
  }
  return {
    targetShare: PLANNED_CHUNK_ACTION_TARGET,
    chunkActionShare,
    status: chunkActionShare >= PLANNED_CHUNK_ACTION_TARGET ? 'on_target' : 'below_target',
  }
}

export interface PlannedChunkMixReport {
  /** New and review actions are plan composition, not learner completion. */
  newChunkActions: number
  reviewChunkActions: number
  /** Exercise modes proposed inside chunk steps, for editorial calibration. */
  exercisesByMode: Record<string, number>
}

export interface PilotCoverageReport {
  chunksByCommunicativeFunction: Record<string, number>
  chunksBySituationCategory: Record<string, number>
  /** Functions with a single authored chunk deserve editorial review before expansion. */
  thinCommunicativeFunctions: string[]
  /** Situation categories with a single authored chunk deserve editorial review before expansion. */
  thinSituationCategories: string[]
}

function countBy(chunks: readonly LearningChunk[], keyFor: (chunk: LearningChunk) => string): Record<string, number> {
  return chunks.reduce<Record<string, number>>((counts, chunk) => {
    const key = keyFor(chunk)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}

/**
 * Editorial coverage only: a thin group is a prompt for review, never proof
 * that a learner lacks a skill or that a situation is inherently uncovered.
 */
export function pilotCoverageReport(chunks: readonly LearningChunk[]): PilotCoverageReport {
  const chunksByCommunicativeFunction = countBy(chunks, (chunk) => chunk.learning.communicativeFunction)
  const chunksBySituationCategory = countBy(chunks, (chunk) => chunk.category)
  const thinKeys = (counts: Record<string, number>) => Object.entries(counts)
    .filter(([, count]) => count === 1)
    .map(([key]) => key)
    .sort()

  return {
    chunksByCommunicativeFunction,
    chunksBySituationCategory,
    thinCommunicativeFunctions: thinKeys(chunksByCommunicativeFunction),
    thinSituationCategories: thinKeys(chunksBySituationCategory),
  }
}

/**
 * Makes the planned new/review balance and exercise ladder inspectable before
 * collecting pilot behaviour. It deliberately has no learner-success fields.
 */
export function plannedChunkMixReport(plan: DailyPlan): PlannedChunkMixReport {
  const report: PlannedChunkMixReport = {
    newChunkActions: 0,
    reviewChunkActions: 0,
    exercisesByMode: {},
  }
  for (const step of plan.steps) {
    if (step.kind !== 'chunk_intro' && step.kind !== 'chunk_review') continue
    const actions = step.exercises.length + (step.chunks?.length ?? 0)
    if (step.kind === 'chunk_intro') report.newChunkActions += actions
    else report.reviewChunkActions += actions
    for (const exercise of step.exercises) {
      report.exercisesByMode[exercise.slug] = (report.exercisesByMode[exercise.slug] ?? 0) + 1
    }
  }
  return report
}
