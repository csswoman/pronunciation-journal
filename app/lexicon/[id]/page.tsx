import { notFound } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import { LessonDetailHeader } from "@/components/lexicon/lesson/LessonDetailHeader";
import { WordBrowser } from "@/components/lexicon/lesson/WordBrowser";
import { getCategories, getCategoryWords } from "@/lib/lexicon/categories";
import type { Word } from "@/components/lexicon/lesson/WordGrid";

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const categories = getCategories();
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const rawWords = getCategoryWords(id);
  const wordsLearned = 0;

  const words: Word[] = rawWords.map((w) => ({
    id: w.id,
    word: w.word,
    partOfSpeech: w.pos,
    definition: w.definition,
    example: w.example,
    status: "new" as const,
    difficulty: w.difficulty,
  }));

  return (
    <PageLayout cardWrapper={false}>
      <Section spacing="lg">
        <LessonDetailHeader
          title={category.name}
          totalWords={category.total}
          wordsLearned={wordsLearned}
          wordsReviewing={0}
          color={category.color}
        />
        <WordBrowser words={words} color={category.color} />
      </Section>
    </PageLayout>
  );
}
