import { db, type CachedExercise } from '@/lib/db'
import type { SentenceTransformationExercise } from '@/lib/exercises/types'

const TTL_MS = 24 * 60 * 60 * 1000

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('en-US')
    .replaceAll('’', "'")
    .replace(/[^a-z0-9'\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Only explicit reference answers are accepted locally; never infer semantic equivalence. */
export function isExactTransformation(
  exercise: SentenceTransformationExercise,
  answer: string,
): boolean {
  if (!exercise.referenceAnswer) return false
  return normalize(exercise.referenceAnswer) === normalize(answer)
}

export async function getCachedTransformations(cacheKey: string): Promise<SentenceTransformationExercise[] | null> {
  const rows = await db.generatedExercises.where('id').startsWith(`${cacheKey}:`).toArray()
  if (!rows.length || rows.some((row) => Date.now() - Date.parse(row.generatedAt) > TTL_MS)) return null
  return rows.map((row) => row.exercise as SentenceTransformationExercise)
}

export async function cacheTransformations(exercises: SentenceTransformationExercise[]): Promise<void> {
  const generatedAt = new Date().toISOString()
  await db.generatedExercises.bulkPut(
    exercises.map(
      (exercise) =>
        ({
          id: exercise.id,
          type: exercise.type,
          source: exercise.sourceRef.source,
          generatedAt,
          exercise,
        }) satisfies CachedExercise,
    ),
  )
}

