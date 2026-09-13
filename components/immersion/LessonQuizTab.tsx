'use client';

// Planned structure:
// <LessonQuizTab>
//   <QuizHeader /> (Intro text)
//   <QuizQuestionsList>
//     <QuizQuestionCard /> (Question, options with rounded buttons, and rounded explanation box)
//   </QuizQuestionsList>
//   <QuizResetAction /> (Allows learner to retry the micro-quiz)
// </LessonQuizTab>

import { useState } from 'react';
import { Check, RefreshCw } from '@/components/icons';
import Button from '@/components/ui/Button';
import type { ImmersionLesson } from '@/lib/immersion/types';

interface LessonQuizTabProps {
  lesson: ImmersionLesson;
  onQuizComplete: (scorePercent: number) => void;
}

/** Pestaña de comprobación: preguntas de opción múltiple con feedback pedagógico inmediato. */
export function LessonQuizTab({ lesson, onQuizComplete }: LessonQuizTabProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  function handleSelectOption(questionId: string, optionIndex: number) {
    if (quizSubmitted[questionId]) return;

    const nextSelected = { ...selectedAnswers, [questionId]: optionIndex };
    const nextSubmitted = { ...quizSubmitted, [questionId]: true };
    setSelectedAnswers(nextSelected);
    setQuizSubmitted(nextSubmitted);

    const allAnswered = lesson.quiz.every((q) => nextSubmitted[q.id]);
    if (allAnswered && lesson.quiz.length > 0) {
      const correctCount = lesson.quiz.filter(
        (q) => nextSelected[q.id] === q.correctIndex,
      ).length;
      onQuizComplete(Math.round((correctCount / lesson.quiz.length) * 100));
    }
  }

  function handleResetQuiz() {
    setSelectedAnswers({});
    setQuizSubmitted({});
  }

  const allCompleted = lesson.quiz.length > 0 && lesson.quiz.every((q) => quizSubmitted[q.id]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-tiny text-fg-muted">
          Comprueba tu comprensión del concepto enseñado por Teacher {lesson.teacher}:
        </p>

        {allCompleted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetQuiz}
            className="rounded-full gap-1.5 text-tiny text-fg-muted hover:text-fg"
          >
            <RefreshCw className="size-3.5" />
            <span>Reintentar</span>
          </Button>
        )}
      </div>

      {lesson.quiz.map((q, qIdx) => {
        const isSubmitted = quizSubmitted[q.id];
        const selected = selectedAnswers[q.id];

        return (
          <div
            key={q.id}
            className="flex flex-col gap-3 rounded-2xl border border-border-default bg-surface-sunken p-4 sm:p-5 shadow-2xs"
          >
            <p className="font-semibold text-fg text-body-sm sm:text-body">
              {qIdx + 1}. {q.question}
            </p>

            <div className="flex flex-col gap-2">
              {q.options.map((opt, optIdx) => {
                const isOptionSelected = selected === optIdx;
                const isCorrect = optIdx === q.correctIndex;

                let optionClasses =
                  'flex items-center justify-between gap-2 rounded-xl border border-border-default bg-surface-raised px-3.5 py-2.5 text-body-sm text-left transition-all focus-ring cursor-pointer';

                if (isSubmitted) {
                  if (isCorrect) {
                    optionClasses =
                      'flex items-center justify-between gap-2 rounded-xl border border-success bg-badge-success-bg text-success font-medium px-3.5 py-2.5 text-body-sm text-left';
                  } else if (isOptionSelected) {
                    optionClasses =
                      'flex items-center justify-between gap-2 rounded-xl border border-error bg-badge-error-bg text-error font-medium px-3.5 py-2.5 text-body-sm text-left';
                  } else {
                    optionClasses += ' opacity-50 cursor-default';
                  }
                } else {
                  optionClasses += ' hover:bg-surface-base hover:border-primary/50';
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleSelectOption(q.id, optIdx)}
                    className={optionClasses}
                  >
                    <span>{opt}</span>
                    {isSubmitted && isCorrect && <Check className="size-4 shrink-0 text-success" />}
                  </button>
                );
              })}
            </div>

            {isSubmitted && (
              <div className="mt-1 rounded-xl bg-surface-raised p-3.5 text-tiny text-fg-muted border border-border-subtle shadow-2xs">
                <p className="font-semibold text-fg mb-0.5">Explicación pedagógica:</p>
                <p>{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
