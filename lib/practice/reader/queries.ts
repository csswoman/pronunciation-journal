import { normalizeCEFR } from '@/lib/exercises/cefr'
import { targetHash } from './target-hash'
import type { ReaderTarget } from './select-targets'
import type { ReaderPassage, ReaderQuestion } from './types'

interface GenerateReaderResponse {
  passage: string
  topic: string
  questions: ReaderQuestion[]
}

/**
 * Generate a reader passage for the given targets via /api/gemini/generate-reader,
 * mapping the AI response into a persistable ReaderPassage. Throws on network or
 * non-OK responses so callers (resolveReaderPassage) can fall back to stale/null.
 */
export async function generateReaderPassage(
  userId: string,
  targets: ReaderTarget[],
): Promise<ReaderPassage> {
  const words = targets.map((t) => t.word)
  const res = await fetch('/api/gemini/generate-reader', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targets: words, level: 'b1' }),
  })
  if (!res.ok) throw new Error(`generate-reader failed: ${res.status}`)
  const data = (await res.json()) as GenerateReaderResponse

  return {
    id: crypto.randomUUID(),
    userId,
    targetItems: words,
    targetSrsIds: targets.map((t) => t.srsId),
    targetHash: targetHash(words),
    topic: data.topic,
    passage: data.passage,
    questions: data.questions,
    level: normalizeCEFR('b1'),
    createdAt: new Date().toISOString(),
  }
}
