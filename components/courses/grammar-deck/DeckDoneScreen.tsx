"use client";

// Planned structure:
// <DeckDoneScreen>
//   stats badges (total cards, reviewed, quiz score)
//   sentence-practice CTA
//   sound-lab link
//   related-lessons list
//   restart / back buttons
// </DeckDoneScreen>

import Link from "next/link";
import { Check, RotateCcw, ArrowRight, BookOpen, LayoutList } from "@/components/icons";
import ConceptFeedbackSelector from "@/components/courses/ConceptFeedbackSelector";
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
  backLabel = "Volver",
  quizScore,
  practiceLoading,
  practiceError,
  relatedLinks,
  onStartSentencePractice,
  onRestart,
}: DeckDoneScreenProps) {
  const related = relatedLinks ?? deck.related;
  const targetSlug = deckSlug ?? lessonId;

  return (
    <section className="grammar-deck__done" aria-live="polite">
      <div className="grammar-deck__done-intro">
        <div className="grammar-deck__done-badge">
          <Check size={28} strokeWidth={2.75} aria-hidden />
        </div>
        <h2 className="grammar-deck__done-title">¡Lección completada!</h2>
        {courseTitle && <p className="grammar-deck__done-sub">{courseTitle}</p>}
        {deck.meta.goal && <p className="grammar-deck__done-goal">{deck.meta.goal}</p>}
      </div>

      {targetSlug && (
        <ConceptFeedbackSelector
          lessonSlug={targetSlug}
          title={deck.meta.title}
          className="my-1 w-full max-w-md self-center"
        />
      )}

      {quizScore && (
        <p className="grammar-deck__done-score">
          <span className="grammar-deck__done-score-value">
            {quizScore.correct}/{quizScore.total}
          </span>
          <span className="grammar-deck__done-score-label">respuestas correctas</span>
        </p>
      )}

      {lessonId && (
        <>
          <button
            type="button"
            className="grammar-deck__done-practice-cta"
            onClick={onStartSentencePractice}
            disabled={practiceLoading}
          >
            <LayoutList size={16} aria-hidden />
            <span>
              {practiceLoading ? "Cargando ejercicios…" : "Practica los ejercicios de esta lección"}
            </span>
            <ArrowRight size={15} aria-hidden />
          </button>
          {practiceError && (
            <p className="grammar-deck__done-practice-error">
              No hay ejercicios disponibles para esta lección aún.
            </p>
          )}
        </>
      )}

      {related && related.length > 0 && (
        <div className="grammar-deck__related">
          <span className="grammar-deck__related-label font-kicker">Continúa con</span>
          <ul>
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/practice/decks/${r.slug}`}>
                  <BookOpen size={14} aria-hidden />
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grammar-deck__done-actions">
        <button type="button" className="grammar-deck__done-restart" onClick={onRestart}>
          <RotateCcw size={15} aria-hidden />
          Repasar de nuevo
        </button>
        {backHref && (
          <Link href={backHref} className="grammar-deck__done-back">
            {backLabel}
            <ArrowRight size={15} aria-hidden />
          </Link>
        )}
      </div>
    </section>
  );
}
