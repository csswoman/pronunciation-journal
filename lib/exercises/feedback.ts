import type { EvaluationResult } from '@/lib/exercises/design'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'
import type {
  FillBlankExercise,
  GenericExercise,
  MatchPairsExercise,
  MultipleChoiceExercise,
  ReorderWordsExercise,
  SentenceDictationExercise,
} from '@/lib/exercises/types'
import type { PedagogicalFeedback } from '@/lib/practice/types'

export function buildPedagogicalFeedback(
  exercise: GenericExercise,
  isCorrect: boolean,
  userAnswer: string,
  meta?: { correctPairCount?: number; totalPairCount?: number; hintUsed?: boolean },
): PedagogicalFeedback {
  const emptyAnswer = userAnswer.trim().length === 0
  switch (exercise.type) {
    case 'fill_blank':
      return fillBlankFeedback(exercise, isCorrect, userAnswer, emptyAnswer, meta?.hintUsed)
    case 'sentence_dictation':
      return dictationFeedback(exercise, isCorrect)
    case 'reorder_words':
      return reorderFeedback(exercise, isCorrect)
    case 'multiple_choice':
      return multipleChoiceFeedback(exercise, isCorrect)
    case 'match_pairs':
      return matchPairsFeedback(exercise, isCorrect, meta?.correctPairCount, meta?.totalPairCount)
    case 'written_production':
    case 'spoken_production':
      return {
        immediate: isCorrect ? 'Good work using the target item.' : 'Review the model feedback before continuing.',
        expectedAnswer: exercise.exampleSentence,
        tip: exercise.targetMeaning ? `Keep the meaning of "${exercise.targetItem}" in mind: ${exercise.targetMeaning}.` : undefined,
        category: isCorrect ? 'production_accepted' : 'production_review',
        errorCode: isCorrect
          ? 'correct'
          : userAnswer.toLowerCase().includes(exercise.targetItem.toLowerCase())
            ? 'unknown'
            : 'target_not_used',
        nextAction: 'continue',
      }
    case 'sentence_context':
      return {
        immediate: isCorrect ? 'That fits the sentence.' : 'Look at the full sentence and try the meaning again.',
        expectedAnswer: exercise.answer,
        correction: exercise.fullSentence,
        explanation: exercise.definition,
        category: isCorrect ? 'sentence_context_correct' : 'sentence_context_meaning',
        errorCode: isCorrect ? 'correct' : emptyAnswer ? 'empty_answer' : 'meaning_choice',
        canRetry: !isCorrect,
        nextAction: isCorrect ? 'continue' : 'retry',
      }
  }
}

export function pedagogicalFeedbackFromEvaluation(result: EvaluationResult): PedagogicalFeedback {
  return {
    immediate: result.feedback.immediate,
    explanation: result.feedback.explanation,
    tip: result.feedback.tip,
    example: result.feedback.example,
    expectedAnswer: result.expectedAnswer,
    category: result.category,
    errorCode: result.errorCode,
    canRetry: !result.correct,
    nextAction: result.correct ? 'continue' : 'retry',
  }
}

export function pedagogicalFeedbackFromProductionGrade(
  result: ProductionGradeResult,
): PedagogicalFeedback {
  return {
    immediate: result.correct ? 'Great production.' : 'Review the feedback before continuing.',
    explanation: result.feedback,
    correction: result.corrections,
    category: result.correct
      ? 'production_correct'
      : result.usedTarget
        ? 'production_grammar'
        : 'production_target_item',
    errorCode: result.correct ? 'correct' : result.usedTarget ? 'unknown' : 'target_not_used',
    canRetry: !result.correct,
    nextAction: result.correct ? 'continue' : 'retry',
  }
}

function fillBlankFeedback(
  exercise: FillBlankExercise,
  isCorrect: boolean,
  userAnswer: string,
  emptyAnswer: boolean,
  hintUsed?: boolean,
): PedagogicalFeedback {
  const sentence = exercise.sentence.replace('___', exercise.answer)
  return {
    immediate: isCorrect ? 'Yes, that word completes the sentence.' : 'Not quite. Use the word that makes the sentence read naturally.',
    explanation: isCorrect
      ? undefined
      : 'In this exercise, the missing word must fit both the meaning and the grammar around the blank.',
    expectedAnswer: exercise.answer,
    correction: sentence,
    tip: exercise.hints?.level2 ?? exercise.hint,
    example: sentence,
    category: isCorrect ? 'fill_blank_correct' : hintUsed ? 'fill_blank_hint_used' : 'fill_blank_word_choice',
    errorCode: isCorrect
      ? 'correct'
      : emptyAnswer
        ? 'empty_answer'
        : isLikelyFormError(userAnswer, exercise.answer)
          ? 'form_error'
          : 'meaning_choice',
    canRetry: !isCorrect,
    nextAction: isCorrect ? 'continue' : 'retry',
  }
}

function isLikelyFormError(userAnswer: string, expectedAnswer: string): boolean {
  const answer = userAnswer.trim().toLowerCase()
  const expected = expectedAnswer.trim().toLowerCase()
  return [`${expected}s`, `${expected}ed`, `${expected}ing`].includes(answer)
}

function dictationFeedback(
  exercise: SentenceDictationExercise,
  isCorrect: boolean,
): PedagogicalFeedback {
  return {
    immediate: isCorrect ? 'You heard the full sentence clearly.' : 'Close. Compare what you typed with the full sentence.',
    explanation: isCorrect
      ? undefined
      : 'Dictation trains the link between English sounds and written words. Small missing words still change the sentence.',
    expectedAnswer: exercise.sentence,
    correction: exercise.sentence,
    tip: 'Replay the slow audio and listen for short words and endings.',
    example: exercise.sentence,
    category: isCorrect ? 'dictation_correct' : 'dictation_sound_to_text',
    errorCode: isCorrect ? 'correct' : 'listening_omission',
    canRetry: !isCorrect,
    nextAction: isCorrect ? 'continue' : 'retry',
  }
}

function reorderFeedback(
  exercise: ReorderWordsExercise,
  isCorrect: boolean,
): PedagogicalFeedback {
  return {
    immediate: isCorrect ? 'Good order.' : 'The words are right, but the order needs work.',
    explanation: isCorrect
      ? undefined
      : 'English word order carries the sentence meaning. Start with the subject, then the main verb, then the rest of the idea.',
    expectedAnswer: exercise.sentence,
    correction: exercise.sentence,
    tip: 'Read your sentence aloud. If it sounds like a question or a fragment, check the subject and verb first.',
    example: exercise.sentence,
    category: isCorrect ? 'reorder_correct' : 'reorder_word_order',
    errorCode: isCorrect ? 'correct' : 'word_order',
    canRetry: !isCorrect,
    nextAction: isCorrect ? 'continue' : 'retry',
  }
}

function multipleChoiceFeedback(
  exercise: MultipleChoiceExercise,
  isCorrect: boolean,
): PedagogicalFeedback {
  const expected = exercise.options[exercise.answerIndex]
  return {
    immediate: isCorrect ? 'Correct choice.' : 'Not this option. Check the correct answer before moving on.',
    explanation: exercise.explanation,
    expectedAnswer: expected,
    correction: expected,
    tip: isCorrect ? undefined : 'Read the question again and look for the word that controls the answer.',
    category: isCorrect ? 'multiple_choice_correct' : 'multiple_choice_concept',
    errorCode: isCorrect ? 'correct' : 'meaning_choice',
    canRetry: !isCorrect,
    nextAction: isCorrect ? 'continue' : 'retry',
  }
}

function matchPairsFeedback(
  exercise: MatchPairsExercise,
  isCorrect: boolean,
  correctPairCount?: number,
  totalPairCount = exercise.pairs.length,
): PedagogicalFeedback {
  const expected = exercise.pairs.map((pair) => `${pair.left} = ${pair.right}`).join('; ')
  const countLine = correctPairCount == null ? undefined : `${correctPairCount} of ${totalPairCount} pairs matched.`
  return {
    immediate: isCorrect ? 'All pairs match.' : countLine ?? 'Some pairs need another look.',
    explanation: isCorrect ? undefined : 'Pair each item with the meaning, sound, or form that belongs to it.',
    expectedAnswer: expected,
    tip: 'Match the easiest pair first, then use elimination for the rest.',
    category: isCorrect ? 'match_pairs_correct' : 'match_pairs_mapping',
    errorCode: isCorrect ? 'correct' : 'pair_mapping',
    canRetry: !isCorrect,
    nextAction: isCorrect ? 'continue' : 'retry',
  }
}
