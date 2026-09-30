import type { EvaluationResult } from '@/lib/exercises/design'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'
import { describeErrorPattern } from '@/lib/exercises/error-patterns'
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
        immediate: isCorrect
          ? `Usaste “${exercise.targetItem}” correctamente en tu oración.`
          : userAnswer.toLowerCase().includes(exercise.targetItem.toLowerCase())
            ? `Usaste “${exercise.targetItem}”, pero hay algo que ajustar en la oración.`
            : `Falta “${exercise.targetItem}” en tu oración: es la palabra que toca practicar.`,
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
        category: isCorrect ? 'sentence_context_correct' : 'sentence_context_meaning',
        errorCode: isCorrect ? 'correct' : emptyAnswer ? 'empty_answer' : 'meaning_choice',
        canRetry: !isCorrect,
        nextAction: isCorrect ? 'continue' : 'retry',
      }
    case 'error_correction':
      return errorCorrectionFeedback(exercise, isCorrect)
    case 'conjugation_blank':
      return {
        immediate: isCorrect
          ? 'Esa es la forma verbal correcta.'
          : `Esa forma no encaja aquí. La correcta es “${exercise.answer}”.`,
        explanation: isCorrect
          ? undefined
          : exercise.lemma
            ? `Parte del infinitivo “${exercise.lemma}” y ajústalo al sujeto y al tiempo que pide la oración.`
            : 'Fíjate en el sujeto y en el tiempo verbal que pide la oración antes de conjugar.',
        expectedAnswer: exercise.answer,
        tip: exercise.hint,
        errorCode: isCorrect ? 'correct' : 'form_error',
        canRetry: !isCorrect,
        nextAction: isCorrect ? 'continue' : 'retry',
      }
    case 'sentence_transformation':
      return {
        immediate: isCorrect
          ? 'La transformación conserva el significado y cumple la instrucción.'
          : 'Tu oración no cumple del todo la instrucción. Compárala con la de referencia.',
        explanation: isCorrect
          ? undefined
          : `La instrucción pedía: ${exercise.instruction}. El significado debe mantenerse igual que en la oración original.`,
        expectedAnswer: exercise.referenceAnswer,
        correction: exercise.referenceAnswer,
        errorCode: isCorrect ? 'correct' : 'unknown',
        canRetry: !isCorrect,
        nextAction: isCorrect ? 'continue' : 'retry',
      }
    case 'translation_es_en':
      return {
        immediate: isCorrect
          ? 'Tu traducción transmite el mismo significado.'
          : 'Tu traducción cambia parte del significado. Compárala con la referencia.',
        explanation: isCorrect
          ? undefined
          : 'Traducir no es cambiar palabra por palabra: revisa el orden y las estructuras que el inglés necesita para decir lo mismo.',
        expectedAnswer: exercise.referenceEn,
        correction: exercise.referenceEn,
        errorCode: isCorrect ? 'correct' : 'meaning_choice',
        canRetry: !isCorrect,
        nextAction: isCorrect ? 'continue' : 'retry',
      }
    case 'cs_shadow_phrase':
      return {
        immediate: isCorrect ? '¡Muy buena imitación!' : emptyAnswer ? 'Este intento no recibió puntuación. Sigue practicando.' : 'Sigue practicando esta frase.',
        expectedAnswer: exercise.phrase,
        category: isCorrect ? 'correct' : emptyAnswer ? 'unscored' : 'production_review',
        errorCode: isCorrect ? 'correct' : 'unknown',
        nextAction: 'continue',
      }
    case 'personalization':
      return {
        immediate: isCorrect ? '¡Tu respuesta cumple con los requisitos y habla de ti!' : 'Revisa que tu respuesta use la estructura pedida y tenga la longitud adecuada.',
        explanation: isCorrect ? undefined : (exercise.mode === 'open' ? exercise.promptEs : exercise.hintEs),
        expectedAnswer: exercise.example,
        correction: exercise.example,
        errorCode: isCorrect ? 'correct' : 'unknown',
        canRetry: !isCorrect,
        nextAction: isCorrect ? 'continue' : 'retry',
      }
  }
}

function errorCorrectionFeedback(exercise: ErrorCorrectionExercise, isCorrect: boolean): PedagogicalFeedback {
  return {
    immediate: isCorrect
      ? 'Encontraste y corregiste el error.'
      : 'Esa no es la corrección. Compara tu versión con la correcta.',
    correction: exercise.correctSentence,
    explanation: exercise.explanation,
    expectedAnswer: exercise.correctSentence,
    category: isCorrect ? 'error_correction_correct' : 'error_correction_form',
    errorCode: isCorrect ? 'correct' : 'form_error',
    canRetry: !isCorrect,
    nextAction: isCorrect ? 'continue' : 'retry',
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
  const patternTip = result.errorPattern
    ? `Patrón a vigilar: ${describeErrorPattern(result.errorPattern)}.`
    : undefined
  return {
    immediate: result.correct
      ? '¡Buen trabajo!'
      : result.usedTarget
        ? 'Usaste el elemento objetivo, pero hay detalles que corregir.'
        : 'Falta el elemento objetivo en tu respuesta.',
    explanation: result.feedback,
    correction: result.corrections,
    tip: patternTip,
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
    // Abre reconociendo lo que el alumno sí logró: al llegar aquí ya colocó
    // todas las fichas, y solo falta el orden. La explicación evita
    // metalenguaje ("sujeto", "verbo principal"), que en A1 añade una segunda
    // cosa que aprender encima de la que falló.
    immediate: isCorrect ? 'El orden es correcto.' : 'Casi. Tienes todas las palabras, solo falta acomodarlas.',
    explanation: isCorrect
      ? undefined
      : 'En inglés el orden casi siempre es: quién hace la acción → qué hace → el resto de la idea.',
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
  const isPhoneme =
    exercise.exerciseType?.variant === 'phoneme' ||
    exercise.pairs.some((p) => p.right.startsWith('/') && p.right.endsWith('/'))

  const expected = exercise.pairs.map((pair) => `${pair.left} → ${pair.right}`).join(' · ')
  const countLine =
    correctPairCount == null
      ? undefined
      : correctPairCount === 0
        ? `0 de ${totalPairCount} pares correctos.`
        : `${correctPairCount} de ${totalPairCount} pares correctos.`

  return {
    immediate: isCorrect
      ? 'Todos los pares coinciden correctamente.'
      : countLine
        ? `${countLine} Abajo tienes las parejas correctas.`
        : 'Algunas parejas no coinciden. Abajo tienes las correctas.',
    explanation: isCorrect
      ? undefined
      : isPhoneme
        ? 'Presta atención a la diferencia de pronunciación y símbolos fonéticos de cada palabra.'
        : undefined,
    expectedAnswer: expected,
    category: isCorrect ? 'match_pairs_correct' : 'match_pairs_mapping',
    errorCode: isCorrect ? 'correct' : 'pair_mapping',
    canRetry: !isCorrect,
    nextAction: isCorrect ? 'continue' : 'retry',
  }
}
