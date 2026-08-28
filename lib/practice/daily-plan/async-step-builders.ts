import { isExerciseAvailableOnSurface } from '@/lib/exercises/capabilities'
import { generateConnectedSpeechExercises } from '@/lib/exercises/generators/connected-speech'
import { generateFalseFriendExercises } from '@/lib/exercises/generators/false-friends'
import { fetchTextFragments, generateReorderFromFragments } from '@/lib/exercises/generators/reorder-from-fragments'
import { generateReorderAI } from '@/lib/exercises/generators/reorder-ai'
import { fetchFalseFriendsForDay, toFalseFriendIntro } from '@/lib/false-friends/data'
import type { CefrLevel } from '@/lib/false-friends/types'
import { fromGenericExercise } from '@/lib/practice/adapters'
import { orderFragmentsByDue } from '@/lib/practice/fragment-priority'
import type { DailyStep } from '@/lib/practice/types'
import { resolveReaderPassage } from '@/lib/practice/reader/get-passage'
import { getCachedReaderPassage, saveReaderPassage } from '@/lib/db'
import { generateReaderPassage, resolveReaderLevel } from '@/lib/practice/reader/queries'
import { pickTargets, type ReaderTargetRow } from '@/lib/practice/reader/select-targets'
import { FALSE_FRIENDS_EXERCISE_COUNT, SENTENCE_BUILDER_EXERCISE_COUNT } from './constants'
import { dayOfYear, dedupeByContentId } from './selectors'

/** Paso de habla conectada — solo días pares; null si offline o impar. */
export async function buildConnectedSpeechStep(): Promise<DailyStep | null> {
  if (dayOfYear() % 2 !== 0) return null

  const result = await generateConnectedSpeechExercises(2, 2, 1)
  if (!result) return null

  const exercises = dedupeByContentId([
    ...(isExerciseAvailableOnSurface('multiple_choice', 'daily_plan') ? result.quiz.map((ex) => fromGenericExercise(ex, 'daily')) : []),
    ...(isExerciseAvailableOnSurface('sentence_dictation', 'daily_plan') ? result.dictation.map((ex) => fromGenericExercise(ex, 'daily')) : []),
    ...result.shadowPhrase.map((ex) => fromGenericExercise(ex, 'daily')),
  ])
  if (exercises.length === 0) return null

  return {
    kind: 'connected_speech',
    id: 'connected_speech',
    title: 'Habla conectada',
    subtitle: 'Cómo suenan de verdad los estadounidenses',
    icon: 'AudioWaveform',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.2)),
  }
}

/**
 * Paso de falsos amigos: elección en contexto entre la trampa y la palabra
 * correcta. Cadencia de días impares para alternar con habla conectada (par),
 * de modo que ninguno de los dos desplace al otro de forma permanente.
 */
export async function buildFalseFriendsStep(
  maxLevel: CefrLevel = 'B1',
): Promise<DailyStep | null> {
  if (dayOfYear() % 2 === 0) return null

  const day = dayOfYear()
  const entries = await fetchFalseFriendsForDay(day, FALSE_FRIENDS_EXERCISE_COUNT, maxLevel)
    .catch(() => [])
  if (entries.length === 0) return null

  const generated = generateFalseFriendExercises(entries, FALSE_FRIENDS_EXERCISE_COUNT, day)
  const exercises = dedupeByContentId(generated.map((ex) => fromGenericExercise(ex, 'daily')))
  if (exercises.length === 0) return null

  return {
    kind: 'false_friends',
    id: 'false_friends',
    title: 'Falsos amigos',
    subtitle: 'Palabras que no significan lo que parecen',
    icon: 'AlertCircle',
    exercises,
    featuredWords: entries.map((e) => e.word),
    // Presented before the exercises: the pair itself is the lesson.
    falseFriends: entries.map(toFalseFriendIntro),
    estMinutes: Math.max(2, Math.round(exercises.length * 1.1)),
  }
}

/** Paso de construcción de oraciones: reorder_words desde text_fragments o IA. */
export async function buildSentenceBuilderStep(
  source: string | null = null,
  weakTopic?: string,
): Promise<DailyStep | null> {
  let exercises: ReturnType<typeof dedupeByContentId> = []

  if (weakTopic) {
    try {
      const aiExercises = await generateReorderAI(
        weakTopic,
        'B1',
        SENTENCE_BUILDER_EXERCISE_COUNT,
        source ?? undefined,
      )
      exercises = dedupeByContentId(aiExercises.map((ex) => fromGenericExercise(ex, 'daily')))
    } catch {
      // offline or auth missing — fall through to static generator
    }
  }

  if (exercises.length === 0) {
    const fragments = await fetchTextFragments(source, 60)
    // Surface fragments whose SRS review is due before random sampling, so the
    // practice→review loop re-delivers sentences the user has previously missed.
    const prioritized = await orderFragmentsByDue(fragments)
    exercises = dedupeByContentId(
      generateReorderFromFragments(prioritized, SENTENCE_BUILDER_EXERCISE_COUNT, {
        preserveOrder: true,
      }).map((ex) => fromGenericExercise(ex, 'daily')),
    )
  }

  if (exercises.length === 0) return null

  return {
    kind: 'sentence_builder',
    id: 'sentence_builder',
    title: 'Constructor de oraciones',
    subtitle: weakTopic
      ? 'Ordena oraciones de tu tema más débil'
      : 'Ordena palabras de tus lecciones',
    icon: 'LayoutList',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.2)),
  }
}

/** Comprehensible-input reader step. null when offline w/o cache or <3 targets. */
export async function buildReaderStep(
  userId: string,
  srsRows: ReaderTargetRow[],
  online: boolean,
): Promise<DailyStep | null> {
  const targets = pickTargets(srsRows)
  if (!targets) return null

  const level = await resolveReaderLevel(userId)
  const passage = await resolveReaderPassage({
    userId,
    targets,
    online,
    now: Date.now(),
    level,
    getCached: getCachedReaderPassage,
    generate: (uid, t) => generateReaderPassage(uid, t, level),
    save: saveReaderPassage,
  })
  if (!passage) return null

  return {
    kind: 'reader',
    id: 'reader',
    title: 'Lectura',
    subtitle: 'Tus palabras recientes, en contexto',
    icon: 'BookOpen',
    exercises: [],
    estMinutes: 3,
    readerPassage: passage,
    featuredWords: passage.targetItems,
  }
}
