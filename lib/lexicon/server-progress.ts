import { getCategories, getCategoryWords } from "@/lib/lexicon/categories";
import { getLexiconProgressByCategory } from "@/lib/word-bank/server-queries";

export interface LexiconRetentionStats {
  learned: number;
  total: number;
  percent: number;
}

/** Same mastered/total % as the Lexicon tab hero on /words. */
export async function getLexiconRetentionStats(): Promise<LexiconRetentionStats> {
  const categories = getCategories();
  const categoryWordIds = new Map(
    categories.map((cat) => [cat.id, getCategoryWords(cat.id).map((w) => w.id)]),
  );

  let progressMap: Map<string, { mastered: number; reviewing: number }>;
  try {
    progressMap = await getLexiconProgressByCategory(categoryWordIds);
  } catch {
    progressMap = new Map();
  }

  let learned = 0;
  let total = 0;
  for (const cat of categories) {
    const { mastered = 0 } = progressMap.get(cat.id) ?? {};
    learned += mastered;
    total += cat.total;
  }

  const percent = total > 0 ? Math.round((learned / total) * 100) : 0;

  return { learned, total, percent };
}
