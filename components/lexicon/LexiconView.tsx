"use client";

import { useMemo, useState } from "react";
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

  const [collapsedDomains, setCollapsedDomains] = useState<Set<string>>(new Set());

  const toggleDomain = (id: string) => {
    setCollapsedDomains(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <>
      {mode === "dictionary" ? (
        <div className="words-lexicon__dictionary-layout">
          <section className="words-lexicon__dictionary-main" aria-labelledby="words-dictionary-title">
            <div className="words-lexicon__sechead">
              <div>
                <p className="words-lexicon__sechead-kicker">Diccionario</p>
                <h2 id="words-dictionary-title">Busca una palabra</h2>
                <p>Definición, pronunciación y ejemplos.</p>
              </div>
            </div>
            <LexiconHeroSearch
              recentWords={recentWords}
              dueWords={dueWordLabels}
              onAddWord={onAddWord}
            />
          </section>
          <aside className="words-lexicon__practice-aside" aria-label="Práctica de vocabulario">
            <LexiconTodayPanel
              dueForReview={dueForReview}
              nextLesson={nextLesson}
              progressUnavailable={progressUnavailable}
            />
            {nextLesson ? (
              <p className="words-lexicon__practice-aside-hint">
                Recomendado: <strong>{nextLesson.title}</strong>
              </p>
            ) : null}
          </aside>
          <section className="words-lexicon__dictionary-categories" aria-labelledby="words-categories-title">
            <div className="words-lexicon__sechead words-lexicon__sechead--spaced">
              <h2 id="words-categories-title">Todas las categorías</h2>
            </div>
            {LEXICON_DOMAINS.map((domain) => {
              const group = domainGroups.find((g) => g.domain.id === domain.id);
              if (!group || group.lessons.length === 0) return null;

              return (
                <div key={domain.id} className="words-lexicon__domain-group">
                  <button
                    type="button"
                    className="words-lexicon__domain-head"
                    onClick={() => toggleDomain(domain.id)}
                    aria-expanded={!collapsedDomains.has(domain.id)}
                  >
                    <h3 className="words-lexicon__domain-name">{domain.name}</h3>
                    <span className="words-lexicon__domain-count">
                      {group.lessons.length} {group.lessons.length === 1 ? "categoría" : "categorías"}
                    </span>
                    <span
                      className="words-lexicon__domain-chevron"
                      aria-hidden
                      style={{ transform: collapsedDomains.has(domain.id) ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 150ms ease-out" }}
                    >
                      ›
                    </span>
                  </button>
                  {!collapsedDomains.has(domain.id) ? (
                    <LessonGrid
                      lessons={group.lessons}
                      onLessonClick={(id) => router.push(`/dictionary/${id}`)}
                      compact
                    />
                  ) : null}
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
              onLessonClick={(id) => router.push(`/dictionary/${id}/practice`)}
            />
          ) : null}
          <section className="words-lexicon__route-picker" aria-labelledby="words-route-picker-title">
            <div className="words-lexicon__sechead">
        <div>
                <p className="words-lexicon__sechead-kicker">Sigue aprendiendo</p>
          <h2 id="words-route-picker-title">Elige un tema</h2>
          <p>Palabras nuevas en contexto.</p>
        </div>
              <Link href="/dictionary" className="words-lexicon__text-link">Ver diccionario</Link>
            </div>
            <LessonGrid
              lessons={suggestedLessons}
              onLessonClick={(id) => router.push(`/dictionary/${id}/practice`)}
            />
          </section>
          <section className="words-lexicon__learn-next" aria-labelledby="words-learn-next-title">
            <div>
              <p className="words-lexicon__sechead-kicker">¿Buscas una palabra concreta?</p>
              <h2 id="words-learn-next-title">Busca en el diccionario</h2>
            </div>
            <Link href="/dictionary" className="words-lexicon__secondary-cta">Abrir diccionario</Link>
          </section>
        </>
      ) : null}

    </>
  );
}
