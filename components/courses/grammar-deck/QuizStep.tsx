"use client";

import { useState } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useUISounds } from "@/hooks/useUISounds";
import type { GrammarQuizQuestion } from "@/lib/courses/grammar-deck/types";

interface QuizStepProps {
  questions: GrammarQuizQuestion[];
  onDone: (correct: number, total: number) => void;
}

/** Lightweight end-of-deck self-check. One question at a time, immediate feedback. */
export default function QuizStep({ questions, onDone }: QuizStepProps) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const { playTap, playCorrect, playWrong } = useUISounds();

  const q = questions[index];
  const isLast = index === questions.length - 1;
  const answered = picked !== null;

  function choose(i: number) {
    if (answered) return;
    playTap();
    setPicked(i);
    const isCorrect = i === q.answer;
    if (isCorrect) {
      setCorrect((c) => c + 1);
      playCorrect();
    } else {
      playWrong();
    }
  }

  function next() {
    if (isLast) {
      onDone(correct, questions.length);
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
  }

  return (
    <section className="gd-quiz" aria-live="polite">
      <div className="gd-quiz__head">
        <span className="gd-quiz__kicker">Comprueba lo aprendido</span>
        <span className="gd-quiz__pos">
          {index + 1} / {questions.length}
        </span>
      </div>

      <h2 className="gd-quiz__q">{q.q}</h2>

      <div className="gd-quiz__options">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.answer;
          const isPicked = i === picked;
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={answered}
              className={cn(
                "gd-quiz__option",
                answered && isCorrect && "gd-quiz__option--correct",
                answered && isPicked && !isCorrect && "gd-quiz__option--wrong"
              )}
            >
              <span className="gd-quiz__option-text">{opt}</span>
              {answered && isCorrect && <Check size={16} strokeWidth={2.5} aria-hidden />}
              {answered && isPicked && !isCorrect && <X size={16} strokeWidth={2.5} aria-hidden />}
            </button>
          );
        })}
      </div>

      {answered && q.explain && <p className="gd-quiz__explain">{q.explain}</p>}

      {answered && (
        <button type="button" className="gd-quiz__next" onClick={next}>
          {isLast ? "Ver resultado" : "Siguiente"}
          <ArrowRight size={15} aria-hidden />
        </button>
      )}
    </section>
  );
}
