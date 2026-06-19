import { generateConnectedSpeechExercises } from '@/lib/exercises/generators/connected-speech'
import { fetchTextFragments, generateReorderFromFragments } from '@/lib/exercises/generators/reorder-from-fragments'
import { generateReorderAI } from '@/lib/exercises/generators/reorder-ai'
import { fromGenericExercise } from '@/lib/practice/adapters'
import { orderFragmentsByDue } from '@/lib/practice/fragment-priority'
import type { DailyStep } from '@/lib/practice/types'
import { resolveReaderPassage } from '@/lib/practice/reader/get-passage'
import { getCachedReaderPassage, saveReaderPassage } from '@/lib/db'
import { generateReaderPassage } from '@/lib/practice/reader/queries'
import { pickTargets, type ReaderTargetRow } from '@/lib/practice/reader/select-targets'
import { SENTENCE_BUILDER_EXERCISE_COUNT } from './constants'
import { dayOfYear, dedupeByContentId } from './selectors'

/** Paso de habla conectada — solo días pares; null si offline o impar. */
export async function buildConnectedSpeechStep(): Promise<DailyStep | null> {
  if (dayOfYear() % 2 !== 0) return null

  const result = await generateConnectedSpeechExercises(2, 2)
  if (!result) return null

  const exercises = dedupeByContentId([
    ...result.quiz.map((ex) => fromGenericExercise(ex, 'daily')),
    ...result.dictation.map((ex) => fromGenericExercise(ex, 'daily')),
  ])
  if (exercises.length === 0) return null

  return {
    kind: 'connected_speech',
    id: 'connected_speech',
    title: 'Connected speech',
    subtitle: 'How Americans really sound',
    icon: 'AudioWaveform',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.2)),
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
    title: 'Arma la oración',
    subtitle: weakTopic ? `Práctica: ${weakTopic}` : 'Ordena palabras de tus lecciones',
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

  const passage = await resolveReaderPassage({
    userId,
    targets,
    online,
    now: Date.now(),
    getCached: getCachedReaderPassage,
    generate: (uid, t) => generateReaderPassage(uid, t),
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
  }
}
