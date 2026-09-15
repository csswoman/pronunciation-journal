export type ExerciseErrorCode =
  | 'correct'
  | 'empty_answer'
  | 'form_error'
  | 'word_order'
  | 'listening_omission'
  | 'meaning_choice'
  | 'target_not_used'
  | 'pair_mapping'
  | 'unknown'

/**
 * Errors where the learner produced the right material but arranged or
 * inflected it wrong. They deserve a different visual weight than a blank or
 * a wrong-meaning answer: a full-red banner over "you had all the words"
 * reads as "everything is wrong" and discourages beginners.
 */
const PARTIAL_ERROR_CODES = new Set<ExerciseErrorCode>([
  'word_order',
  'form_error',
  'listening_omission',
  'pair_mapping',
])

/** Three-way severity for feedback UI: correct → near miss → wrong. */
export type FeedbackSeverity = 'correct' | 'partial' | 'error'

export function feedbackSeverity(
  isCorrect: boolean,
  errorCode?: ExerciseErrorCode,
): FeedbackSeverity {
  if (isCorrect) return 'correct'
  if (errorCode && PARTIAL_ERROR_CODES.has(errorCode)) return 'partial'
  return 'error'
}
