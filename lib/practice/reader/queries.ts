import { normalizeCEFR, type CEFRLevel } from '@/lib/exercises/cefr'
import { readStoredCefrLevel } from '@/lib/core-1000/target-level'
import { targetHash } from './target-hash'
import type { ReaderTarget } from './select-targets'
import type { ReaderPassage, ReaderQuestion } from './types'

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
export async function resolveReaderLevel(userId: string): Promise<CEFRLevel> {
  return normalizeCEFR((await readStoredCefrLevel(userId)) ?? 'B1')
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
): Promise<ReaderPassage> {
  const words = targets.map((t) => t.word)
  const res = await fetch('/api/gemini/generate-reader', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targets: words, level: level.toLowerCase() }),
  })
  if (!res.ok) throw new Error(`generate-reader failed: ${res.status}`)
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
