"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check, RotateCcw, Sparkles, ArrowRight, Headphones, BookOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { markLessonComplete } from "@/lib/db";
import type { GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";
import type { CoursePathTrackId } from "@/lib/courses/types";
import GrammarDeckHeader from "./GrammarDeckHeader";
import GrammarStudyCard from "./GrammarStudyCard";
import QuizStep from "./QuizStep";

interface GrammarStudyDeckProps {
  deck: GrammarStudyDeckData;
  backHref?: string;
  backLabel?: string;
  /** Overrides deck meta eyebrow when showing course title context */
  courseTitle?: string;
  /** When provided, finishing the deck marks the lesson complete in the DB. */
  levelId?: CoursePathTrackId;
  lessonId?: string;
}

export default function GrammarStudyDeck({
  deck,
  backHref,
  backLabel,
  courseTitle,
  levelId,
  lessonId,
}: GrammarStudyDeckProps) {
  const total = deck.cards.length;

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [reviewed, setReviewed] = useState<Set<string>>(() => new Set());
  const [phase, setPhase] = useState<"cards" | "quiz" | "done">("cards");
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);

  const hasQuiz = (deck.quiz?.length ?? 0) > 0;
  const finished = phase === "done";
  const reviewedCount = reviewed.size;
  const card = deck.cards[index];

  const toggleReviewed = useCallback((id: string) => {
    setReviewed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const goTo = useCallback(
    (target: number) => {
      setDirection(target >= index ? "next" : "prev");
      setIndex(Math.min(Math.max(target, 0), total - 1));
    },
    [index, total]
  );

  const goNext = useCallback(() => {
    setDirection("next");
    // Advancing counts the current card as reviewed.
    setReviewed((prev) => new Set(prev).add(deck.cards[index].id));
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      setPhase(hasQuiz ? "quiz" : "done");
    }
  }, [index, total, deck.cards, hasQuiz]);

  const goPrev = useCallback(() => {
    setDirection("prev");
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const restart = useCallback(() => {
    setDirection("prev");
    setPhase("cards");
    setQuizScore(null);
    setIndex(0);
  }, []);

  // Keyboard navigation while studying.
  useEffect(() => {
    if (phase !== "cards") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, goNext, goPrev]);

  // Persist completion once the deck is finished.
  useEffect(() => {
    if (finished && levelId && lessonId) {
      void markLessonComplete(levelId, lessonId).catch(() => {});
    }
  }, [finished, levelId, lessonId]);

  const meta = useMemo(() => {
    if (!courseTitle) return deck.meta;
    return { ...deck.meta, title: courseTitle, titleEmphasis: undefined };
  }, [deck.meta, courseTitle]);

  const isLast = index === total - 1;

  return (
    <div className="grammar-deck" data-course-study-deck>
      <div className="grammar-deck__wrap">
        <GrammarDeckHeader
          meta={meta}
          reviewedCount={reviewedCount}
          totalCount={total}
          backHref={backHref}
          backLabel={backLabel}
          subtitle={courseTitle ? deck.meta.eyebrow : undefined}
        />

        {phase === "quiz" && deck.quiz ? (
          <QuizStep
            questions={deck.quiz}
            onDone={(correct, totalQ) => {
              setQuizScore({ correct, total: totalQ });
              setPhase("done");
            }}
          />
        ) : finished ? (
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
              <button type="button" className="grammar-deck__done-restart" onClick={restart}>
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
        ) : (
          <div className="grammar-deck__carousel">
            <div className="grammar-deck__viewport">
              <div
                key={card.id}
                className={cn(
                  "grammar-deck__slide",
                  direction === "next" ? "grammar-deck__slide--next" : "grammar-deck__slide--prev"
                )}
              >
                <GrammarStudyCard
                  card={card}
                  reviewed={reviewed.has(card.id)}
                  onToggleReviewed={() => toggleReviewed(card.id)}
                />
              </div>
            </div>

            <nav className="grammar-deck__nav" aria-label="Navegación de tarjetas">
              <button
                type="button"
                className="grammar-deck__arrow"
                onClick={goPrev}
                disabled={index === 0}
                aria-label="Tarjeta anterior"
              >
                <ChevronLeft size={20} aria-hidden />
              </button>

              <div className="grammar-deck__pager">
                <div className="grammar-deck__dots" role="tablist" aria-label="Tarjetas">
                  {deck.cards.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={`Tarjeta ${i + 1}`}
                      className={cn(
                        "grammar-deck__dot",
                        i === index && "grammar-deck__dot--on",
                        reviewed.has(c.id) && "grammar-deck__dot--done"
                      )}
                      onClick={() => goTo(i)}
                    />
                  ))}
                </div>
                <span className="grammar-deck__pos">
                  {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>
              </div>

              <button
                type="button"
                className={cn(
                  "grammar-deck__arrow",
                  "grammar-deck__arrow--next",
                  isLast && "grammar-deck__arrow--finish"
                )}
                onClick={goNext}
                aria-label={isLast ? "Finalizar lección" : "Tarjeta siguiente"}
              >
                {isLast ? <Sparkles size={18} aria-hidden /> : <ChevronRight size={20} aria-hidden />}
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
