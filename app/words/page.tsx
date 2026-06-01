import { Suspense } from "react";
import { getCategories, getCategoryWords, getPreviewTags } from "@/lib/lexicon/categories";
import {
  countWordsDueForReview,
  getLexiconProgressByCategory,
  getWordsDueForReview,
} from "@/lib/word-bank/server-queries";
import { WordsClient } from "@/components/words/WordsClient";
import type { LessonViewModel } from "@/lib/lexicon/types";

async function WordsContent() {
  const categories = getCategories();
  const categoryWordIds = new Map(
    categories.map(cat => [cat.id, getCategoryWords(cat.id).map(w => w.id)])
  );

  let progressMap: Map<string, { mastered: number; reviewing: number }>;
  let dueForReview = 0;
  let dueWordLabels: string[] = [];
  try {
    progressMap = await getLexiconProgressByCategory(categoryWordIds);
    dueForReview = await countWordsDueForReview();
    const dueWords = await getWordsDueForReview(4);
    dueWordLabels = dueWords.map((w) => w.text);
  } catch {
    progressMap = new Map();
  }

  const lessons: LessonViewModel[] = categories.map(cat => {
    const { mastered = 0, reviewing = 0 } = progressMap.get(cat.id) ?? {};
    const progress = cat.total > 0 ? Math.round((mastered / cat.total) * 100) : 0;
    return {
      id: cat.id,
      icon: cat.icon,
      title: cat.name,
      color: cat.color,
      totalWords: cat.total,
      wordsCompleted: mastered,
      wordsReviewing: reviewing,
      progress,
      tags: getPreviewTags(cat.id),
    };
  });

  const lexiconLearned = lessons.reduce((sum, l) => sum + l.wordsCompleted, 0);
  const lexiconInProgress = lessons.reduce((sum, l) => sum + l.wordsReviewing, 0);
  const lexiconTotal = lessons.reduce((sum, l) => sum + l.totalWords, 0);
  const lexiconPercent = lexiconTotal > 0 ? Math.round((lexiconLearned / lexiconTotal) * 100) : 0;

  return (
    <WordsClient
      lexiconLessons={lessons}
      lexiconLearned={lexiconLearned}
      lexiconInProgress={lexiconInProgress}
      lexiconTotal={lexiconTotal}
      lexiconPercent={lexiconPercent}
      dueForReview={dueForReview}
      dueWordLabels={dueWordLabels}
    />
  );
}

export default function WordsPage() {
  return (
    <Suspense fallback={<div />}>
      <WordsContent />
    </Suspense>
  );
}
