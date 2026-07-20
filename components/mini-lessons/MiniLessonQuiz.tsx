"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useUISounds } from "@/hooks/useUISounds";
import { isLessonComplete } from "@/lib/db";
import { recordLessonComplete, recordLessonQuizAttempt } from "@/lib/practice/queries";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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
}

async function getOptionalUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await getSupabaseBrowserClient().auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function scoreClass(correct: number, total: number): string {
  const pct = correct / total;
  if (pct >= 0.7) return "mini-lessons__quiz-score--good";
  if (pct >= 0.5) return "mini-lessons__quiz-score--mid";
  return "mini-lessons__quiz-score--low";
}

export default function MiniLessonQuiz({ questions, slug }: Props) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [answerTimesMs, setAnswerTimesMs] = useState<Record<number, number>>({});
  const completionRecorded = useRef(false);
  const startedAt = useRef(Date.now());
  const { playTap, playCorrect, playWrong } = useUISounds();

  function choose(questionIdx: number, optionIdx: number) {
    if (selected[questionIdx] !== undefined) return;
    playTap();
    const isCorrect = optionIdx === questions[questionIdx].correct;
    setSelected((prev) => ({ ...prev, [questionIdx]: optionIdx }));
    setAnswerTimesMs((prev) => ({ ...prev, [questionIdx]: Date.now() - startedAt.current }));
    if (isCorrect) playCorrect(); else playWrong();
  }

  const answeredCount = Object.keys(selected).length;
  const allAnswered = answeredCount === questions.length;
  const correctCount = questions.filter(
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
          questions.map((q, index) => {
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
              topic: slug,
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
  }, [allAnswered, answerTimesMs, questions, selected, slug]);

  return (
    <div className="mini-lessons__quiz">
      {questions.map((q, qIdx) => {
        const chosen = selected[qIdx];
        const isAnswered = chosen !== undefined;

        return (
          <div key={qIdx} className="mini-lessons__block">
            <p className="mini-lessons__block-label">
              {qIdx + 1}. {q.question}
            </p>

            <ul className="mini-lessons__quiz-options">
              {q.options.map((option, oIdx) => {
                const isCorrect = oIdx === q.correct;
                const isChosen = oIdx === chosen;
                const isDimmed = isAnswered && !isChosen && !isCorrect;

                const optionClass = cn(
                  "mini-lessons__quiz-option",
                  isAnswered && isCorrect && "mini-lessons__quiz-option--correct",
                  isAnswered && isChosen && !isCorrect && "mini-lessons__quiz-option--wrong",
                  isDimmed && "mini-lessons__quiz-option--dimmed"
                );

                const letter = String.fromCharCode(65 + oIdx);
                const ariaLabel = isAnswered && isCorrect
                  ? `${letter} ${option} — correct answer`
                  : `${letter} ${option}`;

                return (
                  <li key={oIdx}>
                    <button
                      type="button"
                      className={optionClass}
                      onClick={() => choose(qIdx, oIdx)}
                      aria-disabled={isAnswered ? "true" : undefined}
                      aria-pressed={isChosen}
                      aria-label={ariaLabel}
                    >
                      <span className="mini-lessons__quiz-letter" aria-hidden>
                        {letter}
                      </span>
                      {option}
                    </button>
                  </li>
                );
              })}
            </ul>

            {isAnswered && (
              <div className="mini-lessons__quiz-answer">
                <p>
                  <strong>Answer: {String.fromCharCode(65 + q.correct)}</strong>
                </p>
                <p>{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}

      {allAnswered && (
        <div
          role="status"
          className={cn("mini-lessons__quiz-score", scoreClass(correctCount, questions.length))}
        >
          {correctCount} / {questions.length} correct
        </div>
      )}
    </div>
  );
}
