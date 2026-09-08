"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useUISounds } from "@/hooks/useUISounds";
import { isLessonComplete } from "@/lib/db";
import { recordLessonComplete, recordLessonQuizAttempt } from "@/lib/practice/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { theoryTopicForMiniLesson } from "@/lib/learning-loop/theory-targets";

// Planned structure:
// <MiniLessonQuiz>
//   <QuizQuestionBlock>
//     <QuestionBadge />
//     <QuestionHeading />
//     <OptionsList>
//       <OptionButton>
//         <OptionLetter />
//         <OptionText />
//       </OptionButton>
//     </OptionsList>
//     <AnswerExplanation />
//     <QuestionDivider />
//   </QuizQuestionBlock>
//   <QuizCompletionScore />
// </MiniLessonQuiz>

const COURSE_SLUG = "mini-lessons";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Props {
  questions: QuizQuestion[];
  slug: string;
  shuffleOptions?: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function getOptionalUserId(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function scoreClass(correct: number, total: number): string {
  const pct = correct / total;
  if (pct >= 0.7) return "mini-lessons__quiz-score--good bg-success-soft border-success-border text-success";
  if (pct >= 0.5) return "mini-lessons__quiz-score--mid bg-warning-soft border-warning-border text-warning";
  return "mini-lessons__quiz-score--low bg-error-soft border-error-border text-error";
}

export default function MiniLessonQuiz({ questions, slug, shuffleOptions = false }: Props) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [answerTimesMs, setAnswerTimesMs] = useState<Record<number, number>>({});
  const completionRecorded = useRef(false);
  const startedAt = useRef(Date.now());
  const { playTap, playCorrect, playWrong } = useUISounds();

  // Stabilize questions and options per quiz attempt
  const displayQuestions = useMemo(() => {
    if (!shuffleOptions) return questions;
    return questions.map((q) => {
      const correctText = q.options[q.correct];
      const shuffled = shuffleArray(q.options);
      const newCorrectIndex = shuffled.indexOf(correctText);
      return {
        ...q,
        options: shuffled,
        correct: newCorrectIndex >= 0 ? newCorrectIndex : q.correct,
      };
    });
  }, [questions, shuffleOptions]);

  function choose(questionIdx: number, optionIdx: number) {
    if (selected[questionIdx] !== undefined) return;
    playTap();
    const isCorrect = optionIdx === displayQuestions[questionIdx].correct;
    setSelected((prev) => ({ ...prev, [questionIdx]: optionIdx }));
    setAnswerTimesMs((prev) => ({ ...prev, [questionIdx]: Date.now() - startedAt.current }));
    if (isCorrect) playCorrect(); else playWrong();
  }

  const answeredCount = Object.keys(selected).length;
  const allAnswered = answeredCount === displayQuestions.length;
  const correctCount = displayQuestions.filter(
    (q, i) => selected[i] === q.correct
  ).length;

  useEffect(() => {
    if (!allAnswered || completionRecorded.current) return;

    void (async () => {
      const userId = await getOptionalUserId();
      if (!userId) return;
      const already = await isLessonComplete(userId, COURSE_SLUG, slug);
      try {
        await recordLessonQuizAttempt(
          userId,
          displayQuestions.map((q, index) => {
            const selectedIndex = selected[index];
            const selectedAnswer = selectedIndex == null ? "" : q.options[selectedIndex] ?? "";
            return {
              questionId: `${slug}:quiz:${index + 1}`,
              courseSlug: COURSE_SLUG,
              lessonSlug: slug,
              question: q.question,
              selectedAnswer,
              correctAnswer: q.options[q.correct] ?? "",
              isCorrect: selectedIndex === q.correct,
              timeMs: answerTimesMs[index] ?? 0,
              topic: theoryTopicForMiniLesson(slug),
            };
          }),
        );
      } catch (error) {
        console.error("[MiniLessonQuiz] recordLessonQuizAttempt failed", error);
      }
      if (already) {
        completionRecorded.current = true;
        return;
      }
      completionRecorded.current = true;
      try {
        await recordLessonComplete(COURSE_SLUG, slug);
      } catch {
        completionRecorded.current = false;
      }
    })();
  }, [allAnswered, answerTimesMs, displayQuestions, selected, slug]);

  return (
    <div className="mini-lessons__quiz flex flex-col gap-8 mb-6">
      {displayQuestions.map((q, qIdx) => {
        const chosen = selected[qIdx];
        const isAnswered = chosen !== undefined;

        return (
          <div key={qIdx} className="mini-lessons__block flex flex-col gap-4">
            {/* Question Badge & Title */}
            <div className="flex flex-col gap-2">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-tiny font-semibold tracking-wide bg-[color-mix(in_oklch,var(--stage-pairs)_15%,var(--surface-sunken))] text-[var(--stage-pairs)] border border-[color-mix(in_oklch,var(--stage-pairs)_30%,transparent)]">
                  Opción múltiple
                </span>
              </div>
              <h3 className="mini-lessons__block-label text-h4 font-bold text-fg leading-snug tracking-tight m-0">
                {qIdx + 1}. {q.question}
              </h3>
            </div>

            {/* Options list styled as decoupled cards */}
            <ul className="mini-lessons__quiz-options list-none p-0 m-0 flex flex-col gap-2.5">
              {q.options.map((option, oIdx) => {
                const isCorrect = oIdx === q.correct;
                const isChosen = oIdx === chosen;
                const isDimmed = isAnswered && !isChosen && !isCorrect;

                const letter = String.fromCharCode(65 + oIdx);
                const ariaLabel = isAnswered && isCorrect
                  ? `${letter} ${option} — respuesta correcta`
                  : `${letter} ${option}`;

                return (
                  <li key={oIdx}>
                    <button
                      type="button"
                      className={cn(
                        "mini-lessons__quiz-option",
                        "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer",
                        !isAnswered && !isChosen && "bg-surface-raised border-border-subtle hover:border-border-default",
                        !isAnswered && isChosen && "border-primary ring-1 ring-primary/40 bg-surface-raised",
                        isAnswered && isCorrect && "mini-lessons__quiz-option--correct border-success ring-1 ring-success/30 bg-success-soft/20 text-success",
                        isAnswered && isChosen && !isCorrect && "mini-lessons__quiz-option--wrong border-error ring-1 ring-error/30 bg-error-soft/20 text-error",
                        isDimmed && "mini-lessons__quiz-option--dimmed opacity-40 pointer-events-none"
                      )}
                      onClick={() => choose(qIdx, oIdx)}
                      aria-disabled={isAnswered ? "true" : undefined}
                      aria-pressed={isChosen}
                      aria-label={ariaLabel}
                    >
                      <span
                        className={cn(
                          "mini-lessons__quiz-letter",
                          "w-7 h-7 rounded-lg border font-mono text-tiny font-bold flex items-center justify-center shrink-0 transition-all",
                          !isAnswered && !isChosen && "bg-surface-sunken border-border-subtle text-fg-muted",
                          !isAnswered && isChosen && "bg-primary text-on-primary border-primary",
                          isAnswered && isCorrect && "bg-success text-on-success border-success",
                          isAnswered && isChosen && !isCorrect && "bg-error text-on-error border-error",
                          isAnswered && !isChosen && !isCorrect && "bg-surface-sunken border-border-subtle text-fg-muted"
                        )}
                        aria-hidden
                      >
                        {letter}
                      </span>
                      <span
                        className={cn(
                          "text-body font-medium transition-colors",
                          !isAnswered && isChosen ? "text-primary font-semibold" : "text-fg",
                          isAnswered && isCorrect && "text-success font-semibold",
                          isAnswered && isChosen && !isCorrect && "text-error font-semibold"
                        )}
                      >
                        {option}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Answer & Explanation feedback */}
            {isAnswered && (
              <div className="mini-lessons__quiz-answer mt-2 p-4 rounded-xl bg-surface-sunken border border-border-subtle text-caption text-fg-secondary">
                <p className="m-0 mb-1">
                  <strong className="text-success font-semibold">Respuesta: {String.fromCharCode(65 + q.correct)}</strong>
                </p>
                <p className="m-0">{q.explanation}</p>
              </div>
            )}

            {/* Down arrow divider between questions */}
            <div className="flex items-center justify-center pt-2 text-fg-muted/40" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 3v10M4 9l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        );
      })}

      {allAnswered && (
        <div
          role="status"
          className={cn("mini-lessons__quiz-score", scoreClass(correctCount, displayQuestions.length))}
        >
          {correctCount} / {displayQuestions.length} correctas
        </div>
      )}
    </div>
  );
}
