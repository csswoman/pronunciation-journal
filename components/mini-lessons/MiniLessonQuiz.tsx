"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Props {
  questions: QuizQuestion[];
}

export default function MiniLessonQuiz({ questions }: Props) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  function toggle(idx: number) {
    setRevealed((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  return (
    <div className="mini-lessons__quiz">
      {questions.map((q, idx) => {
        const isOpen = revealed[idx] ?? false;
        return (
          <div key={idx} className="mini-lessons__block">
            <p className="mini-lessons__block-label">
              {idx + 1}. {q.question}
            </p>
            <ul className="mini-lessons__quiz-options">
              {q.options.map((option, optIdx) => (
                <li key={optIdx}>
                  <span className="mini-lessons__quiz-letter">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  {option}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={cn(
                "mini-lessons__quiz-reveal",
                isOpen && "mini-lessons__quiz-reveal--open"
              )}
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
            >
              <span className="mini-lessons__quiz-reveal-icon" aria-hidden>
                {isOpen ? "−" : "+"}
              </span>
              {isOpen ? "Ocultar respuesta" : "Ver respuesta"}
            </button>
            <div
              className={cn(
                "mini-lessons__quiz-answer-wrap",
                isOpen && "mini-lessons__quiz-answer-wrap--open"
              )}
              {...(!isOpen && { "aria-hidden": "true" })}
            >
              <div className="mini-lessons__quiz-answer">
                <p>
                  <strong>Respuesta: {String.fromCharCode(65 + q.correct)}</strong>
                </p>
                <p>{q.explanation}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
