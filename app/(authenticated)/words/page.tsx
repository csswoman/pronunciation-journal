import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getWordsPageLexicon } from "@/lib/lexicon/categories";
import {
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
  let dueForReview = 0;
  let dueWordLabels: string[] = [];
  let progressUnavailable = false;
  try {
    const userId = await getSupabaseServerUserId();
    const [nextProgressMap, nextDueForReview, dueWords] = await Promise.all([
      getLexiconProgressByCategory(categoryWordIds),
      userId ? countWordsDueForReview(userId) : Promise.resolve(0),
      userId ? getWordsDueForReview(userId, 4) : Promise.resolve([]),
    ]);
    progressMap = nextProgressMap;
    dueForReview = nextDueForReview;
    dueWordLabels = dueWords.map((w) => w.text);
  } catch (e) {
    console.error("[WordsContent] Failed to load progress:", e);
    progressUnavailable = true;
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
      dueForReview={dueForReview}
      dueWordLabels={dueWordLabels}
      progressUnavailable={progressUnavailable}
    />
  );
}

function WordsSkeleton() {
  return (
    <div className="words-lexicon p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="shimmer h-8 w-32 rounded-lg bg-surface-sunken" />
        <div className="shimmer h-9 w-48 rounded-full bg-surface-sunken" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-4">
          <div className="shimmer h-6 w-64 rounded-md bg-surface-sunken" />
          <div className="shimmer h-4 w-80 rounded-md bg-surface-sunken" />
          <div className="shimmer h-14 w-full rounded-xl bg-surface-sunken" />
          <div className="grid grid-cols-2 gap-4 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shimmer h-32 rounded-lg bg-surface-sunken" />
            ))}
          </div>
        </div>
        <div className="shimmer h-56 rounded-lg bg-surface-sunken" />
      </div>
    </div>
  );
}

export default async function DictionaryPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  if (tab === "my-words") redirect("/tracking");
  return (
    <Suspense fallback={<WordsSkeleton />}>
      <WordsContent />
    </Suspense>
  );
}
