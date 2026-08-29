"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";

import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { type WordsMode, WordsTopbar } from "@/components/words/WordsTopbar";
import type { LessonViewModel } from "@/lib/lexicon/types";

const LexiconTabRuntime = dynamic(() => import("./tabs/LexiconTabRuntime"), {
  loading: () => <WordsRuntimeSkeleton />,
});

interface WordsClientProps {
  lexiconLessons: LessonViewModel[];
  lexiconLearned: number;
  lexiconInProgress: number;
  lexiconTotal: number;
  lexiconPercent: number;
  dueForReview?: number;
  dueWordLabels?: string[];
  progressUnavailable?: boolean;
}

function WordsRuntimeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="words-lexicon__contextbar">
        <div className="shimmer h-5 w-48 rounded-full bg-surface-sunken" />
        <div className="shimmer h-9 w-28 rounded-full bg-surface-sunken" />
      </div>
      <div className="space-y-3">
        <div className="shimmer h-20 rounded-2xl bg-surface-sunken" />
        <div className="shimmer h-20 rounded-2xl bg-surface-sunken" />
        <div className="shimmer h-20 rounded-2xl bg-surface-sunken" />
      </div>
    </div>
  );
}

export function WordsClient({
  lexiconLessons,
  lexiconLearned,
  lexiconInProgress,
  lexiconTotal,
  lexiconPercent,
  dueForReview = 0,
  dueWordLabels = [],
  progressUnavailable = false,
}: WordsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawMode = searchParams.get("mode");
  const activeMode: WordsMode = rawMode === "learn" ? "learn" : "dictionary";

  const pageTitle = activeMode === "learn" ? "Mazos de Aprendizaje" : "Diccionario";
  const pageSubtitle = activeMode === "learn"
    ? `${lexiconTotal} tarjetas · ${lexiconLessons.length} mazos Anki`
    : `${lexiconTotal} términos · ${lexiconLessons.length} categorías`;

  return (
    <PageLayout archetype="catalog">
      <div className="words-lexicon">
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={<WordsTopbar activeMode={activeMode} lexiconCount={lexiconTotal} />}
        />

        {progressUnavailable ? (
          <div className="words-lexicon__data-alert" role="status">
            <div>
              <strong>No pudimos cargar tu progreso.</strong>
              <p>Tu avance no se ha borrado. Puedes reintentar o seguir explorando el diccionario.</p>
            </div>
            <button type="button" onClick={() => router.refresh()} className="words-lexicon__data-alert-action">
              Reintentar
            </button>
          </div>
        ) : null}

        <LexiconTabRuntime
          lexiconLessons={lexiconLessons}
          lexiconLearned={lexiconLearned}
          lexiconInProgress={lexiconInProgress}
          lexiconTotal={lexiconTotal}
          lexiconPercent={lexiconPercent}
          dueForReview={dueForReview}
          dueWordLabels={dueWordLabels}
          progressUnavailable={progressUnavailable}
          mode={activeMode}
        />

      </div>
    </PageLayout>
  );
}

