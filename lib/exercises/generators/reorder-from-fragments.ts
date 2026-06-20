import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { ReorderWordsExercise } from '@/lib/exercises/types'
import { exerciseId, isLikelySentence, pick, shuffle, tokenize } from '@/lib/exercises/utils'

const MIN_TOKENS = 4

/** Shuffles until the result differs from the original order (max 10 attempts). */
function shuffleDistinct(tokens: string[]): string[] {
  if (tokens.length <= 1) return [...tokens]
  let result = shuffle(tokens)
  for (let i = 0; i < 10 && result.every((t, idx) => t === tokens[idx]); i++) {
    result = shuffle(tokens)
  }
  return result
}

export interface TextFragment {
  id: string
  content: string
  source: string | null
  title: string | null
}

/**
 * Fetches text_fragments with fragment_type='sentence' from Supabase.
 *
 * @param source  Optional prefix filter: 'lesson:*', 'grammar-deck:*', or a full source string.
 *                Pass null to fetch from all system sentences.
 * @param limit   Max rows to fetch (default 50, used as a random sample pool).
 */
export async function fetchTextFragments(
  source: string | null = null,
  limit = 50,
): Promise<TextFragment[]> {
  const supabase = getSupabaseBrowserClient()
  let q = supabase
    .from('text_fragments')
    .select('id, content, source, title')
    .eq('fragment_type', 'sentence')
    .is('user_id', null) // system sentences only
    .limit(limit)

  if (source) {
    q = q.ilike('source', `${source}%`)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as TextFragment[]
}

/**
 * Fetches text_fragments for a specific grammar deck slug.
 * Used by GrammarStudyDeck to generate reorder exercises from the current lesson.
 */
export async function fetchFragmentsForDeck(
  deckSlug: string,
  limit = 30,
): Promise<TextFragment[]> {
  return fetchTextFragments(`grammar-deck:${deckSlug}`, limit)
}

/**
 * Generates reorder-words exercises from text_fragments rows.
 * Filters to sentences with at least MIN_TOKENS tokens and shuffles them.
 */
export function generateReorderFromFragments(
  fragments: TextFragment[],
  count: number,
  options: { preserveOrder?: boolean } = {},
): ReorderWordsExercise[] {
  const usable = fragments.filter((f) => {
    // Some seeded `text_fragments` carry notation rows (e.g. "going to → gonna")
    // mislabeled as sentences. Reject anything that isn't a real sentence so it
    // never becomes a nonsensical reorder board.
    if (!isLikelySentence(f.content)) return false
    return tokenize(f.content).length >= MIN_TOKENS
  })

  // preserveOrder=true keeps a caller-supplied ordering (e.g. SRS-due first);
  // otherwise sample randomly for variety across sessions.
  const selected = options.preserveOrder ? usable.slice(0, count) : pick(usable, count)

  return selected.map((fragment) => {
    const tokens = tokenize(fragment.content)
    return {
      id: exerciseId('reorder_words', fragment.id, fragment.content),
      type: 'reorder_words' as const,
      exerciseType: { domain: 'vocabulary', mode: 'reorder', variant: 'sentence' } as const,
      sourceRef: { source: 'text_fragments' as const, id: fragment.id },
      sentence: fragment.content,
      tokens: shuffleDistinct(tokens),
    }
  })
}
