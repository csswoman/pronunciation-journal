/**
 * lib/focus/exercise-builder.ts
 *
 * Deriva GenericExercise[] a partir del contenido de texto de cada FocusContent.
 * Reutiliza la taxonomía existente y genera IDs deterministas para no duplicar en answer_history.
 */

import type {
  GenericExercise,
  FillBlankExercise,
  ReorderWordsExercise,
  SentenceDictationExercise,
  TranslationEsEnExercise,
  ErrorCorrectionExercise,
} from '@/lib/exercises/types'
import { exerciseId, tokenize, blankWord, shuffle } from '@/lib/exercises/utils'
import type {
  StoryBody,
  DrillBody,
  DialogueBody,
  ErrorTrapBody,
  SongBody,
  FocusContentKind,
  FocusContentBody,
} from './types'

/** Extrae oraciones simples de un pasaje de texto. */
function splitSentences(passage: string): string[] {
  return passage
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.includes(' '))
}

/**
 * Deriva ejercicios de una Mini-historia:
 * - FillBlank en keyPhrases u oraciones destacadas
 * - Reorder words en una oración representativa
 * - Dictation en una oración de la historia
 */
export function buildExercisesFromStory(
  contentId: string,
  body: StoryBody,
  topic?: string,
): GenericExercise[] {
  const exercises: GenericExercise[] = []
  const sentences = splitSentences(body.passage)

  // 1. Fill-in-the-blank desde keyPhrases si están en las oraciones
  for (let i = 0; i < Math.min(body.keyPhrases.length, 3); i++) {
    const phrase = body.keyPhrases[i]
    // Buscar oración que contenga la phrase
    const matchSentence = sentences.find((s) =>
      s.toLowerCase().includes(phrase.toLowerCase()),
    )
    if (!matchSentence) continue

    const blanked = blankWord(matchSentence, phrase)
    if (!blanked) continue

    // Opciones: la respuesta correcta + keyPhrases hermanas como distractores si existen
    const otherPhrases = body.keyPhrases.filter((p) => p !== phrase).slice(0, 3)
    const options = shuffle([phrase, ...otherPhrases])

    const fillEx: FillBlankExercise = {
      id: exerciseId('fill_blank', contentId, `story-phrase-${i}`),
      type: 'fill_blank',
      exerciseType: { domain: 'grammar', mode: 'fill_blank', variant: 'sentence' },
      sourceRef: { source: 'focus_content', id: contentId },
      topic,
      sentence: blanked,
      answer: phrase,
      options,
      hint: body.explanation,
    }
    exercises.push(fillEx)
  }

  // 2. Reorder words con 1-2 oraciones de la historia
  if (sentences.length > 0) {
    const targetSentence = sentences[0]
    const tokens = tokenize(targetSentence)
    if (tokens.length >= 4 && tokens.length <= 12) {
      const reorderEx: ReorderWordsExercise = {
        id: exerciseId('reorder_words', contentId, 'story-reorder-0'),
        type: 'reorder_words',
        exerciseType: { domain: 'grammar', mode: 'reorder', variant: 'sentence' },
        sourceRef: { source: 'focus_content', id: contentId },
        topic,
        sentence: targetSentence,
        tokens: shuffle(tokens),
      }
      exercises.push(reorderEx)
    }
  }

  // 3. Sentence Dictation para listening/typing
  if (sentences.length > 1) {
    const dictationSentence = sentences[1]
    const dictEx: SentenceDictationExercise = {
      id: exerciseId('sentence_dictation', contentId, 'story-dict-1'),
      type: 'sentence_dictation',
      exerciseType: { domain: 'listening', mode: 'sentence_dictation' },
      sourceRef: { source: 'focus_content', id: contentId },
      topic,
      sentence: dictationSentence,
      audioUrl: null, // usa TTS en cliente si no hay audio remoto
    }
    exercises.push(dictEx)
  }

  return exercises
}

/**
 * Deriva ejercicios de un Drill de frases:
 * - FillBlank para cada oración usando su gapWord
 * - TranslationEsEn para cada oración usando translation
 */
export function buildExercisesFromDrill(
  contentId: string,
  body: DrillBody,
  topic?: string,
): GenericExercise[] {
  const exercises: GenericExercise[] = []

  body.sentences.forEach((item, index) => {
    // 1. Fill blank en la gapWord
    const blanked = blankWord(item.text, item.gapWord)
    if (blanked) {
      // Distractores tomados de otras gapWords del mismo drill
      const otherWords = body.sentences
        .map((s) => s.gapWord)
        .filter((w) => w.toLowerCase() !== item.gapWord.toLowerCase())
        .slice(0, 3)

      const fillEx: FillBlankExercise = {
        id: exerciseId('fill_blank', contentId, `drill-fill-${index}`),
        type: 'fill_blank',
        exerciseType: { domain: 'grammar', mode: 'fill_blank', variant: 'sentence' },
        sourceRef: { source: 'focus_content', id: contentId },
        topic,
        sentence: blanked,
        answer: item.gapWord,
        options: shuffle([item.gapWord, ...otherWords]),
        hint: item.translation,
      }
      exercises.push(fillEx)
    }

    // 2. Translation ES -> EN
    if (item.translation) {
      const transEx: TranslationEsEnExercise = {
        id: exerciseId('translation_es_en', contentId, `drill-trans-${index}`),
        type: 'translation_es_en',
        exerciseType: { domain: 'grammar', mode: 'write' },
        sourceRef: { source: 'focus_content', id: contentId },
        topic,
        sourceEs: item.translation,
        referenceEn: item.text,
      }
      exercises.push(transEx)
    }
  })

  return exercises
}

/**
 * Deriva ejercicios de un Diálogo:
 * - Reorder words en turnos seleccionados
 * - Dictation en turnos de respuesta
 */
export function buildExercisesFromDialogue(
  contentId: string,
  body: DialogueBody,
  topic?: string,
): GenericExercise[] {
  const exercises: GenericExercise[] = []

  body.turns.slice(0, 4).forEach((turn, idx) => {
    const tokens = tokenize(turn.text)
    if (tokens.length >= 4 && tokens.length <= 12) {
      const reorderEx: ReorderWordsExercise = {
        id: exerciseId('reorder_words', contentId, `dialogue-reorder-${idx}`),
        type: 'reorder_words',
        exerciseType: { domain: 'grammar', mode: 'reorder', variant: 'sentence' },
        sourceRef: { source: 'focus_content', id: contentId },
        topic,
        sentence: turn.text,
        tokens: shuffle(tokens),
      }
      exercises.push(reorderEx)
    }
  })

  return exercises
}

/**
 * Deriva ejercicios de un Error Trap:
 * - ErrorCorrection para cada oración marcada con hasError: true
 */
export function buildExercisesFromErrorTrap(
  contentId: string,
  body: ErrorTrapBody,
  topic?: string,
): GenericExercise[] {
  const exercises: GenericExercise[] = []

  body.sentences.forEach((item, index) => {
    if (item.hasError && item.correction) {
      const errEx: ErrorCorrectionExercise = {
        id: exerciseId('error_correction', contentId, `error-trap-${index}`),
        type: 'error_correction',
        exerciseType: { domain: 'grammar', mode: 'write' },
        sourceRef: { source: 'focus_content', id: contentId },
        topic,
        sentence: item.text,
        correctSentence: item.correction,
        explanation: item.explanation,
      }
      exercises.push(errEx)
    }
  })

  return exercises
}

/**
 * Deriva ejercicios de una Letra de Canción:
 * - Dictation en líneas seleccionadas con patrón
 */
export function buildExercisesFromSong(
  contentId: string,
  body: SongBody,
  topic?: string,
): GenericExercise[] {
  const exercises: GenericExercise[] = []
  const lines = body.lyrics.split('\n').map((l) => l.trim()).filter(Boolean)

  body.gapLines.slice(0, 3).forEach((lineIdx, i) => {
    const line = lines[lineIdx]
    if (!line) return

    const dictEx: SentenceDictationExercise = {
      id: exerciseId('sentence_dictation', contentId, `song-dict-${i}`),
      type: 'sentence_dictation',
      exerciseType: { domain: 'listening', mode: 'sentence_dictation' },
      sourceRef: { source: 'focus_content', id: contentId },
      topic,
      sentence: line,
      audioUrl: null,
    }
    exercises.push(dictEx)
  })

  return exercises
}

/** Orquestador maestro que llama al generador correspondiente según el kind */
export function deriveExercisesFromContent(
  contentId: string,
  kind: FocusContentKind,
  body: FocusContentBody,
  topic?: string,
): GenericExercise[] {
  switch (kind) {
    case 'story':
      return buildExercisesFromStory(contentId, body as StoryBody, topic)
    case 'drill':
      return buildExercisesFromDrill(contentId, body as DrillBody, topic)
    case 'dialogue':
      return buildExercisesFromDialogue(contentId, body as DialogueBody, topic)
    case 'error_trap':
      return buildExercisesFromErrorTrap(contentId, body as ErrorTrapBody, topic)
    case 'song':
      return buildExercisesFromSong(contentId, body as SongBody, topic)
    default:
      return []
  }
}
