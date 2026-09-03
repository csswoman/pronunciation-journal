"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LexiconHeroSearch } from "@/components/lexicon/LexiconHeroSearch";
import { LexiconTodayPanel } from "@/components/lexicon/LexiconTodayPanel";
import { LexiconProgressStrip } from "@/components/lexicon/LexiconProgressStrip";
import { LexiconContinueSection } from "@/components/lexicon/LexiconContinueSection";
import { LessonGrid } from "@/components/lexicon/LessonGrid";
import { AnkiDeckGrid } from "@/components/lexicon/AnkiDeckGrid";
import { LexiconInlinePractice } from "@/components/lexicon/practice/LexiconInlinePractice";
import { groupLessonsByDomain, LEXICON_DOMAINS } from "@/lib/lexicon/domains";
import type { LessonViewModel } from "@/lib/lexicon/types";
import type { WordsMode } from "@/components/words/WordsTopbar";

// Subcomponent structure:
// <LexiconView>
//   {mode === "dictionary" && (
//     <DictionaryFlow>
//       <LexiconTodayPanel />
//       <LexiconHeroSearch />
//       <DomainCategoriesSection>
//         <DomainGroup>
//           <DomainHeader />
//           <LessonGrid />
//         </DomainGroup>
//       </DomainCategoriesSection>
//     </DictionaryFlow>
//   )}
//   {mode === "learn" && activeDeckId && <LexiconInlinePractice />}
//   {mode === "learn" && !activeDeckId && (
//     <LearnFlow>
//       <AnkiReviewBanner />
//       <LexiconProgressStrip />
//       <LexiconContinueSection />
//       <AnkiStudioSection>
//         <AnkiDeckGrid />
//       </AnkiStudioSection>
//     </LearnFlow>
//   )}
// </LexiconView>

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
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
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

  return (
    <>
      {mode === "dictionary" ? (
        <div className="space-y-6 pt-2">
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

          <section className="space-y-8 pt-2" aria-label="Categorías de vocabulario">
            {LEXICON_DOMAINS.map((domain) => {
              const group = domainGroups.find((g) => g.domain.id === domain.id);
              if (!group || group.lessons.length === 0) return null;

              return (
                <div key={domain.id} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-border-subtle/50">
                    <div className="flex items-center gap-3">
                      <h3 className="text-h3 font-bold text-fg tracking-tight">{domain.name}</h3>
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
                    onLessonClick={(id) => router.push(`/words/${id}`)}
                    compact
                  />
                </div>
              );
            })}
          </section>
        </div>
      ) : null}

      {mode === "learn" && activeDeckId !== null ? (
        <div className="pt-2">
          <LexiconInlinePractice
            categoryId={activeDeckId}
            onExit={() => setActiveDeckId(null)}
          />
        </div>
      ) : null}

      {mode === "learn" && activeDeckId === null ? (
        <div className="space-y-8 pt-3">
          {dueForReview > 0 && (
            <div className="group relative rounded-2xl border border-border-subtle bg-surface-raised p-6 sm:p-7 flex flex-wrap items-center justify-between gap-6 shadow-xs hover:border-border-strong transition-all duration-200">
              <div className="space-y-2 flex-1 min-w-[280px]">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft/80 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <span className="font-kicker text-[11px] uppercase tracking-wider">REPASO ANKI PENDIENTE</span>
                </div>
                <h3 className="text-h4 sm:text-h3 font-bold text-fg tracking-tight leading-snug">
                  Tienes {dueForReview} {dueForReview === 1 ? "palabra" : "palabras"} por repasar hoy
                </h3>
                <p className="text-body-sm text-fg-muted max-w-xl leading-relaxed">
                  Refuerza tu memoria con tarjetas de repaso adaptativo combinando palabras de todos tus mazos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDeckId(nextLesson?.id ?? "backend-infra")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cta-bg text-cta-fg px-6 py-3.5 text-body-sm font-semibold hover:bg-cta-bg-hover active:scale-[0.98] transition-all shadow-xs focus-ring shrink-0"
              >
                <span>Iniciar repaso Anki mixto ({dueForReview})</span>
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </button>
            </div>
          )}

          <LexiconProgressStrip
            percent={lexiconPercent}
            learned={lexiconLearned}
            inProgress={lexiconInProgress}
            notStarted={notStarted}
          />

          {inProgress.length > 0 ? (
            <LexiconContinueSection
              lessons={inProgress}
              onLessonClick={(id) => setActiveDeckId(id)}
            />
          ) : null}

          <section className="space-y-5 pt-1" aria-labelledby="words-anki-studio-title">
            <div className="space-y-1 pb-3 border-b border-border-subtle/50">
              <p className="font-kicker text-fg-subtle">MAZOS ANKI</p>
              <h2 id="words-anki-studio-title" className="text-h3 font-bold text-fg tracking-tight">
                Selecciona un mazo para practicar
              </h2>
              <p className="text-body-sm text-fg-muted">Explora tus mazos de vocabulario e inicia el repaso de tarjetas Anki directamente aquí.</p>
            </div>

            <AnkiDeckGrid
              lessons={lessons}
              onSelectDeck={(id) => setActiveDeckId(id)}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}

