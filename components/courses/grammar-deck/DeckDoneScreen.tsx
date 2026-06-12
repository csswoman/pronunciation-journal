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
import { Check, RotateCcw, Sparkles, ArrowRight, Headphones, BookOpen, LayoutList } from "lucide-react";
import type { GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";

interface DeckDoneScreenProps {
  deck: GrammarStudyDeckData;
  courseTitle?: string;
  lessonId?: string;
  backHref?: string;
  reviewedCount: number;
  quizScore: { correct: number; total: number } | null;
  practiceLoading: boolean;
  practiceError: boolean;
  onStartSentencePractice: () => void;
  onRestart: () => void;
}

export function DeckDoneScreen({
  deck,
  courseTitle,
  lessonId,
  backHref,
  reviewedCount,
  quizScore,
  practiceLoading,
  practiceError,
  onStartSentencePractice,
  onRestart,
}: DeckDoneScreenProps) {
  const total = deck.cards.length;

  return (
    <section className="grammar-deck__done" aria-live="polite">
      <div className="grammar-deck__done-badge">
        <Check size={30} strokeWidth={3} aria-hidden />
      </div>
      <Sparkles className="grammar-deck__done-spark" size={18} aria-hidden />
      <h2 className="grammar-deck__done-title">¡Lección completada!</h2>
      {courseTitle && <p className="grammar-deck__done-sub">{courseTitle}</p>}
      {deck.meta.goal && <p className="grammar-deck__done-goal">{deck.meta.goal}</p>}

      <div className="grammar-deck__done-stats">
        <div>
          <b>{total}</b>
          <span>tarjetas</span>
        </div>
        <div>
          <b>{reviewedCount}</b>
          <span>repasadas</span>
        </div>
        {quizScore && (
          <div>
            <b>
              {quizScore.correct}/{quizScore.total}
            </b>
            <span>quiz</span>
          </div>
        )}
      </div>

      {lessonId && (
        <>
          <button
            type="button"
            className="grammar-deck__done-soundlab"
            onClick={onStartSentencePractice}
            disabled={practiceLoading}
          >
            <LayoutList size={16} aria-hidden />
            <span>
              {practiceLoading ? "Cargando ejercicios…" : "Practica armando oraciones de esta lección"}
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

      {deck.sounds && deck.sounds.length > 0 && (
        <Link
          href={`/practice/sounds?focus=${encodeURIComponent(deck.sounds.join(","))}`}
          className="grammar-deck__done-soundlab"
        >
          <Headphones size={16} aria-hidden />
          <span>
            Practica estos sonidos en Sound Lab
            <em>{deck.sounds.join(" · ")}</em>
          </span>
          <ArrowRight size={15} aria-hidden />
        </Link>
      )}

      {deck.related && deck.related.length > 0 && (
        <div className="grammar-deck__related">
          <span className="grammar-deck__related-label">Continúa con</span>
          <ul>
            {deck.related.map((r) => (
              <li key={r.slug}>
                <Link href={`/courses/lesson/${r.slug}`}>
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
            Volver a la ruta
            <ArrowRight size={15} aria-hidden />
          </Link>
        )}
      </div>
    </section>
  );
}
