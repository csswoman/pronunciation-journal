"use client";

// Planned structure:
// <GrammarStudyDeck>
//   <GrammarDeckHeader />
//   <QuizStep />             (quiz phase)
//   <DeckDoneScreen />       (done phase)
//   <PracticeSession />      (practice phase — embedded, no overlay)
//   <DeckCarousel />         (cards phase)
// </GrammarStudyDeck>

import { useCallback, useEffect, useMemo, useState } from "react";
import { recordLessonComplete } from "@/lib/practice/queries";
import PracticeSession from "@/components/practice/PracticeSession";
import type { PracticeExercise } from "@/lib/practice/types";
import type { CefrLevel } from "@/lib/core-1000/types";
import { buildCoursePracticeSession } from "@/lib/courses/practice/build-session";
import type { GrammarRelatedLink, GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";
import type { CoursePathTrackId } from "@/lib/courses/types";
import GrammarDeckHeader from "./GrammarDeckHeader";
import QuizStep from "./QuizStep";
import { DeckDoneScreen } from "./DeckDoneScreen";
import { DeckCarousel } from "./DeckCarousel";

interface GrammarStudyDeckProps {
  deck: GrammarStudyDeckData;
  backHref?: string;
  backLabel?: string;
  /** Overrides deck meta eyebrow when showing course title context */
  courseTitle?: string;
  /** When provided, finishing the deck marks the lesson complete in the DB. */
  levelId?: CoursePathTrackId;
  lessonId?: string;
  /** Deck slug used to fetch sentence-practice fragments (e.g. "a1-verbos-comunes") */
  deckSlug?: string;
  /** CEFR level for building the course practice session */
  cefrLevel?: CefrLevel;
  /** Server-derived related links; overrides deck.related when present */
  relatedLinks?: GrammarRelatedLink[];
}

export default function GrammarStudyDeck({
  deck,
  backHref,
  backLabel,
  courseTitle,
  levelId,
  lessonId,
  deckSlug,
  cefrLevel,
  relatedLinks,
}: GrammarStudyDeckProps) {
  const total = deck.cards.length;

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [reviewed, setReviewed] = useState<Set<string>>(() => new Set());
  const [phase, setPhase] = useState<"cards" | "quiz" | "done" | "practice">("cards");
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);

  // Sentence practice state
  const [practiceExercises, setPracticeExercises] = useState<PracticeExercise[] | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState(false);
  const [completionError, setCompletionError] = useState(false);

  const hasQuiz = (deck.quiz?.length ?? 0) > 0;
  const finished = phase === "done";
  const reviewedCount = reviewed.size;

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

  const handleStartSentencePractice = useCallback(async () => {
    if (!deck.meta || practiceLoading) return;
    setPracticeLoading(true);
    setPracticeError(false);
    try {
      const resolvedSlug = (deckSlug ?? lessonId) ?? '';
      if (!resolvedSlug) console.warn('[GrammarStudyDeck] deckSlug missing — practice session may be empty');
      const level: CefrLevel = cefrLevel ?? 'A1';
      const exercises = await buildCoursePracticeSession({ deckSlug: resolvedSlug, cefrLevel: level });
      if (exercises.length > 0) {
        setPracticeExercises(exercises);
        setPhase("practice");
      } else {
        setPracticeError(true);
      }
    } catch {
      setPracticeError(true);
    } finally {
      setPracticeLoading(false);
    }
  }, [deck.meta, lessonId, deckSlug, cefrLevel, practiceLoading]);

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
      setCompletionError(false);
      void recordLessonComplete(levelId, lessonId).catch(() => setCompletionError(true));
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

        {phase === "practice" && practiceExercises ? (
          <div className="grammar-deck__practice-shell">
            <PracticeSession
              context="courses"
              exercises={practiceExercises}
              sessionLength={practiceExercises.length}
              sessionLabel="Practica esta lección"
              onSessionComplete={() => { setPracticeExercises(null); setPhase("done"); }}
              onExit={() => { setPracticeExercises(null); setPhase("done"); }}
            />
          </div>
        ) : phase === "quiz" && deck.quiz ? (
          <QuizStep
            questions={deck.quiz}
            onDone={(correct, totalQ) => {
              setQuizScore({ correct, total: totalQ });
              setPhase("done");
            }}
          />
        ) : finished ? (
          <>
            {completionError && (
              <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-error bg-error-soft px-4 py-3 text-sm text-error">
                <span>No se pudo guardar la finalización de la lección.</span>
                <button
                  type="button"
                  className="font-semibold underline underline-offset-2"
                  onClick={() => {
                    if (!levelId || !lessonId) return;
                    setCompletionError(false);
                    void recordLessonComplete(levelId, lessonId).catch(() => setCompletionError(true));
                  }}
                >
                  Reintentar
                </button>
              </div>
            )}
            <DeckDoneScreen
              deck={deck}
              courseTitle={courseTitle}
              lessonId={lessonId}
              backHref={backHref}
              backLabel={backLabel}
              reviewedCount={reviewedCount}
              quizScore={quizScore}
              practiceLoading={practiceLoading}
              practiceError={practiceError}
              relatedLinks={relatedLinks}
              onStartSentencePractice={handleStartSentencePractice}
              onRestart={restart}
            />
          </>
        ) : (
          <DeckCarousel
            cards={deck.cards}
            index={index}
            direction={direction}
            reviewed={reviewed}
            isLast={isLast}
            onPrev={goPrev}
            onNext={goNext}
            onGoTo={goTo}
            onToggleReviewed={toggleReviewed}
          />
        )}
      </div>
    </div>
  );
}
