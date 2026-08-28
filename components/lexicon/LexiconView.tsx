"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LexiconHeroSearch } from "@/components/lexicon/LexiconHeroSearch";
import { LexiconTodayPanel } from "@/components/lexicon/LexiconTodayPanel";
import { LexiconProgressStrip } from "@/components/lexicon/LexiconProgressStrip";
import { LexiconContinueSection } from "@/components/lexicon/LexiconContinueSection";
import { LessonGrid } from "@/components/lexicon/LessonGrid";
import { groupLessonsByDomain, LEXICON_DOMAINS } from "@/lib/lexicon/domains";
import type { LessonViewModel } from "@/lib/lexicon/types";
import type { WordsMode } from "@/components/words/WordsTopbar";

interface LexiconViewProps {
  lessons: LessonViewModel[];
  lexiconTotal: number;
  lexiconLearned: number;
  lexiconInProgress: number;
  lexiconPercent: number;
  dueForReview?: number;
  recentWords?: string[];
  dueWordLabels?: string[];
  onAddWord?: (text: string) => void;
  progressUnavailable?: boolean;
  mode?: WordsMode;
}

export function LexiconView({
  lessons,
  lexiconTotal,
  lexiconLearned,
  lexiconInProgress,
  lexiconPercent,
  dueForReview = 0,
  recentWords = [],
  dueWordLabels = [],
  onAddWord,
  progressUnavailable = false,
  mode = "dictionary",
}: LexiconViewProps) {
  const router = useRouter();
  const notStarted = Math.max(0, lexiconTotal - lexiconLearned - lexiconInProgress);

  const inProgress = useMemo(() => {
    const active = lessons.filter((l) => l.progress > 0 && l.progress < 100);
    active.sort((a, b) => b.progress - a.progress);
    return active;
  }, [lessons]);

  const domainGroups = useMemo(
    () => groupLessonsByDomain(lessons, []),
    [lessons]
  );

  const nextLesson = inProgress[0] ?? lessons.find((lesson) => lesson.progress === 0) ?? null;

  const suggestedLessons = useMemo(() => {
    const untouched = lessons.filter((lesson) => lesson.progress === 0 && lesson.id !== nextLesson?.id);
    const fallback = lessons.filter((lesson) => lesson.id !== nextLesson?.id);
    return (untouched.length > 0 ? untouched : fallback).slice(0, 3);
  }, [lessons, nextLesson?.id]);

  return (
    <>
      {mode === "dictionary" ? (
        <div className="words-lexicon__dictionary-flow space-y-6 pt-2">
          <LexiconTodayPanel
            dueForReview={dueForReview}
            nextLesson={nextLesson}
            dueWordLabels={dueWordLabels}
            progressUnavailable={progressUnavailable}
          />

          <LexiconHeroSearch
            recentWords={recentWords}
            dueWords={dueWordLabels}
            onAddWord={onAddWord}
          />

          <section className="words-lexicon__dictionary-categories space-y-8 pt-2" aria-label="Categorías de vocabulario">
            {LEXICON_DOMAINS.map((domain) => {
              const group = domainGroups.find((g) => g.domain.id === domain.id);
              if (!group || group.lessons.length === 0) return null;

              return (
                <div key={domain.id} className="words-lexicon__domain-group space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border-subtle/40">
                    <div className="flex items-center gap-3">
                      <h3 className="text-h3 font-bold text-fg">{domain.name}</h3>
                      <span className="rounded-full bg-primary-soft/80 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-semibold">
                        {domain.studyMode === "receptive" ? "Reconocer" : "Producir"}
                      </span>
                    </div>
                    <p className="text-caption sm:text-body-sm text-fg-muted max-w-md text-right">
                      {domain.description}
                    </p>
                  </div>
                  <LessonGrid
                    lessons={group.lessons}
                    nextLessonId={nextLesson?.id}
                    onLessonClick={(id) => router.push(`/lexicon/${id}`)}
                    compact
                  />
                </div>
              );
            })}
          </section>
        </div>
      ) : null}

      {mode === "learn" && (lexiconLearned > 0 || lexiconInProgress > 0 || dueForReview > 0) ? (
        <LexiconProgressStrip
          percent={lexiconPercent}
          learned={lexiconLearned}
          inProgress={lexiconInProgress}
          notStarted={notStarted}
          dueForReview={dueForReview}
        />
      ) : null}

      {mode === "learn" ? (
        <>
          {inProgress.length > 0 ? (
            <LexiconContinueSection
              lessons={inProgress}
              onLessonClick={(id) => router.push(`/lexicon/${id}/practice`)}
            />
          ) : null}
          <section className="words-lexicon__route-picker" aria-labelledby="words-route-picker-title">
            <div className="words-lexicon__sechead">
        <div>
                <p className="words-lexicon__sechead-kicker">Sigue aprendiendo</p>
          <h2 id="words-route-picker-title">Elige un tema</h2>
          <p>Palabras nuevas en contexto.</p>
        </div>
              <Link href="/words" className="words-lexicon__text-link">Ver diccionario</Link>
            </div>
            <LessonGrid
              lessons={suggestedLessons}
              onLessonClick={(id) => router.push(`/lexicon/${id}/practice`)}
            />
          </section>
          <section className="words-lexicon__learn-next" aria-labelledby="words-learn-next-title">
            <div>
              <p className="words-lexicon__sechead-kicker">¿Buscas una palabra concreta?</p>
              <h2 id="words-learn-next-title">Busca en el diccionario</h2>
            </div>
            <Link href="/words" className="words-lexicon__secondary-cta">Abrir diccionario</Link>
          </section>
        </>
      ) : null}

    </>
  );
}
