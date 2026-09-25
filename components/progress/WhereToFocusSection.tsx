"use client";

// Planned structure:
// <WhereToFocusSection>
//   <SectionHeader title="Dónde enfocar" subtitle="Las tres dimensiones con más margen de mejora." />
//   <FocusCardsGrid>
//     <SoundLabFocusCard phonemes={weakestPhonemes} subtlePagination />
//     <LexiconFocusCard wordsByStatus={wordsByStatus} />
//     <CoachFocusCard coach={coach} learnerLevel={learnerLevel} subtlePagination />
//   </FocusCardsGrid>
// </WhereToFocusSection>

import { useState } from "react";
import Link from "next/link";
import { Volume2, BookOpen, Sparkles, ChevronLeft, ChevronRight } from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
import { topicDisplayLabel } from "@/lib/practice/topic-labels";
import type { SkillProfileData, CoachInsights } from "@/lib/progress/queries";
import type { LearnerLevelResolution } from "@/lib/learner-level/core";

interface Props {
  data: SkillProfileData;
  coach: CoachInsights;
  learnerLevel: LearnerLevelResolution;
}

const ITEMS_PER_PAGE = 2;

export function WhereToFocusSection({ data, coach, learnerLevel }: Props) {
  // Sound Lab Pagination
  const [phonemePage, setPhonemePage] = useState(1);
  const totalPhonemes = data.weakestPhonemes.length;
  const totalPhonemePages = Math.ceil(totalPhonemes / ITEMS_PER_PAGE);
  const samplePhonemes = data.weakestPhonemes.slice(
    (phonemePage - 1) * ITEMS_PER_PAGE,
    phonemePage * ITEMS_PER_PAGE,
  );

  // Dictionary calculations
  const words = data.wordsByStatus;
  const totalWords = words.new + words.learning + words.review + words.mastered + (words.legacyMastered ?? 0);
  const hasWordData = totalWords > 0;
  const pctNew = hasWordData ? Math.round((words.new / totalWords) * 100) : 0;
  const pctLearning = hasWordData ? Math.round((words.learning / totalWords) * 100) : 0;
  const pctReview = hasWordData ? Math.round((words.review / totalWords) * 100) : 0;
  const toReviewCount = words.review + words.learning;
  const needsVerificationCount = words.legacyMastered ?? 0;

  // Coach Weak Topics Pagination
  const [topicPage, setTopicPage] = useState(1);
  const totalTopics = coach.weakTopics.length;
  const totalTopicPages = Math.ceil(totalTopics / ITEMS_PER_PAGE);
  const sampleWeakTopics = coach.weakTopics.slice(
    (topicPage - 1) * ITEMS_PER_PAGE,
    topicPage * ITEMS_PER_PAGE,
  );

  return (
    <section className="flex flex-col gap-4" aria-label="Dónde enfocar">
      {/* Header */}
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-fg">
          Dónde enfocar
        </h2>
        <span className="text-sm sm:text-base font-medium text-fg-muted">
          Las tres dimensiones con más margen de mejora según tu práctica.
        </span>
      </div>

      {/* Grid of 3 Focus Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
        {/* 1. Sound Lab (Coral) */}
        <PastelCard tone="coral" className="p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Volume2 size={18} className="text-ink" aria-hidden="true" />
                <span className="font-kicker font-bold text-xs sm:text-sm uppercase tracking-wider text-ink-secondary">
                  SOUND LAB
                </span>
              </div>
              {/* Subtle Pagination for Phonemes */}
              {totalPhonemePages > 1 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink-secondary">
                  <button
                    type="button"
                    disabled={phonemePage === 1}
                    onClick={() => setPhonemePage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-full hover:bg-ink/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior de sonidos"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="tabular-nums">{phonemePage}/{totalPhonemePages}</span>
                  <button
                    type="button"
                    disabled={phonemePage === totalPhonemePages}
                    onClick={() => setPhonemePage((p) => Math.min(totalPhonemePages, p + 1))}
                    className="p-1 rounded-full hover:bg-ink/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página siguiente de sonidos"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-ink leading-tight mt-2">
              Sonidos a reforzar
            </h3>

            {/* Phonemes list */}
            {samplePhonemes.length > 0 ? (
              <div className="mt-5 flex flex-col gap-4">
                {samplePhonemes.map((p) => (
                  <div key={p.ipa} className="flex items-center gap-3 group">
                    <span className="font-ipa text-lg sm:text-xl font-bold text-ink w-10 shrink-0 group-hover:scale-110 transition-transform">
                      /{p.ipa}/
                    </span>
                    <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-ink/15">
                      <div
                        className="h-full rounded-full bg-ink transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(100, Math.max(0, p.accuracy))}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-display text-base sm:text-lg font-extrabold text-ink tabular-nums shrink-0">
                      {p.accuracy} %
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm sm:text-base font-medium text-ink-secondary">
                Practica en Sound Lab para ver aquí tus sonidos más débiles.
              </p>
            )}
          </div>

          <Link
            href="/practice"
            className="mt-6 block w-full rounded-full bg-ink py-3 px-5 text-center font-bold text-base text-paper shadow-xs hover:opacity-90 active:scale-[0.97] transition-all focus-ring"
          >
            Practicar estos sonidos
          </Link>
        </PastelCard>

        {/* 2. Diccionario (Surface Raised) */}
        <div className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface-raised p-6 sm:p-7 transition-all duration-300 hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-fg" aria-hidden="true" />
                <span className="font-kicker font-bold text-xs sm:text-sm uppercase tracking-wider text-fg-subtle">
                  DICCIONARIO
                </span>
              </div>
              {hasWordData && (
                <div className="text-right">
                  <span className="font-display text-2xl sm:text-3xl font-extrabold text-fg leading-none">
                    {toReviewCount}
                  </span>
                  <span className="block text-xs sm:text-sm font-semibold text-fg-muted mt-0.5">
                    por repasar
                  </span>
                </div>
              )}
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-fg leading-tight mt-2">
              Vocabulario
            </h3>

            {hasWordData ? (
              <>
                {/* Segmented bar */}
                <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full bg-surface-sunken">
                  <div style={{ width: `${pctNew}%` }} className="bg-butter" title={`Nuevas ${pctNew}%`} />
                  <div style={{ width: `${pctLearning}%` }} className="bg-lilac" title={`En aprendizaje ${pctLearning}%`} />
                  <div style={{ width: `${pctReview}%` }} className="bg-mint" title={`En repaso ${pctReview}%`} />
                </div>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-fg-muted font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-butter" />
                    Nuevas {pctNew}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-lilac" />
                    En aprendizaje {pctLearning}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                    En repaso {pctReview}%
                  </span>
                </div>

                {needsVerificationCount > 0 && (
                  <p className="mt-4 text-sm font-normal text-fg-muted leading-relaxed">
                    {needsVerificationCount} palabras marcadas como dominadas no tienen evidencia reciente. Vuelve a repasarlas.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm sm:text-base font-medium text-fg-muted">
                Guarda palabras en tu diccionario para ver tu progreso aquí.
              </p>
            )}
          </div>

          <Link
            href="/words"
            className="mt-6 block w-full rounded-full border border-border-subtle bg-surface-sunken py-3 px-5 text-center font-bold text-base text-fg hover:bg-surface-raised active:scale-[0.97] transition-all focus-ring"
          >
            Abrir diccionario
          </Link>
        </div>

        {/* 3. Coach (Sky) */}
        <PastelCard tone="sky" className="p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-ink" aria-hidden="true" />
                <span className="font-kicker font-bold text-xs sm:text-sm uppercase tracking-wider text-ink-secondary">
                  COACH
                </span>
              </div>
              {/* Subtle Pagination for Topics */}
              {totalTopicPages > 1 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink-secondary">
                  <button
                    type="button"
                    disabled={topicPage === 1}
                    onClick={() => setTopicPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-full hover:bg-ink/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior de temas"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="tabular-nums">{topicPage}/{totalTopicPages}</span>
                  <button
                    type="button"
                    disabled={topicPage === totalTopicPages}
                    onClick={() => setTopicPage((p) => Math.min(totalTopicPages, p + 1))}
                    className="p-1 rounded-full hover:bg-ink/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página siguiente de temas"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-ink leading-tight mt-2">
              Gramática
            </h3>

            {/* Level block */}
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="font-display text-5xl sm:text-6xl font-extrabold text-ink leading-none">
                {learnerLevel.level}
              </span>
              <span className="text-sm font-semibold text-ink-secondary">
                nivel estimado por tu práctica
              </span>
            </div>

            {/* Topics to reinforce */}
            <div className="mt-5 flex flex-col gap-2.5">
              <span className="font-kicker font-bold text-xs sm:text-sm uppercase tracking-wider text-ink-secondary">
                TEMAS A REFORZAR
              </span>

              {sampleWeakTopics.length > 0 ? (
                <div className="flex flex-col gap-3 mt-1">
                  {sampleWeakTopics.map((t) => {
                    const displayLabel = topicDisplayLabel(t.topic) ?? t.topic;
                    return (
                      <div key={t.topic} className="flex items-center gap-3 group">
                        <span
                          className="text-sm sm:text-base font-bold text-ink truncate flex-1 min-w-0 group-hover:translate-x-0.5 transition-transform"
                          title={displayLabel}
                        >
                          {displayLabel}
                        </span>
                        <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-ink/15">
                          <div
                            className="h-full rounded-full bg-ink transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, Math.max(0, Math.round(t.errorRate * 100)))}%` }}
                          />
                        </div>
                        <span className="w-14 text-right font-display text-sm sm:text-base font-extrabold text-ink tabular-nums shrink-0">
                          {Math.round(t.errorRate * 100)} %
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-1 text-sm sm:text-base font-medium text-ink-secondary">
                  Sigue practicando para detectar temas de gramática a reforzar.
                </p>
              )}
            </div>
          </div>

          <Link
            href="/practice/decks"
            className="mt-6 block w-full rounded-full bg-ink py-3 px-5 text-center font-bold text-base text-paper shadow-xs hover:opacity-90 active:scale-[0.97] transition-all focus-ring"
          >
            Practicar estos temas
          </Link>
        </PastelCard>
      </div>
    </section>
  );
}
