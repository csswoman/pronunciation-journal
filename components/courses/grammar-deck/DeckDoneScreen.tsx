"use client";

// Planned structure:
// <DeckDoneScreen>
//   <HeroSection /> (illustration burst, check badge, title, subtitle, goal)
//   <ConceptFeedbackSelector />
//   <QuizScoreBadge />
//   <SentencePracticeCTA />
//   <RelatedLessonsList />
//   <ActionButtons />
// </DeckDoneScreen>

import Link from "next/link";
import { RotateCcw, ArrowRight, BookOpen, LayoutList } from "@/components/icons";
import ConceptFeedbackSelector from "@/components/courses/ConceptFeedbackSelector";
import { getIllustration } from "@/lib/illustrations/registry";
import type { GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";

interface DeckDoneScreenProps {
  deck: GrammarStudyDeckData;
  courseTitle?: string;
  lessonId?: string;
  deckSlug?: string;
  backHref?: string;
  backLabel?: string;
  reviewedCount: number;
  quizScore: { correct: number; total: number } | null;
  practiceLoading: boolean;
  practiceError: boolean;
  /** Overrides deck.related — allows server-derived fallback links */
  relatedLinks?: GrammarStudyDeckData["related"];
  onStartSentencePractice: () => void;
  onRestart: () => void;
}

export function DeckDoneScreen({
  deck,
  courseTitle,
  lessonId,
  deckSlug,
  backHref,
  backLabel = "Volver a la ruta",
  quizScore,
  practiceLoading,
  practiceError,
  relatedLinks,
  onStartSentencePractice,
  onRestart,
}: DeckDoneScreenProps) {
  const related = relatedLinks ?? deck.related;
  const targetSlug = deckSlug ?? lessonId;
  const Illustration = getIllustration("stateCompletado");
  const nextLesson = related && related.length > 0 ? related[0] : null;

  return (
    <section
      className="grammar-deck__done flex w-full flex-col gap-6 rounded-2xl border border-border-subtle bg-surface-raised p-6 text-center shadow-md md:p-8"
      aria-live="polite"
    >
      {/* 1. Hero section + Quiz score */}
      <div className="grammar-deck__done-hero flex w-full flex-col items-center gap-3 text-center">
        <div
          className="grammar-deck__done-art relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24"
          aria-hidden="true"
        >
          <div className="grammar-deck__done-art-glow absolute inset-0 rounded-full bg-success-soft opacity-75 blur-xl" />
          <Illustration className="grammar-deck__done-art-img relative h-full w-auto text-success" />
        </div>
        <div className="grammar-deck__done-intro flex flex-col items-center gap-1.5 text-center">
          <h2 className="grammar-deck__done-title text-h2 font-bold text-fg">
            ¡Lección completada!
          </h2>
          {courseTitle && (
            <p className="grammar-deck__done-sub text-body-sm font-medium text-fg-muted">
              {courseTitle}
            </p>
          )}
          {deck.meta.goal && (
            <p className="grammar-deck__done-goal max-w-md text-pretty text-body-sm text-fg-muted">
              {deck.meta.goal}
            </p>
          )}
        </div>

        {/* Quiz score badge right under completion hero */}
        {quizScore && (
          <div className="mt-1 inline-flex items-center justify-center gap-2.5 rounded-full border border-success/30 bg-success-soft/60 px-5 py-1.5 shadow-xs">
            <span className="font-mono text-body font-bold tabular-nums text-success">
              {quizScore.correct}/{quizScore.total}
            </span>
            <span className="text-body-sm font-medium text-fg">
              respuestas correctas
            </span>
          </div>
        )}
      </div>

      {/* 2. Self-evaluation feedback (collapsable when answered) */}
      {targetSlug && (
        <ConceptFeedbackSelector
          lessonSlug={targetSlug}
          title={deck.meta.title}
          className="w-full max-w-xl self-center"
        />
      )}

      {/* 3. Sentence practice button (only shown if exercises are available) */}
      {lessonId && !practiceError && (
        <div className="w-full max-w-xl self-center">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 rounded-xl bg-cta-bg px-6 py-3.5 text-body-sm font-semibold text-cta-fg shadow-sm transition-all hover:bg-cta-bg/90 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-55"
            onClick={onStartSentencePractice}
            disabled={practiceLoading}
          >
            <span className="flex items-center gap-3">
              <LayoutList size={20} className="shrink-0" aria-hidden />
              <span>
                {practiceLoading
                  ? "Cargando ejercicios…"
                  : "Practica los ejercicios de esta lección"}
              </span>
            </span>
            <ArrowRight size={18} className="shrink-0" aria-hidden />
          </button>
        </div>
      )}

      {/* 4. Single next lesson CTA */}
      {nextLesson && (
        <div className="flex w-full max-w-xl flex-col gap-2 text-left self-center">
          <span className="font-kicker text-caption font-semibold uppercase tracking-wider text-fg-subtle">
            Continúa con
          </span>
          <Link
            href={`/practice/decks/${nextLesson.slug}`}
            className="group flex items-center justify-between gap-4 rounded-xl border border-border-default bg-surface-raised p-4 text-body-sm font-medium text-fg shadow-xs transition-all hover:border-accent hover:bg-surface-sunken hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <BookOpen size={20} className="transition-colors group-hover:text-white" aria-hidden />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-caption font-medium text-fg-muted">
                  Siguiente clase
                </span>
                <span className="text-body-sm font-semibold text-fg truncate">
                  {nextLesson.label}
                </span>
              </div>
            </div>
            <ArrowRight size={18} className="shrink-0 text-fg-muted group-hover:text-accent transition-colors" aria-hidden />
          </Link>
        </div>
      )}

      {/* 5. Bottom actions */}
      <div className="flex w-full flex-wrap items-center justify-center gap-3 border-t border-border-subtle pt-6">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cta-bg px-6 py-2.5 text-body-sm font-semibold text-cta-fg transition-all hover:bg-cta-bg-hover hover:-translate-y-0.5 shadow-xs"
          >
            <span>{backLabel}</span>
            <ArrowRight size={16} className="shrink-0" aria-hidden />
          </Link>
        )}
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border-default bg-surface-raised px-5 py-2.5 text-body-sm font-semibold text-fg-muted transition-all hover:border-accent hover:text-fg hover:-translate-y-0.5"
          onClick={onRestart}
        >
          <RotateCcw size={16} className="shrink-0" aria-hidden />
          <span>Repasar de nuevo</span>
        </button>
      </div>
    </section>
  );
}
