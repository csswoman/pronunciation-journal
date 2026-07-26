import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

/**
 * Signals that the current product can present honestly.  This is separate
 * from the registry capabilities: a target may support a capability without
 * the active evaluator being able to measure it today.
 */
export type PronunciationFeedbackSignal =
  | {
      kind: 'stt_intelligibility'
      evaluatorVersion: string
      confidence: number
      transcript: string
      recognizedPercent: number
    }
  | {
      kind: 'transcript_phoneme_inference'
      evaluatorVersion: string
      confidence: number
      transcript: string
      /** Dictionary projection over transcript text; never an acoustic claim. */
      inferredContrast?: { expected: string; observed?: string }
    }
  | {
      kind: 'unscored'
      reason: 'empty_transcript' | 'evaluator_unavailable' | 'evaluator_failed' | 'skipped'
    }

export type FeedbackOutcome = 'improved' | 'same' | 'needs_more_evidence' | 'unscored'

export interface FeedbackTargetCandidate {
  targetId: string
  confidence: number
  /** Higher values represent a lesson/mission target or a repeated observation. */
  relevance?: number
  recurrence?: number
  expected?: string
  observed?: string
  cueEs?: string
}

export interface FeedbackPriority {
  targetId: PronunciationTargetId
  expected?: string
  observed?: string
  cueEs?: string
}

export interface PronunciationFeedbackModel {
  version: 1
  signal: PronunciationFeedbackSignal
  outcome: FeedbackOutcome
  priority: FeedbackPriority | null
  /** Spanish, signal-honest summary intended for every UI adapter. */
  summaryEs: string
  reviewRecommended: boolean
}
