import { notFound } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import { LessonDetailActions } from "@/components/lexicon/lesson/LessonDetailActions";
import { WordBrowserClient } from "@/components/lexicon/lesson/WordBrowserClient";
import { PracticeButton } from "@/components/lexicon/lesson/PracticeButton";
import { getCategories, getCategoryWords } from "@/lib/lexicon/categories";
import { getLexiconWordBankDetails } from "@/lib/word-bank/server-queries";
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
  let wordBankDetailsMap: Map<string, { id: string; isFavorite: boolean; srsStatus: string | null }>;
  try {
    wordBankDetailsMap = await getLexiconWordBankDetails(lexiconIds);
  } catch {
    wordBankDetailsMap = new Map();
  }

  function resolveStatus(wordId: string): "learned" | "reviewing" | "new" {
    const entry = wordBankDetailsMap.get(wordId);
    if (!entry) return "new";
    if (entry.srsStatus === "mastered") return "learned";
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
        <LessonDetailActions
          title={category.name}
          totalWords={category.total}
          wordsLearned={wordsLearned}
          wordsReviewing={wordsReviewing}
          color={category.color}
          words={words}
        />
        <div className="flex justify-end">
          <PracticeButton categoryId={id} />
        </div>
        <WordBrowserClient
          words={words}
          color={category.color}
          categoryId={id}
          wordBankMapEntries={Array.from(wordBankDetailsMap.entries()).map(
            ([k, v]) => [k, { id: v.id, isFavorite: v.isFavorite }] as [string, { id: string; isFavorite: boolean }]
          )}
        />
      </Section>
    </PageLayout>
  );
}
