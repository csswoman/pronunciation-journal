import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getWordsPageLexicon } from "@/lib/lexicon/categories";
import { studyModeForCategory } from "@/lib/lexicon/domains";
import {
  countWordsDueForReview,
  getLexiconProgressByCategory,
  getWordsDueForReview,
} from "@/lib/word-bank/server-queries";
import { getSupabaseServerUserId } from "@/lib/supabase/session";
import { WordsClient } from "@/components/words/WordsClient";
import PageLayout from "@/components/layout/PageLayout";
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
      studyMode: studyModeForCategory(cat.id),
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
    <PageLayout archetype="catalog">
      <div className="space-y-6 pt-2" aria-busy="true" aria-label="Cargando diccionario">
        {/* Header Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border-subtle/50">
          <div className="space-y-2">
            <div className="h-8 w-44 animate-pulse rounded-lg bg-surface-sunken" />
            <div className="h-4 w-60 animate-pulse rounded bg-surface-sunken" />
          </div>
          <div className="h-10 w-48 animate-pulse rounded-full bg-surface-sunken" />
        </div>

        {/* Today Panel Skeleton */}
        <div className="h-32 w-full animate-pulse rounded-2xl border border-border-subtle bg-surface-raised" />

        {/* Search Bar Skeleton */}
        <div className="h-14 w-full animate-pulse rounded-2xl border border-border-subtle bg-surface-raised" />

        {/* Category Grid Skeleton */}
        <div className="space-y-4 pt-4">
          <div className="h-6 w-36 animate-pulse rounded bg-surface-sunken" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-border-subtle bg-surface-raised" />
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
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
