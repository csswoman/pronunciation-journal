import { generateConnectedSpeechExercises } from '@/lib/exercises/generators/connected-speech'
import { fetchTextFragments, generateReorderFromFragments } from '@/lib/exercises/generators/reorder-from-fragments'
import { generateReorderAI } from '@/lib/exercises/generators/reorder-ai'
import { fromGenericExercise } from '@/lib/practice/adapters'
import type { DailyStep } from '@/lib/practice/types'
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
    exercises = dedupeByContentId(
      generateReorderFromFragments(fragments, SENTENCE_BUILDER_EXERCISE_COUNT).map((ex) =>
        fromGenericExercise(ex, 'daily'),
      ),
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
