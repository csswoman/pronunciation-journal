import { normalizeCEFR, type CEFRLevel } from '@/lib/exercises/cefr'
import { readStoredCefrLevel } from '@/lib/essential-words/target-level'
import { targetHash } from './target-hash'
import type { ReaderTarget } from './select-targets'
import type { ReaderPassage, ReaderQuestion } from './types'
import { getAllReaderPassages, deleteReaderPassage } from '@/lib/db'

interface GenerateReaderResponse {
  passage: string
  topic: string
  questions: ReaderQuestion[]
}

/**
 * The learner's placed CEFR level for reader grading (Dexie-hydrated at login,
 * offline-safe). Falls back to B1 when unknown so unplaced users still get a
 * reader. Read once by the wiring and passed into both the cache key and the
 * generator so lookup and persistence stay in sync.
 */
export async function resolveReaderLevel(userId: string, defaultLevel: CEFRLevel = 'B1'): Promise<CEFRLevel> {
  return normalizeCEFR((await readStoredCefrLevel(userId)) ?? defaultLevel)
}

/**
 * Generate a reader passage for the given targets via /api/gemini/generate-reader,
 * mapping the AI response into a persistable ReaderPassage. Throws on network or
 * non-OK responses so callers (resolveReaderPassage) can fall back to stale/null.
 * `level` is folded into `targetHash` so a level change yields a fresh passage.
 */
export async function generateReaderPassage(
  userId: string,
  targets: ReaderTarget[],
  level: CEFRLevel,
  topic?: string,
): Promise<ReaderPassage> {
  const words = targets.map((t) => t.word)
  const res = await fetch('/api/gemini/generate-reader', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targets: words,
      level: level.toLowerCase(),
      topic: topic?.trim() || undefined,
    }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || `generate-reader failed: ${res.status}`)
  }
  const data = (await res.json()) as GenerateReaderResponse

  return {
    id: crypto.randomUUID(),
    userId,
    targetItems: words,
    targetSrsIds: targets.map((t) => t.srsId),
    targetHash: targetHash(words, level),
    topic: data.topic,
    passage: data.passage,
    questions: data.questions,
    level,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Calls /api/gemini/reader-audio to retrieve or generate high-fidelity speech
 * audio for the specified passage, caching the result permanently in Supabase Storage.
 */
export async function fetchReaderAudioUrl(
  passageId: string,
  passageText?: string,
  voice?: "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede",
): Promise<string> {
  const res = await fetch('/api/gemini/reader-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passageId, passageText, voice }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || `Audio generation failed (${res.status})`)
  }
  const data = (await res.json()) as { audioUrl: string }
  return data.audioUrl
}

/**
 * Retrieves all saved reader passages for the given user from local Dexie storage.
 */
export async function getUserReaderPassages(userId: string): Promise<ReaderPassage[]> {
  return getAllReaderPassages(userId)
}

/**
 * Deletes a saved reader passage from local Dexie storage.
 */
export async function deleteUserReaderPassage(id: string): Promise<void> {
  return deleteReaderPassage(id)
}
