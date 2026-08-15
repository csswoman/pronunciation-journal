"use client";

// Planned structure:
// <GrammarStudyDeck>
//   <GrammarDeckHeader />
//   <GrammarStudyDeckBody />
// </GrammarStudyDeck>

import { useCallback, useEffect, useMemo, useState } from "react";
import { recordLessonComplete } from "@/lib/practice/queries";
import type { PracticeExercise } from "@/lib/practice/types";
import type { CefrLevel } from "@/lib/essential-words/types";
import { buildCoursePracticeSession } from "@/lib/courses/practice/build-session";
import type { GrammarRelatedLink, GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";
import type { CoursePathTrackId } from "@/lib/courses/types";
import GrammarDeckHeader from "./GrammarDeckHeader";
import { GrammarStudyDeckBody, retryLessonCompletion } from "./GrammarStudyDeckBody";

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
    [index, total],
  );

  const goNext = useCallback(() => {
    setDirection("next");
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
      const resolvedSlug = (deckSlug ?? lessonId) ?? "";
      if (!resolvedSlug) console.warn("[GrammarStudyDeck] deckSlug missing — practice session may be empty");
      const level: CefrLevel = cefrLevel ?? "A1";
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

  useEffect(() => {
    if (phase !== "cards") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, goNext, goPrev]);

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

        <GrammarStudyDeckBody
          deck={deck}
          phase={phase}
          practiceExercises={practiceExercises}
          identity={{
            courseTitle,
            lessonId,
            deckSlug,
            levelId,
            backHref,
            backLabel,
            relatedLinks,
          }}
          doneState={{
            reviewedCount,
            quizScore,
            practiceLoading,
            practiceError,
            completionError,
          }}
          carousel={{ index, direction, reviewed, isLast }}
          handlers={{
            onPracticeExit: () => {
              setPracticeExercises(null);
              setPhase("done");
            },
            onQuizDone: (correct, totalQ) => {
              setQuizScore({ correct, total: totalQ });
              setPhase("done");
            },
            onRetryCompletion: () => retryLessonCompletion(levelId, lessonId, setCompletionError),
            onStartSentencePractice: handleStartSentencePractice,
            onRestart: restart,
            onPrev: goPrev,
            onNext: goNext,
            onGoTo: goTo,
            onToggleReviewed: toggleReviewed,
          }}
        />
      </div>
    </div>
  );
}
