import { db, type CachedExercise } from '@/lib/db'
import type { TranslationEsEnExercise } from './types'
const TTL_MS = 24 * 60 * 60 * 1000
export async function getCachedTranslations(key: string): Promise<TranslationEsEnExercise[] | null> { const rows = await db.generatedExercises.where('id').startsWith(`${key}:`).toArray(); return rows.length && rows.every((row) => Date.now() - Date.parse(row.generatedAt) <= TTL_MS) ? rows.map((row) => row.exercise as TranslationEsEnExercise) : null }
export async function cacheTranslations(exercises: TranslationEsEnExercise[]): Promise<void> { const generatedAt = new Date().toISOString(); await db.generatedExercises.bulkPut(exercises.map((exercise) => ({ id: exercise.id, type: exercise.type, source: exercise.sourceRef.source, generatedAt, exercise }) satisfies CachedExercise)) }
