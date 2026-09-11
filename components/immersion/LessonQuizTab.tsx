'use client';

// Planned structure:
// <LessonQuizTab>
//   <QuizQuestionCard /> (inline, one per question)
// </LessonQuizTab>

import { useState } from 'react';
import { Check } from '@/components/icons';
import type { ImmersionLesson } from '@/lib/immersion/types';

interface LessonQuizTabProps {
  lesson: ImmersionLesson;
  onQuizComplete: (scorePercent: number) => void;
}

/** Pestaña de comprobación: preguntas de opción múltiple con feedback inmediato. */
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

  return (
    <div className="flex flex-col gap-4">
      <p className="text-tiny text-fg-muted">
        Comprueba tu comprensión del concepto enseñado por Teacher {lesson.teacher}:
      </p>

      {lesson.quiz.map((q, qIdx) => {
        const isSubmitted = quizSubmitted[q.id];
        const selected = selectedAnswers[q.id];

        return (
          <div
            key={q.id}
            className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface-sunken p-4"
          >
            <p className="font-semibold text-fg">
              {qIdx + 1}. {q.question}
            </p>

            <div className="flex flex-col gap-2">
              {q.options.map((opt, optIdx) => {
                const isOptionSelected = selected === optIdx;
                const isCorrect = optIdx === q.correctIndex;

                let optionClasses =
                  'flex items-center justify-between gap-2 rounded-md border border-border-default bg-surface-raised px-3 py-2.5 text-body-sm text-left transition-colors focus-ring';

                if (isSubmitted) {
                  if (isCorrect) {
                    optionClasses =
                      'flex items-center justify-between gap-2 rounded-md border border-success bg-badge-success-bg text-success font-medium px-3 py-2.5 text-body-sm text-left';
                  } else if (isOptionSelected) {
                    optionClasses =
                      'flex items-center justify-between gap-2 rounded-md border border-error bg-badge-error-bg text-error font-medium px-3 py-2.5 text-body-sm text-left';
                  } else {
                    optionClasses += ' opacity-50';
                  }
                } else {
                  optionClasses += ' hover:bg-surface-sunken hover:border-primary/50';
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
              <div className="mt-1 rounded-md bg-surface-raised p-3 text-tiny text-fg-muted border-l-2 border-primary">
                <p className="font-semibold text-fg mb-0.5">Explicación:</p>
                <p>{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
