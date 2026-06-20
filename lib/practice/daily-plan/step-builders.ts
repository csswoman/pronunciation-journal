import { generateFillBlankFromWordBank } from '@/lib/exercises/generators/fill-blank'
import { generateSentenceDictationFromWordBank } from '@/lib/exercises/generators/sentence-dictation'
import { generateReorderWordsFromWordBank } from '@/lib/exercises/generators/reorder-words'
import { generateMatchPairsFromWordBank } from '@/lib/exercises/generators/match-pairs'
import {
  generateSpokenProductionFromWordBank,
  generateWrittenProductionFromWordBank,
} from '@/lib/exercises/generators/production'
import { generateSentenceContextExercises } from '@/lib/lexicon/exercises'
import { generateMinimalPair, generateDictation } from '@/lib/phoneme-practice/exercises'
import { buildMixedSession, type MixedExercise } from '@/lib/phoneme-practice/mixed-session'
import { fromGenericExercise, fromMixedExercise } from '@/lib/practice/adapters'
import type { DailyStep, PracticeContext, PracticeExercise } from '@/lib/practice/types'
import type { MinimalPair, Sound, SoundWord } from '@/lib/phoneme-practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { wordBankEntryToStudyCard } from '@/lib/practice/study-card/model'
import {
  LISTENING_EXERCISE_COUNT,
  MINIMAL_PAIRS_EXERCISE_COUNT,
  PHONEME_FOCUS_EXERCISE_COUNT,
  WORD_INTRO_MAX_CARDS,
} from './constants'
import { dedupeByContentId, toWordEntry } from './selectors'

/**
 * Paso de presentación (noticing): muestra palabras nuevas (forma + significado
 * + audio) antes de que el alumno las recupere en word_review. No evaluado — no
 * escribe answer_history. Devuelve null si no hay palabras nuevas.
 */
export function buildWordIntroStep(words: WordBankEntry[]): DailyStep | null {
  const newWords = words
    .filter((w) => w.srs_status === 'new')
    .slice(0, WORD_INTRO_MAX_CARDS)
  if (newWords.length === 0) return null

  const studyCards = newWords.map(wordBankEntryToStudyCard)

  return {
    kind: 'word_intro',
    id: 'word_intro',
    title: 'Palabras nuevas',
    subtitle: `${newWords.length} ${newWords.length === 1 ? 'palabra nueva' : 'palabras nuevas'} para conocer`,
    icon: 'Sparkles',
    exercises: [],
    studyCards,
    estMinutes: Math.max(1, Math.round(newWords.length * 0.5)),
  }
}

/** Paso de repaso de palabras (solo si hay entradas en el word_bank). */
export function buildWordReviewStep(
  words: WordBankEntry[],
  context: PracticeContext = 'daily',
): DailyStep | null {
  if (words.length === 0) return null

  const { exercises: fillBlanks, skipped: fillBlankSkipped } = generateFillBlankFromWordBank(words, 2)
  if (
    process.env.NODE_ENV === 'development' &&
    fillBlankSkipped.length > 0 &&
    fillBlanks.length < 2
  ) {
    console.debug('[word_review] fill_blank skipped entries', fillBlankSkipped)
  }
  const dictations = generateSentenceDictationFromWordBank(words, 2)
  const reorders = generateReorderWordsFromWordBank(words, 1)
  const matchPairs = generateMatchPairsFromWordBank(words, 1)
  const writtenProduction = generateWrittenProductionFromWordBank(words, 1)
  const spokenProduction = generateSpokenProductionFromWordBank(words, 1)

  const exercises = dedupeByContentId([
    ...fillBlanks.map((ex) => fromGenericExercise(ex, context)),
    ...dictations.map((ex) => fromGenericExercise(ex, context)),
    ...reorders.map((ex) => fromGenericExercise(ex, context)),
    ...matchPairs.map((ex) => fromGenericExercise(ex, context)),
    ...writtenProduction.exercises.map((ex) => fromGenericExercise(ex, context)),
    ...spokenProduction.exercises.map((ex) => fromGenericExercise(ex, context)),
  ])

  if (exercises.length === 0) return null

  return {
    kind: 'word_review',
    id: 'word_review',
    title: 'Repaso de palabras',
    subtitle: `Afianzas ${words.length} ${words.length === 1 ? 'palabra' : 'palabras'} de tu léxico antes de que se te olviden`,
    icon: 'BookMarked',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.1)),
  }
}

/** Paso de práctica en contexto: sentence_context desde word_bank. */
export function buildContextPracticeStep(
  words: WordBankEntry[],
  context: PracticeContext = 'daily',
): DailyStep | null {
  const wordEntries = words.map(toWordEntry)
  const usable = wordEntries.filter((w) => w.exampleSentence)
  if (usable.length < 2) return null

  const contextExercises = generateSentenceContextExercises(usable, wordEntries)
  const exercises = dedupeByContentId(
    contextExercises.map((ex) => fromGenericExercise(ex, context)),
  )
  if (exercises.length === 0) return null

  return {
    kind: 'context_practice',
    id: 'context_practice',
    title: 'Práctica en contexto',
    subtitle: 'Usas el vocabulario dentro de oraciones reales para fijar su significado',
    icon: 'FileText',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.2)),
  }
}

/** Paso de práctica de fonema desde buildMixedSession (sin minimal pairs). */
export function buildPhonemeFocusStep(
  sound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  pairs: MinimalPair[],
  isWeak: boolean,
  context: PracticeContext = 'daily',
): DailyStep | null {
  const mixed = buildMixedSession(sound, targetWords, allSounds, allWordsBySoundId, pairs)
  const core = mixed.filter((ex: MixedExercise) => !(ex.kind === 'phoneme' && ex.data.type === 'minimal_pair'))
  const exercises = dedupeByContentId(
    core.slice(0, PHONEME_FOCUS_EXERCISE_COUNT).map((ex) => fromMixedExercise(ex, context)),
  )

  if (exercises.length === 0) return null

  return {
    kind: 'phoneme_focus',
    id: `phoneme_focus:${sound.id}`,
    title: `Sound ${sound.ipa}`,
    subtitle: isWeak ? 'Your sound to strengthen today' : `Practice the sound as in “${sound.example}”`,
    icon: 'Waves',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.1)),
    ipa: sound.ipa,
  }
}

/** Paso de pares mínimos (solo si el sonido tiene pares en el seed). */
export function buildMinimalPairsStep(
  sound: Sound,
  pairs: MinimalPair[],
  context: PracticeContext = 'daily',
): DailyStep | null {
  if (pairs.length === 0) return null

  const exercises: PracticeExercise[] = []
  for (let i = 0; i < MINIMAL_PAIRS_EXERCISE_COUNT; i++) {
    const mp = generateMinimalPair(sound, pairs)
    if (mp.options.length === 0) continue
    exercises.push(fromMixedExercise({ kind: 'phoneme', data: mp }, context))
  }

  const deduped = dedupeByContentId(exercises)
  if (deduped.length === 0) return null

  return {
    kind: 'minimal_pairs',
    id: `minimal_pairs:${sound.id}`,
    title: 'Minimal pairs',
    subtitle: `Tell ${sound.ipa} apart from similar sounds`,
    icon: 'GitCompareArrows',
    exercises: deduped,
    estMinutes: Math.max(2, Math.round(deduped.length * 1.1)),
  }
}

/** Paso de escucha/dictado desde palabras del seed. */
export function buildListeningStep(
  sound: Sound,
  words: SoundWord[],
  context: PracticeContext = 'daily',
): DailyStep | null {
  if (words.length === 0) return null

  const exercises: PracticeExercise[] = []
  for (let i = 0; i < LISTENING_EXERCISE_COUNT; i++) {
    const dict = generateDictation(sound, words)
    if (!dict.targetWord) continue
    exercises.push(fromMixedExercise({ kind: 'phoneme', data: dict }, context))
  }

  const deduped = dedupeByContentId(exercises)
  if (deduped.length === 0) return null

  return {
    kind: 'listening',
    id: `listening:${sound.id}`,
    title: 'Listen and write',
    subtitle: 'Dictation with new words',
    icon: 'Headphones',
    exercises: deduped,
    estMinutes: Math.max(2, Math.round(deduped.length * 1.1)),
  }
}
