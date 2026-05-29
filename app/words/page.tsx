import { getCategories, getCategoryWords, getPreviewTags } from "@/lib/lexicon/categories";
import { getLexiconProgressByCategory } from "@/lib/word-bank/server-queries";
import { WordsClient } from "@/components/words/WordsClient";
import type { LessonViewModel } from "@/lib/lexicon/types";

export default async function WordsPage() {
  const categories = getCategories();
  const categoryWordIds = new Map(
    categories.map(cat => [cat.id, getCategoryWords(cat.id).map(w => w.id)])
  );

  let progressMap: Map<string, { mastered: number; reviewing: number }>;
  try {
    progressMap = await getLexiconProgressByCategory(categoryWordIds);
  } catch {
    progressMap = new Map();
  }

  const lessons: LessonViewModel[] = categories.map(cat => {
    const { mastered = 0 } = progressMap.get(cat.id) ?? {};
    const progress = cat.total > 0 ? Math.round((mastered / cat.total) * 100) : 0;
    return {
      id: cat.id,
      icon: cat.icon,
      title: cat.name,
      color: cat.color,
      totalWords: cat.total,
      wordsCompleted: mastered,
      progress,
      tags: getPreviewTags(cat.id),
    };
  });

  const lexiconLearned = lessons.reduce((sum, l) => sum + l.wordsCompleted, 0);
  const lexiconTotal = lessons.reduce((sum, l) => sum + l.totalWords, 0);

  return (
    <WordsClient
      lexiconLessons={lessons}
      lexiconLearned={lexiconLearned}
      lexiconTotal={lexiconTotal}
    />
  );
}
