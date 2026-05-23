import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import { LexiconHeader } from "@/components/lexicon";
import { LexiconContent } from "@/components/lexicon/LexiconContent";
import { getCategories, getPreviewTags } from "@/lib/lexicon/categories";
import type { LessonViewModel } from "@/lib/lexicon/types";

export default async function LexiconPage() {
  const categories = getCategories();

  const lessons: LessonViewModel[] = categories.map((cat) => {
    const wordsCompleted = 0;
    const progress = cat.total > 0 ? Math.round((wordsCompleted / cat.total) * 100) : 0;
    return {
      id: cat.id,
      icon: cat.icon,
      title: cat.name,
      color: cat.color,
      totalWords: cat.total,
      wordsCompleted,
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
