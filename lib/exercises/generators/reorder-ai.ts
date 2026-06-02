import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { generateReorderFromFragments, type TextFragment } from './reorder-from-fragments'
import type { ReorderWordsExercise } from '@/lib/exercises/types'

/**
 * Generates reorder-words exercises using Gemini-generated sentences.
 * Calls /api/sentences/generate, caches results in text_fragments,
 * and returns exercises immediately.
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
  const supabase = getSupabaseBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch('/api/sentences/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ topic, level, count, deckSlug }),
  })

  if (!res.ok) {
    throw new Error(`Sentence generation failed: ${res.status}`)
  }

  const { fragments } = (await res.json()) as { fragments: TextFragment[] }
  return generateReorderFromFragments(fragments, count)
}
