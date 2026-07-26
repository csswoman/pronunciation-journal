import { getTarget } from '@/lib/pronunciation/targets/registry'
import type { FeedbackPriority, FeedbackTargetCandidate } from './types'

const MIN_CONFIDENCE = 0.6

/** Select exactly one canonical correction, or abstain when the evidence is weak. */
export function prioritizeFeedbackTarget(
  candidates: readonly FeedbackTargetCandidate[],
): FeedbackPriority | null {
  const ranked = candidates
    .filter((candidate) => candidate.confidence >= MIN_CONFIDENCE && getTarget(candidate.targetId).ok)
    .map((candidate) => ({
      candidate,
      score: candidate.confidence * 100 + (candidate.relevance ?? 0) * 10 + (candidate.recurrence ?? 0),
    }))
    .sort((a, b) => b.score - a.score || a.candidate.targetId.localeCompare(b.candidate.targetId))

  const winner = ranked[0]?.candidate
  if (!winner) return null

  return {
    targetId: winner.targetId as FeedbackPriority['targetId'],
    expected: winner.expected,
    observed: winner.observed,
    cueEs: winner.cueEs,
  }
}
