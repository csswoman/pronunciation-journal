"use client";

// Planned structure:
// <GrammarStudyDeck>
//   PracticeSession overlay  (when sentence practice is active)
//   <GrammarDeckHeader />
//   <QuizStep />             (quiz phase)
//   <DeckDoneScreen />       (done phase)
//   <DeckCarousel />         (cards phase)
// </GrammarStudyDeck>

import { useCallback, useEffect, useMemo, useState } from "react";
import { markLessonComplete } from "@/lib/db";
import PracticeSession from "@/components/practice/PracticeSession";
import { fetchFragmentsForDeck, generateReorderFromFragments } from "@/lib/exercises/generators/reorder-from-fragments";
import { fromGenericExercise } from "@/lib/practice/adapters";
import type { PracticeExercise } from "@/lib/practice/types";
import type { GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";
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

  // Sentence practice state
  const [practiceExercises, setPracticeExercises] = useState<PracticeExercise[] | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState(false);

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
      const deckSlug = lessonId ?? "";
      const fragments = await fetchFragmentsForDeck(deckSlug, 30);
      const exercises = generateReorderFromFragments(fragments, 8).map((ex) =>
        fromGenericExercise(ex, "courses"),
      );
      if (exercises.length > 0) {
        setPracticeExercises(exercises);
      } else {
        setPracticeError(true);
      }
    } catch {
      setPracticeError(true);
    } finally {
      setPracticeLoading(false);
    }
  }, [deck.meta, lessonId, practiceLoading]);

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

  // Overlay: sesión de reorder_words desde las frases de esta lección
  if (practiceExercises) {
    return (
      <div className="fixed inset-0 z-50 bg-surface-base">
        <PracticeSession
          context="courses"
          exercises={practiceExercises}
          sessionLength={practiceExercises.length}
          sessionLabel="Arma la oración"
          onSessionComplete={() => setPracticeExercises(null)}
          onExit={() => setPracticeExercises(null)}
        />
      </div>
    );
  }

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
          <DeckDoneScreen
            deck={deck}
            courseTitle={courseTitle}
            lessonId={lessonId}
            backHref={backHref}
            reviewedCount={reviewedCount}
            quizScore={quizScore}
            practiceLoading={practiceLoading}
            practiceError={practiceError}
            onStartSentencePractice={handleStartSentencePractice}
            onRestart={restart}
          />
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
