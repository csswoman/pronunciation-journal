import type { DailyStep } from '@/lib/practice/types'
import type { PracticeContext, SessionResult } from '@/lib/practice/types'

const MIN_PHONEME_ANSWERS = 3
const MIN_ESSENTIAL_WORDS = 3
const WORD_REVIEW_OVERLAP_RATIO = 0.4

function stepContentIds(step: DailyStep): Set<string> {
  return new Set(step.exercises.map((ex) => ex.contentId))
}

function sessionContentIds(result: SessionResult): Set<string> {
  return new Set(result.results.map((r) => r.contentId))
}

function sessionSoundIds(result: SessionResult): Set<number> {
  return new Set(
    result.results.map((r) => r.soundId).filter((id): id is number => id != null),
  )
}

function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (b.size === 0) return 0
  let hits = 0
  for (const id of b) {
    if (a.has(id)) hits++
  }
  return hits / b.size
}

function resolvePhonemeStepIds(steps: DailyStep[], soundId: number): string[] {
  const candidates = [
    `phoneme_focus:${soundId}`,
    `minimal_pairs:${soundId}`,
    `listening:${soundId}`,
  ]
  return candidates.filter((id) => steps.some((s) => s.id === id))
}

/**
 * Marks daily plan steps as "resolved" when equivalent practice happened
 * outside the /daily flow. Returns step ids to persist.
 */
export function reconcileDailySteps(
  steps: DailyStep[],
  result: SessionResult,
  practiceContext: PracticeContext,
): string[] {
  if (practiceContext === 'daily' || result.results.length === 0) return []

  const resolved = new Set<string>()
  const contentIds = sessionContentIds(result)
  const soundIds = sessionSoundIds(result)

  if (practiceContext === 'core-1000' && result.results.length >= MIN_ESSENTIAL_WORDS) {
    if (steps.some((s) => s.id === 'word_review')) resolved.add('word_review')
  }

  for (const soundId of soundIds) {
    const count = result.results.filter((r) => r.soundId === soundId).length
    if (count < MIN_PHONEME_ANSWERS) continue
    for (const id of resolvePhonemeStepIds(steps, soundId)) {
      resolved.add(id)
    }
  }

  for (const step of steps) {
    if (step.kind === 'word_review' || step.kind === 'context_practice') {
      const ratio = overlapRatio(stepContentIds(step), contentIds)
      if (ratio >= WORD_REVIEW_OVERLAP_RATIO) resolved.add(step.id)
    }

    if (step.kind === 'sentence_builder' || step.kind === 'connected_speech') {
      const ratio = overlapRatio(stepContentIds(step), contentIds)
      if (ratio >= WORD_REVIEW_OVERLAP_RATIO) resolved.add(step.id)
    }
  }

  if (practiceContext === 'courses') {
    const concept = steps.find((s) => s.kind === 'concept')
    if (concept) resolved.add(concept.id)
  }

  return [...resolved]
}
