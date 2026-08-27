"use client";

// Planned structure:
// <GrammarStudyDeckBody>
//   practice | quiz | done | carousel phases
// </GrammarStudyDeckBody>

import PracticeSession from "@/components/practice/PracticeSession";
import { getCurrentUser } from "@/lib/auth/session";
import { recordLessonComplete, recordLessonQuizAttempt } from "@/lib/practice/queries";
import type { PracticeExercise } from "@/lib/practice/types";
import type { CoursePathTrackId } from "@/lib/courses/types";
import type { GrammarRelatedLink, GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";
import { theoryTopicForDeck } from "@/lib/learning-loop/theory-targets";
import QuizStep from "./QuizStep";
import { DeckDoneScreen } from "./DeckDoneScreen";
import { DeckCarousel } from "./DeckCarousel";

type DeckPhase = "cards" | "quiz" | "done" | "practice";

interface GrammarStudyDeckBodyProps {
  deck: GrammarStudyDeckData;
  phase: DeckPhase;
  practiceExercises: PracticeExercise[] | null;
  identity: {
    courseTitle?: string;
    lessonId?: string;
    deckSlug?: string;
    levelId?: CoursePathTrackId;
    backHref?: string;
    backLabel?: string;
    relatedLinks?: GrammarRelatedLink[];
  };
  doneState: {
    reviewedCount: number;
    quizScore: { correct: number; total: number } | null;
    practiceLoading: boolean;
    practiceError: boolean;
    completionError: boolean;
  };
  carousel: {
    index: number;
    direction: "next" | "prev";
    reviewed: Set<string>;
    isLast: boolean;
  };
  handlers: {
    onPracticeExit: () => void;
    onQuizDone: (correct: number, totalQ: number) => void;
    onRetryCompletion: () => void;
    onStartSentencePractice: () => void;
    onRestart: () => void;
    onPrev: () => void;
    onNext: () => void;
    onGoTo: (target: number) => void;
    onToggleReviewed: (id: string) => void;
  };
}

export function GrammarStudyDeckBody({
  deck,
  phase,
  practiceExercises,
  identity,
  doneState,
  carousel,
  handlers,
}: GrammarStudyDeckBodyProps) {
  const { courseTitle, lessonId, deckSlug, levelId, backHref, backLabel, relatedLinks } = identity;
  const {
    reviewedCount,
    quizScore,
    practiceLoading,
    practiceError,
    completionError,
  } = doneState;
  const { index, direction, reviewed, isLast } = carousel;
  const {
    onPracticeExit,
    onQuizDone,
    onRetryCompletion,
    onStartSentencePractice,
    onRestart,
    onPrev,
    onNext,
    onGoTo,
    onToggleReviewed,
  } = handlers;

  if (phase === "practice" && practiceExercises) {
    return (
      <div className="grammar-deck__practice-shell">
        <PracticeSession
          context="courses"
          exercises={practiceExercises}
          sessionLength={practiceExercises.length}
          sessionLabel="Practica esta lección"
          onSessionComplete={onPracticeExit}
          onExit={onPracticeExit}
        />
      </div>
    );
  }

  if (phase === "quiz" && deck.quiz) {
    return (
      <QuizStep
        questions={deck.quiz}
        onDone={(correct, totalQ, pickedAnswers, answerTimesMs) => {
          onQuizDone(correct, totalQ);
          const evidenceLessonSlug = lessonId ?? deckSlug;
          if (evidenceLessonSlug && deckSlug) {
            void getCurrentUser()
              .then((user) => {
                if (!user || !deck.quiz) return;
                return recordLessonQuizAttempt(
                  user.id,
                  deck.quiz.map((question, qIndex) => {
                    const selectedIndex = pickedAnswers[qIndex];
                    return {
                      questionId: `${lessonId}:quiz:${qIndex + 1}`,
                      courseSlug: levelId ?? "decks",
                      lessonSlug: evidenceLessonSlug,
                      question: question.q,
                      selectedAnswer:
                        selectedIndex == null ? "" : question.options[selectedIndex] ?? "",
                      correctAnswer: question.options[question.answer] ?? "",
                      isCorrect: selectedIndex === question.answer,
                      timeMs: answerTimesMs[qIndex] ?? 0,
                      topic: deck.topicId ?? theoryTopicForDeck(deckSlug),
                    };
                  }),
                );
              })
              .catch(() => undefined);
          }
        }}
      />
    );
  }

  if (phase === "done") {
    return (
      <>
        {completionError && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-error bg-error-soft px-4 py-3 text-body-sm text-error"
          >
            <span>No se pudo guardar la finalización de la lección.</span>
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={onRetryCompletion}
            >
              Reintentar
            </button>
          </div>
        )}
        <DeckDoneScreen
          deck={deck}
          courseTitle={courseTitle}
          lessonId={lessonId}
          deckSlug={deckSlug}
          backHref={backHref}
          backLabel={backLabel}
          reviewedCount={reviewedCount}
          quizScore={quizScore}
          practiceLoading={practiceLoading}
          practiceError={practiceError}
          relatedLinks={relatedLinks}
          onStartSentencePractice={onStartSentencePractice}
          onRestart={onRestart}
        />
      </>
    );
  }

  return (
    <DeckCarousel
      cards={deck.cards}
      index={index}
      direction={direction}
      reviewed={reviewed}
      isLast={isLast}
      onPrev={onPrev}
      onNext={onNext}
      onGoTo={onGoTo}
      onToggleReviewed={onToggleReviewed}
    />
  );
}

export function retryLessonCompletion(
  levelId: CoursePathTrackId | undefined,
  lessonId: string | undefined,
  setCompletionError: (value: boolean) => void,
) {
  if (!levelId || !lessonId) return;
  setCompletionError(false);
  void recordLessonComplete(levelId, lessonId).catch(() => setCompletionError(true));
}
