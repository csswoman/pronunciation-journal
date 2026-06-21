"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useUISounds } from "@/hooks/useUISounds";
import { isLessonComplete } from "@/lib/db";
import { recordLessonComplete } from "@/lib/practice/queries";

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

function scoreClass(correct: number, total: number): string {
  const pct = correct / total;
  if (pct >= 0.7) return "mini-lessons__quiz-score--good";
  if (pct >= 0.5) return "mini-lessons__quiz-score--mid";
  return "mini-lessons__quiz-score--low";
}

export default function MiniLessonQuiz({ questions, slug }: Props) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const completionRecorded = useRef(false);
  const { playTap, playCorrect, playWrong } = useUISounds();

  function choose(questionIdx: number, optionIdx: number) {
    if (selected[questionIdx] !== undefined) return;
    playTap();
    const isCorrect = optionIdx === questions[questionIdx].correct;
    setSelected((prev) => ({ ...prev, [questionIdx]: optionIdx }));
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
      const already = await isLessonComplete(COURSE_SLUG, slug);
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
  }, [allAnswered, slug]);

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
