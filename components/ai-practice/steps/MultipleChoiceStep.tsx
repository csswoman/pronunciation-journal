"use client";

import { useState } from "react";
import { NavButtons } from "./NavButtons";

export function MultipleChoiceStep({
  data,
  onComplete,
  onPrev,
}: {
  data: { question: string; options: string[]; correct: number };
  onComplete: () => void;
  onPrev?: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = selected === data.correct;

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="w-full max-w-lg px-8 py-7 rounded-2xl border-2 text-center" style={{ borderColor: "var(--text-primary)", backgroundColor: "var(--card-bg)" }}>
        <p className="text-xl leading-snug" style={{ fontFamily: "var(--font-serif, 'DM Serif Display', serif)", color: "var(--text-primary)" }}>
          {data.question}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {data.options.map((opt, i) => {
          let borderColor = "var(--line-divider)";
          let bg = "var(--card-bg)";
          let color = "var(--text-secondary)";
          if (selected === i && !submitted) {
            borderColor = "var(--primary)";
            bg = "var(--btn-regular-bg-active)";
            color = "var(--primary)";
          } else if (submitted) {
            if (i === data.correct) {
              borderColor = "oklch(.65 .18 145)";
              bg = "oklch(.9 .1 145 / .15)";
              color = "oklch(.4 .14 145)";
            } else if (i === selected) {
              borderColor = "oklch(.6 .18 25)";
              bg = "oklch(.92 .08 25 / .15)";
              color = "oklch(.45 .15 25)";
            }
          }
          return (
            <button
              key={i}
              disabled={submitted}
              onClick={() => setSelected(i)}
              className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-all"
              style={{ borderColor, backgroundColor: bg, color }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {submitted && (
        <p className="text-sm font-medium" style={{ color: isCorrect ? "oklch(.55 .18 145)" : "oklch(.55 .18 25)" }}>
          {isCorrect ? "Correct!" : `The answer is: ${data.options[data.correct]}`}
        </p>
      )}

      <NavButtons
        onPrev={onPrev}
        onNext={submitted ? onComplete : () => setSubmitted(true)}
        nextLabel={submitted ? "Continue →" : "Check →"}
        nextDisabled={selected === null && !submitted}
        nextAccent={!submitted}
      />
    </div>
  );
}
