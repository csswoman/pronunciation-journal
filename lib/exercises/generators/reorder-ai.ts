import { getAccessToken } from '@/lib/auth/session'
import { generateReorderFromFragments, type TextFragment } from './reorder-from-fragments'
import type { ReorderWordsExercise } from '@/lib/exercises/types'

/**
 * Generates reorder-words exercises using Gemini-generated sentences.
 * Calls /api/gemini/generate-sentences, caches results in text_fragments,
 * and splits into ReorderWordsExercise instances.
 *
 * @param topic    Subject or grammar concept (e.g. "present simple questions")
 * @param level    CEFR level string (e.g. "A2", "B1")
 * @param count    Number of exercises to generate (default 8)
 * @param deckSlug Optional: grammar deck slug to tag sentences with
 */
export async function generateReorderAI(
  topic: string,
  level = 'B1',
  count = 8,
  deckSlug?: string,
): Promise<ReorderWordsExercise[]> {
  const accessToken = await getAccessToken()

  const res = await fetch('/api/gemini/generate-sentences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ topic, level, count, deckSlug }),
  })

  if (!res.ok) {
    throw new Error(`Sentence generation failed: ${res.status}`)
  }

  const { fragments } = (await res.json()) as { fragments: TextFragment[] }
  const exercises = generateReorderFromFragments(fragments, count)
  return exercises.map((ex) => ({ ...ex, topic }))
}
