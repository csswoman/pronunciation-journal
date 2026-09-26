/**
 * Tolerant grading for `reorder_words`.
 *
 * The legacy check (`placed.join(' ') === sentence`) used exact string
 * comparison, so a reordering that only differed in punctuation or
 * capitalization was marked wrong — frustrating the student and feeding a
 * false error into the SRS (see docs/pedagogy-plans/05-reorder-tolerant-grading.md).
 *
 * This normalizes away differences that are never the point of the exercise
 * (capitalization, surrounding punctuation, collapsed whitespace) before
 * comparing, keeping reorder grading consistent with the tolerance applied to
 * dictation exercises.
 */
import { matchAnswer, normalize, type AnswerSpec } from './answer-match'

export function gradeReorder(
  userAnswer: string,
  sentence: string,
  spec?: AnswerSpec,
): boolean {
  if (spec) {
    const verdict = matchAnswer(userAnswer, {
      ...spec,
      contractions: 'forbid',
    })
    return verdict.kind === 'exact' || verdict.kind === 'variant'
  }
  return normalize(userAnswer) === normalize(sentence)
}
