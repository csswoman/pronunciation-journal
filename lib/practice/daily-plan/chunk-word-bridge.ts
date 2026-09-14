import type { LearningChunk } from '@/lib/chunk-of-day/types'
import type { WordBankEntry } from '@/lib/word-bank/types'

/**
 * The daily fallback historically exposes Essential Words as `core1k:` while
 * the durable SRS/content-graph namespace is `c1k:`. Normalize that one
 * legacy presentation alias before comparing authored IDs; never infer a link
 * from the visible spelling of a word.
 */
function comparableWordId(id: string): string {
  return id.startsWith('core1k:') ? `c1k:${id.slice('core1k:'.length)}` : id
}

/**
 * Preserves the SRS-selected set while putting words explicitly anchored to
 * today's chunks first. Missing or unlinked anchors preserve input order.
 */
export function biasWordsByChunkAnchors(
  words: WordBankEntry[],
  chunks: readonly LearningChunk[],
): WordBankEntry[] {
  const anchorIds = new Set(chunks.flatMap((chunk) => chunk.contentGraph.anchors.map((anchor) => anchor.id)))
  if (anchorIds.size === 0) return words

  const matching = words.filter((word) => anchorIds.has(comparableWordId(word.id)))
  if (matching.length === 0) return words

  const matchingIds = new Set(matching.map((word) => word.id))
  return [...matching, ...words.filter((word) => !matchingIds.has(word.id))]
}
