import { notFound } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import { LessonDetailHeader } from "@/components/lexicon/lesson/LessonDetailHeader";
import { WordBrowser } from "@/components/lexicon/lesson/WordBrowser";
import { PracticeButton } from "@/components/lexicon/lesson/PracticeButton";
import { getCategories, getCategoryWords } from "@/lib/lexicon/categories";
import { getLexiconWordBankMap } from "@/lib/word-bank/server-queries";
import type { Word } from "@/components/lexicon/lesson/WordGrid";

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const categories = getCategories();
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const rawWords = getCategoryWords(id);
  const lexiconIds = rawWords.map((w) => w.id);

  // Fetch which of these words the user already has in word_bank (by source_ref).
  // Falls back to empty map if the user is not logged in.
  let wordBankMap: Map<string, string>;
  try {
    wordBankMap = await getLexiconWordBankMap(lexiconIds);
  } catch {
    wordBankMap = new Map();
  }

  function resolveStatus(wordId: string): "learned" | "reviewing" | "new" {
    const srsStatus = wordBankMap.get(wordId);
    if (!srsStatus) return "new";
    if (srsStatus === "mastered") return "learned";
    return "reviewing";
  }

  const words: Word[] = rawWords.map((w) => ({
    id: w.id,
    word: w.word,
    partOfSpeech: w.pos,
    definition: w.definition,
    example: w.example,
    status: resolveStatus(w.id),
    difficulty: w.difficulty,
  }));

  const wordsLearned = words.filter((w) => w.status === "learned").length;
  const wordsReviewing = words.filter((w) => w.status === "reviewing").length;

  return (
    <PageLayout cardWrapper={false}>
      <Section spacing="lg">
        <LessonDetailHeader
          title={category.name}
          totalWords={category.total}
          wordsLearned={wordsLearned}
          wordsReviewing={wordsReviewing}
          color={category.color}
        />
        <div className="flex justify-end">
          <PracticeButton categoryId={id} />
        </div>
        <WordBrowser words={words} color={category.color} categoryId={id} />
      </Section>
    </PageLayout>
  );
}
