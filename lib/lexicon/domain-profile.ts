import { LEXICON_DOMAINS, domainForCategory } from "./domains";
import type { LexiconDomainId } from "./types";

export interface DomainProfile {
  /** Domains ordered by nº of palabras guardadas, desc. */
  domains: Array<{ id: LexiconDomainId; label: string; wordCount: number }>;
  /** Categorías concretas, para prompts que quieran más grano. */
  categories: Array<{ id: string; name: string; wordCount: number }>;
}

export function emptyDomainProfile(): DomainProfile {
  return { domains: [], categories: [] };
}

/** `word_bank.source_ref -> category id[]`, e.g. from public/lexicon/word-index.json. */
export type WordCategoryIndex = ReadonlyMap<string, readonly string[]>;

/**
 * Derives which domains/categories a learner is saving vocabulary from,
 * purely from word_bank rows sourced from the lexicon catalog.
 *
 * A word id can live in more than one category (e.g. "etl" appears in both
 * backend-infra and data-science) — each category it resolves to gets one
 * count, so a single saved word can contribute to more than one bucket.
 *
 * Never throws. Entries with source !== "lexicon" or a source_ref that
 * doesn't resolve are silently skipped.
 */
export function deriveDomainProfile(
  entries: Array<{ source: string | null; source_ref: string | null }>,
  wordIndex: WordCategoryIndex,
  categoryNames?: ReadonlyMap<string, string>,
): DomainProfile {
  const categoryCounts = new Map<string, number>();

  for (const entry of entries) {
    if (entry.source !== "lexicon" || !entry.source_ref) continue;
    const categoryIds = wordIndex.get(entry.source_ref);
    if (!categoryIds) continue;
    for (const categoryId of categoryIds) {
      categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
    }
  }

  const categories = Array.from(categoryCounts.entries())
    .map(([id, wordCount]) => ({ id, name: categoryNames?.get(id) ?? id, wordCount }))
    .sort((a, b) => b.wordCount - a.wordCount);

  const domainCounts = new Map<LexiconDomainId, number>();
  for (const { id, wordCount } of categories) {
    const domainId = domainForCategory(id);
    domainCounts.set(domainId, (domainCounts.get(domainId) ?? 0) + wordCount);
  }

  const domains = Array.from(domainCounts.entries())
    .filter(([, wordCount]) => wordCount > 0)
    .map(([id, wordCount]) => {
      const label = LEXICON_DOMAINS.find((d) => d.id === id)?.name ?? id;
      return { id, label, wordCount };
    })
    .sort((a, b) => b.wordCount - a.wordCount);

  return { domains, categories };
}
