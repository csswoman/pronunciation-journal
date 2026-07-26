import { contrastTargetId, getTarget, phonemeTargetId } from '@/lib/pronunciation/targets/registry'
import type { WordResult } from '@/lib/types'
import { buildPronunciationFeedback } from './model'
import type { FeedbackTargetCandidate, PronunciationFeedbackModel } from './types'

function ipa(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : null
}

/**
 * Converts dictionary-projected word alignments to registry candidates. It
 * never treats the projection as an acoustic observation: it is only useful
 * where the expected/recognized IPA pair maps to an already-known target.
 */
export function candidatesFromWordResults(wordResults: readonly WordResult[]): FeedbackTargetCandidate[] {
  const candidates: FeedbackTargetCandidate[] = []
  for (const word of wordResults) {
    for (const alignment of word.phonemes?.alignment ?? []) {
      if (alignment.status === 'correct') continue
      const expected = ipa(alignment.ipa ?? alignment.phoneme)
      const observed = ipa(alignment.gotIpa ?? alignment.got)
      if (!expected) continue

      const contrastId = observed ? contrastTargetId(expected, observed) : null
      const targetId = contrastId && getTarget(contrastId).ok
        ? contrastId
        : expected === '/ə/' && getTarget(phonemeTargetId(expected)).ok
          ? phonemeTargetId(expected)
          : null
      if (!targetId) continue

      candidates.push({
        targetId,
        confidence: 0.8,
        relevance: 1,
        recurrence: 0,
        expected,
        observed: observed ?? undefined,
      })
    }
  }
  return candidates
}

export function feedbackFromScoringResult(input: {
  accuracy: number
  transcript: string
  wordResults: readonly WordResult[]
  evaluatorVersion?: string
  previous?: PronunciationFeedbackModel
}): PronunciationFeedbackModel {
  const candidates = candidatesFromWordResults(input.wordResults)
  return buildPronunciationFeedback({
    signal: candidates.length > 0
      ? {
          kind: 'transcript_phoneme_inference',
          evaluatorVersion: input.evaluatorVersion ?? 'legacy-stt-v1',
          confidence: 0.8,
          transcript: input.transcript,
          recognizedPercent: input.accuracy,
          inferredContrast: candidates[0]?.expected
            ? { expected: candidates[0].expected, observed: candidates[0].observed }
            : undefined,
        }
      : {
          kind: 'stt_intelligibility',
          evaluatorVersion: input.evaluatorVersion ?? 'legacy-stt-v1',
          confidence: 0.8,
          transcript: input.transcript,
          recognizedPercent: input.accuracy,
        },
    candidates,
    previous: input.previous,
  })
}
