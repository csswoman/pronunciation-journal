// Extracted from SpeakReviewCard.tsx to keep that file under the project's
// line-count convention. Bridges its two existing grading paths (speech
// accuracy scoring, and the mic-unavailable self-grade fallback) into a
// single AttemptOutcome — speak_sentence has no hint ladder or typo concept
// (spoken input isn't compared character-by-character), so this is a pure
// mapping, not a stateful hook despite the filename's `use` prefix (kept for
// naming symmetry with the card's other collaborators; it holds no state).

import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'

interface SpeakScoreInput {
  accuracy: number
  startedAt: number
}
interface SelfGradeInput {
  selfGradeQuality: number
  startedAt: number
}

const SELF_GRADE_PASS_THRESHOLD = 3
const ACCURACY_PASS_THRESHOLD = 70

export function buildSpeakOutcome(input: SpeakScoreInput | SelfGradeInput): AttemptOutcome {
  const latencyMs = Date.now() - input.startedAt
  const correct = 'accuracy' in input
    ? input.accuracy >= ACCURACY_PASS_THRESHOLD
    : input.selfGradeQuality >= SELF_GRADE_PASS_THRESHOLD

  return {
    correct,
    hintsUsed: 0, // speak_sentence has no hint ladder (spec §1.5: opcional, requiere mic ya concedido)
    rescued: false,
    typo: false,
    firstTryFailed: false,
    latencyMs,
  }
}
