'use client';

// Planned structure:
// <LessonQuizTab>
//   <PastelCard tone="butter">
//     <QuizHeaderProgress /> (Pregunta 1 de 3, Score pill, Dot indicators)
//     <QuizQuestionTitle /> (Underlined target word)
//     <QuizOptionsList /> (A, B, C, D options with feedback states)
//     <QuizExplanationCard /> (POR QUÉ kicker + Verlo en el vídeo button)
//     <QuizFooterNav /> (Back button and Submit/Next question button)
//   </PastelCard>
// </LessonQuizTab>

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Play, X } from '@/components/icons';
import PastelCard from '@/components/layout/PastelCard';
import type { ImmersionQuizAttemptInput } from '@/lib/immersion/progress-queries';
import type { ImmersionLesson } from '@/lib/immersion/types';

interface LessonQuizTabProps {
  lesson: ImmersionLesson;
  onQuizComplete: (attempt: Omit<ImmersionQuizAttemptInput, 'lessonId'>) => Promise<void>;
  onSeekToVideo?: (seconds: number) => void;
}

export function LessonQuizTab({ lesson, onQuizComplete, onSeekToVideo }: LessonQuizTabProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  const attemptIdRef = useRef(crypto.randomUUID());
  const startedAtRef = useRef(Date.now());
  const completionRecordedRef = useRef(false);

  const quiz = lesson.quiz ?? [];
  const currentQuestion = quiz[currentQuestionIndex];
  const totalQuestions = quiz.length;

  if (totalQuestions === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border-default bg-surface-raised p-8 text-center">
        <p className="text-body font-medium text-fg">
          No hay preguntas de comprobación registradas para esta lección.
        </p>
      </div>
    );
  }

  const isCurrentSubmitted = Boolean(quizSubmitted[currentQuestion.id]);
  const currentSelected = selectedAnswers[currentQuestion.id];

  function handleSelectOption(optionIndex: number) {
    if (isCurrentSubmitted) return;

    const nextSelected = { ...selectedAnswers, [currentQuestion.id]: optionIndex };
    const nextSubmitted = { ...quizSubmitted, [currentQuestion.id]: true };
    setSelectedAnswers(nextSelected);
    setQuizSubmitted(nextSubmitted);

    const allAnswered = quiz.every((q) => nextSubmitted[q.id]);
    if (allAnswered && !completionRecordedRef.current) {
      completionRecordedRef.current = true;
      void onQuizComplete({
        attemptId: attemptIdRef.current,
        canonicalTopic: lesson.metadata?.canonicalTopic,
        answers: quiz.map((q) => {
          const selectedIdx = nextSelected[q.id];
          return {
            questionId: q.id,
            question: q.question,
            selectedAnswer: selectedIdx == null ? '' : q.options[selectedIdx] ?? '',
            correctAnswer: q.options[q.correctIndex] ?? '',
            isCorrect: selectedIdx === q.correctIndex,
            timeMs: Date.now() - startedAtRef.current,
          };
        }),
      }).catch((err) => {
        completionRecordedRef.current = false;
        console.error('[LessonQuizTab] Error recording quiz:', err);
      });
    }
  }

  const optionLetters = ['A', 'B', 'C', 'D'];
  const correctCount = Object.entries(selectedAnswers).filter(([qId, idx]) => {
    const q = quiz.find((item) => item.id === qId);
    return q && q.correctIndex === idx;
  }).length;

  return (
    <PastelCard tone="butter" className="p-5 sm:p-6 rounded-3xl flex flex-col justify-between gap-5 border border-ink/10 min-h-[420px]">
      <div>
        {/* Cabecera del Quiz */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-ink px-3.5 py-1 text-tiny font-extrabold tracking-wider text-paper uppercase shadow-xs">
              PREGUNTA {currentQuestionIndex + 1} DE {totalQuestions}
            </span>
            {isCurrentSubmitted && (
              <span className="inline-flex items-center rounded-full bg-coral-soft text-ink px-3 py-0.5 text-tiny font-bold shadow-xs">
                {correctCount} de {Object.keys(quizSubmitted).length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {quiz.map((_, idx) => (
              <div
                key={idx}
                className={`size-2.5 rounded-full transition-colors ${idx === currentQuestionIndex ? 'bg-ink scale-110' : 'bg-ink/25'}`}
              />
            ))}
          </div>
        </div>

        {/* Título de la pregunta */}
        <h3 className="font-display text-lg sm:text-xl font-bold text-ink leading-snug my-2">
          {currentQuestion.question}
        </h3>

        {/* Opciones A, B, C, D */}
        <div className="flex flex-col gap-2.5 my-3">
          {currentQuestion.options.map((optionText, optIdx) => {
            const isOptionSelected = currentSelected === optIdx;
            const isCorrectOption = optIdx === currentQuestion.correctIndex;
            const letter = optionLetters[optIdx] ?? 'A';

            if (isCurrentSubmitted) {
              if (isCorrectOption) {
                return (
                  <div key={optIdx} className="flex items-center justify-between gap-3 rounded-2xl bg-mint-soft border-2 border-mint p-3.5 text-ink font-semibold text-body-sm shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="size-7 rounded-xl bg-mint text-ink flex items-center justify-center font-bold text-caption shrink-0">
                        <Check className="size-4 stroke-[3]" />
                      </div>
                      <span>{optionText}</span>
                    </div>
                    <span className="text-tiny font-bold text-ink shrink-0">Correcta</span>
                  </div>
                );
              }

              if (isOptionSelected) {
                return (
                  <div key={optIdx} className="flex items-center justify-between gap-3 rounded-2xl bg-coral-soft border-2 border-coral p-3.5 text-ink font-semibold text-body-sm shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="size-7 rounded-xl bg-coral text-ink flex items-center justify-center font-bold text-caption shrink-0">
                        <X className="size-4 stroke-[3]" />
                      </div>
                      <span>{optionText}</span>
                    </div>
                    <span className="text-tiny font-bold text-ink shrink-0">Tu respuesta</span>
                  </div>
                );
              }

              return (
                <div key={optIdx} className="flex items-center gap-3 rounded-2xl bg-paper/60 border border-ink/10 p-3.5 text-ink/70 font-medium text-body-sm opacity-60">
                  <div className="size-7 rounded-xl bg-ink/15 text-ink flex items-center justify-center font-extrabold text-caption shrink-0 border border-ink/15">
                    {letter}
                  </div>
                  <span>{optionText}</span>
                </div>
              );
            }

            return (
              <button key={optIdx} type="button" onClick={() => handleSelectOption(optIdx)} className="flex items-center gap-3 rounded-2xl bg-paper border border-ink/15 p-3.5 text-ink font-semibold text-body-sm text-left shadow-2xs hover:border-ink/40 transition-all cursor-pointer focus-ring">
                <div className="size-7 rounded-xl bg-slate-900 text-white dark:bg-slate-950 dark:text-white flex items-center justify-center font-extrabold text-caption shrink-0 shadow-2xs">
                  {letter}
                </div>
                <span>{optionText}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback pedagógico */}
        {isCurrentSubmitted && currentQuestion.explanation && (
          <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-paper/90 border border-ink/10 p-4 shadow-xs">
            <span className="text-tiny font-extrabold uppercase tracking-wider text-ink">POR QUÉ</span>
            <p className="text-body-sm text-ink-secondary leading-relaxed">{currentQuestion.explanation}</p>
            {onSeekToVideo && (
              <button type="button" onClick={() => onSeekToVideo(0)} className="mt-1 inline-flex items-center gap-2 rounded-full bg-ink hover:bg-ink/90 text-paper px-4 py-2 text-body-sm font-semibold transition-colors cursor-pointer w-fit">
                <Play className="size-3.5 fill-current" />
                <span>Verlo en el vídeo</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navegación inferior */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-ink/10">
        <button type="button" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex((prev) => prev - 1)} className="flex size-11 items-center justify-center rounded-full bg-paper/80 hover:bg-paper text-ink shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-ring" aria-label="Pregunta anterior">
          <ArrowLeft className="size-5" />
        </button>

        {currentQuestionIndex < totalQuestions - 1 ? (
          <button type="button" onClick={() => setCurrentQuestionIndex((prev) => prev + 1)} className="inline-flex items-center gap-2 rounded-full bg-primary hover:bg-primary-hover text-on-primary font-extrabold px-6 py-3 text-body-sm shadow-md transition-colors cursor-pointer focus-ring">
            <span>Siguiente pregunta</span>
            <ArrowRight className="size-4 stroke-[2.5]" />
          </button>
        ) : (
          <span className="text-body-sm font-bold text-ink opacity-80">¡Comprobación finalizada!</span>
        )}
      </div>
    </PastelCard>
  );
}
