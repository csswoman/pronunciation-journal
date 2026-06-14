import { generateFillBlankFromWordBank } from '@/lib/exercises/generators/fill-blank'
import { generateSentenceDictationFromWordBank } from '@/lib/exercises/generators/sentence-dictation'
import { generateReorderWordsFromWordBank } from '@/lib/exercises/generators/reorder-words'
import { generateMatchPairsFromWordBank } from '@/lib/exercises/generators/match-pairs'
import { generateSentenceContextExercises } from '@/lib/lexicon/exercises'
import { generateMinimalPair, generateDictation } from '@/lib/phoneme-practice/exercises'
import { buildMixedSession, type MixedExercise } from '@/lib/phoneme-practice/mixed-session'
import { fromGenericExercise, fromMixedExercise } from '@/lib/practice/adapters'
import type { DailyStep, PracticeExercise } from '@/lib/practice/types'
import type { MinimalPair, Sound, SoundWord } from '@/lib/phoneme-practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import {
  LISTENING_EXERCISE_COUNT,
  MINIMAL_PAIRS_EXERCISE_COUNT,
  PHONEME_FOCUS_EXERCISE_COUNT,
} from './constants'
import { dedupeByContentId, toWordEntry } from './selectors'

/** Paso de repaso de palabras (solo si hay entradas en el word_bank). */
export function buildWordReviewStep(words: WordBankEntry[]): DailyStep | null {
  if (words.length === 0) return null

  const fillBlanks = generateFillBlankFromWordBank(words, 2)
  const dictations = generateSentenceDictationFromWordBank(words, 2)
  const reorders = generateReorderWordsFromWordBank(words, 1)
  const matchPairs = generateMatchPairsFromWordBank(words, 1)

  const exercises = dedupeByContentId([
    ...fillBlanks.map((ex) => fromGenericExercise(ex, 'daily')),
    ...dictations.map((ex) => fromGenericExercise(ex, 'daily')),
    ...reorders.map((ex) => fromGenericExercise(ex, 'daily')),
    ...matchPairs.map((ex) => fromGenericExercise(ex, 'daily')),
  ])

  if (exercises.length === 0) return null

  return {
    kind: 'word_review',
    id: 'word_review',
    title: 'Repaso de palabras',
    subtitle: `${words.length} ${words.length === 1 ? 'palabra' : 'palabras'} de tu léxico`,
    icon: 'BookMarked',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.1)),
  }
}

/** Paso de práctica en contexto: sentence_context desde word_bank. */
export function buildContextPracticeStep(words: WordBankEntry[]): DailyStep | null {
  const wordEntries = words.map(toWordEntry)
  const usable = wordEntries.filter((w) => w.exampleSentence)
  if (usable.length < 2) return null

  const contextExercises = generateSentenceContextExercises(usable, wordEntries)
  const exercises = dedupeByContentId(
    contextExercises.map((ex) => fromGenericExercise(ex, 'daily')),
  )
  if (exercises.length === 0) return null

  return {
    kind: 'context_practice',
    id: 'context_practice',
    title: 'Práctica en contexto',
    subtitle: `${exercises.length} ${exercises.length === 1 ? 'palabra' : 'palabras'} en oraciones reales`,
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
): DailyStep | null {
  const mixed = buildMixedSession(sound, targetWords, allSounds, allWordsBySoundId, pairs)
  const core = mixed.filter((ex: MixedExercise) => !(ex.kind === 'phoneme' && ex.data.type === 'minimal_pair'))
  const exercises = dedupeByContentId(
    core.slice(0, PHONEME_FOCUS_EXERCISE_COUNT).map((ex) => fromMixedExercise(ex, 'daily')),
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
export function buildMinimalPairsStep(sound: Sound, pairs: MinimalPair[]): DailyStep | null {
  if (pairs.length === 0) return null

  const exercises: PracticeExercise[] = []
  for (let i = 0; i < MINIMAL_PAIRS_EXERCISE_COUNT; i++) {
    const mp = generateMinimalPair(sound, pairs)
    if (mp.options.length === 0) continue
    exercises.push(fromMixedExercise({ kind: 'phoneme', data: mp }, 'daily'))
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
export function buildListeningStep(sound: Sound, words: SoundWord[]): DailyStep | null {
  if (words.length === 0) return null

  const exercises: PracticeExercise[] = []
  for (let i = 0; i < LISTENING_EXERCISE_COUNT; i++) {
    const dict = generateDictation(sound, words)
    if (!dict.targetWord) continue
    exercises.push(fromMixedExercise({ kind: 'phoneme', data: dict }, 'daily'))
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
