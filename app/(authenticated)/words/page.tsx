import { Suspense } from "react";
import { getWordsPageLexicon } from "@/lib/lexicon/categories";
import {
  countMyWords,
  countUserDecks,
  countWordsDueForReview,
  getLexiconProgressByCategory,
  getWordsDueForReview,
} from "@/lib/word-bank/server-queries";
import { getSupabaseServerUserId } from "@/lib/supabase/session";
import { WordsClient } from "@/components/words/WordsClient";
import type { LessonViewModel } from "@/lib/lexicon/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function WordsContent() {
  const { categories, categoryWordIds, previewTags } = getWordsPageLexicon();

  let progressMap: Map<string, { mastered: number; reviewing: number }>;
  let myWordsCount = 0;
  let deckCount = 0;
  let dueForReview = 0;
  let dueWordLabels: string[] = [];
  try {
    const userId = await getSupabaseServerUserId();
    progressMap = await getLexiconProgressByCategory(categoryWordIds);
    if (userId) {
      [myWordsCount, deckCount] = await Promise.all([
        countMyWords(userId),
        countUserDecks(userId),
      ]);
    }
    dueForReview = await countWordsDueForReview();
    const dueWords = userId ? await getWordsDueForReview(userId, 4) : [];
    dueWordLabels = dueWords.map((w) => w.text);
  } catch (e) {
    console.error("[WordsContent] Failed to load progress:", e);
    progressMap = new Map();
    dueForReview = 0;
    dueWordLabels = [];
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
      tags: previewTags.get(cat.id) ?? [],
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
      myWordsCount={myWordsCount}
      deckCount={deckCount}
      dueForReview={dueForReview}
      dueWordLabels={dueWordLabels}
    />
  );
}

function WordsSkeleton() {
  return (
    <div className="words-lexicon p-4">
      {/* Topbar skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="shimmer h-8 w-32 rounded-lg bg-surface-sunken" />
        <div className="shimmer h-9 w-48 rounded-full bg-surface-sunken" />
      </div>
      {/* Hero search skeleton */}
      <div className="shimmer h-6 w-64 rounded-md bg-surface-sunken mb-2" />
      <div className="shimmer h-4 w-48 rounded-md bg-surface-sunken mb-4" />
      <div className="shimmer h-14 w-full max-w-2xl rounded-xl bg-surface-sunken mb-6" />
      {/* Progress strip skeleton */}
      <div className="shimmer h-10 w-full rounded-lg bg-surface-sunken mb-8" />
      {/* Card grid skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shimmer h-40 rounded-xl bg-surface-sunken" />
        ))}
      </div>
    </div>
  );
}

export default function WordsPage() {
  return (
    <Suspense fallback={<WordsSkeleton />}>
      <WordsContent />
    </Suspense>
  );
}
