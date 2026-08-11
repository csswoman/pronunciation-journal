import type { EvaluationResult } from '@/lib/exercises/design'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'
import type {
  FillBlankExercise,
  GenericExercise,
  MatchPairsExercise,
  MultipleChoiceExercise,
  ReorderWordsExercise,
  SentenceDictationExercise,
  ErrorCorrectionExercise,
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
        immediate: isCorrect ? 'Usaste bien el elemento objetivo.' : 'Revisa el feedback antes de continuar.',
        expectedAnswer: exercise.exampleSentence,
        tip: exercise.targetMeaning ? `Ten presente el significado de “${exercise.targetItem}”: ${exercise.targetMeaning}.` : undefined,
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
        immediate: isCorrect ? 'Esa opción encaja en la oración.' : 'Lee la oración completa y vuelve a revisar el significado.',
        expectedAnswer: exercise.answer,
        correction: exercise.fullSentence,
        explanation: exercise.definition,
        category: isCorrect ? 'sentence_context_correct' : 'sentence_context_meaning',
        errorCode: isCorrect ? 'correct' : emptyAnswer ? 'empty_answer' : 'meaning_choice',
        canRetry: !isCorrect,
        nextAction: isCorrect ? 'continue' : 'retry',
      }
    case 'error_correction':
      return errorCorrectionFeedback(exercise, isCorrect)
    case 'conjugation_blank':
      return { immediate: isCorrect ? 'Correcto.' : 'Revisa la forma verbal.', expectedAnswer: exercise.answer, tip: exercise.hint, errorCode: isCorrect ? 'correct' : 'form_error', canRetry: !isCorrect, nextAction: isCorrect ? 'continue' : 'retry' }
    case 'sentence_transformation':
      return { immediate: isCorrect ? 'Correcto.' : 'Revisa el feedback antes de continuar.', expectedAnswer: exercise.referenceAnswer, errorCode: isCorrect ? 'correct' : 'unknown', canRetry: !isCorrect, nextAction: isCorrect ? 'continue' : 'retry' }
    case 'translation_es_en':
      return { immediate: isCorrect ? 'Correcto.' : 'Compara tu traducción con la referencia.', expectedAnswer: exercise.referenceEn, correction: exercise.referenceEn, errorCode: isCorrect ? 'correct' : 'meaning_choice', canRetry: !isCorrect, nextAction: isCorrect ? 'continue' : 'retry' }
    case 'cs_shadow_phrase':
      return {
        immediate: isCorrect ? '¡Muy buena imitación!' : emptyAnswer ? 'Este intento no recibió puntuación. Sigue practicando.' : 'Sigue practicando esta frase.',
        expectedAnswer: exercise.phrase,
        category: isCorrect ? 'correct' : emptyAnswer ? 'unscored' : 'production_review',
        errorCode: isCorrect ? 'correct' : 'unknown',
        nextAction: 'continue',
      }
  }
}

function errorCorrectionFeedback(exercise: ErrorCorrectionExercise, isCorrect: boolean): PedagogicalFeedback {
  return { immediate: isCorrect ? 'Correcto.' : 'Corrige la forma de la oración.', correction: exercise.correctSentence, explanation: exercise.explanation, expectedAnswer: exercise.correctSentence, category: isCorrect ? 'error_correction_correct' : 'error_correction_form', errorCode: isCorrect ? 'correct' : 'form_error', canRetry: !isCorrect, nextAction: isCorrect ? 'continue' : 'retry' }
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
    immediate: result.correct ? '¡Buen trabajo!' : 'Revisa el feedback antes de continuar.',
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
    immediate: isCorrect ? 'Sí, esa palabra completa la oración.' : 'Aún no. Elige la palabra que haga que la oración suene natural.',
    explanation: isCorrect
      ? undefined
      : 'La palabra que falta debe encajar tanto en el significado como en la gramática de la oración.',
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
    immediate: isCorrect ? 'Escuchaste con claridad la oración completa.' : 'Casi. Compara lo que escribiste con la oración completa.',
    explanation: isCorrect
      ? undefined
      : 'El dictado entrena la relación entre los sonidos del inglés y las palabras escritas. Incluso una palabra corta puede cambiar la oración.',
    expectedAnswer: exercise.sentence,
    correction: exercise.sentence,
    tip: 'Reproduce el audio lento y presta atención a las palabras cortas y a las terminaciones.',
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
    immediate: isCorrect ? 'El orden es correcto.' : 'Las palabras son correctas, pero debes revisar el orden.',
    explanation: isCorrect
      ? undefined
      : 'El orden de las palabras comunica el sentido de la oración. Empieza por el sujeto, sigue con el verbo principal y después completa la idea.',
    expectedAnswer: exercise.sentence,
    correction: exercise.sentence,
    tip: 'Lee la oración en voz alta. Si suena como una pregunta o un fragmento, revisa primero el sujeto y el verbo.',
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
    immediate: isCorrect ? 'Elegiste la opción correcta.' : 'Esa opción no encaja. Revisa la respuesta correcta antes de continuar.',
    explanation: exercise.explanation,
    expectedAnswer: expected,
    correction: expected,
    tip: isCorrect ? undefined : 'Lee otra vez la pregunta y busca la palabra que determina la respuesta.',
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
  const countLine = correctPairCount == null ? undefined : `${correctPairCount} de ${totalPairCount} pares correctos.`
  return {
    immediate: isCorrect ? 'Todos los pares coinciden.' : countLine ?? 'Revisa algunos pares.',
    explanation: isCorrect ? undefined : 'Relaciona cada elemento con el significado, sonido o forma que le corresponde.',
    expectedAnswer: expected,
    tip: 'Empieza por el par más fácil y usa el descarte para resolver los demás.',
    category: isCorrect ? 'match_pairs_correct' : 'match_pairs_mapping',
    errorCode: isCorrect ? 'correct' : 'pair_mapping',
    canRetry: !isCorrect,
    nextAction: isCorrect ? 'continue' : 'retry',
  }
}
