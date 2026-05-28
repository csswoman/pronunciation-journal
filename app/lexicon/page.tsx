import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import { LexiconHeader } from "@/components/lexicon";
import { LexiconContent } from "@/components/lexicon/LexiconContent";
import { getCategories, getCategoryWords, getPreviewTags } from "@/lib/lexicon/categories";
import { getLexiconProgressByCategory } from "@/lib/word-bank/server-queries";
import type { LessonViewModel } from "@/lib/lexicon/types";

export default async function LexiconPage() {
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

  const lessons: LessonViewModel[] = categories.map((cat) => {
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

  const totalWordsLearned = lessons.reduce((sum, l) => sum + l.wordsCompleted, 0);
  const totalWords = lessons.reduce((sum, l) => sum + l.totalWords, 0);
  const percentageDone = totalWords > 0 ? (totalWordsLearned / totalWords) * 100 : 0;

  return (
    <PageLayout cardWrapper={false}>
      <Section spacing="lg">
        <LexiconHeader
          wordsLearned={totalWordsLearned}
          totalWords={totalWords}
          percentageDone={percentageDone}
        />
        <LexiconContent lessons={lessons} />
       </Section>
    </PageLayout>
  );
}
