"use client";

import { useState } from "react";
import { NavButtons } from "./NavButtons";
import { buildDistractors, shuffle } from "./step-helpers";

export function FillBlankStep({
  data,
  onComplete,
  onPrev,
}: {
  data: { sentence: string; answer: string; hint?: string };
  onComplete: () => void;
  onPrev?: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const parts = data.sentence.split("___");
  const chips = shuffle([data.answer, ...buildDistractors(data.sentence, data.answer)]);
  const isCorrect = selected?.toLowerCase() === data.answer.toLowerCase();

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div
        className="w-full max-w-lg px-8 py-8 rounded-2xl border-2 text-center"
        style={{
          borderColor: submitted ? (isCorrect ? "oklch(.65 .18 145)" : "oklch(.6 .18 25)") : "var(--text-primary)",
          backgroundColor: "var(--card-bg)",
        }}
      >
        <p className="text-xl leading-loose" style={{ fontFamily: "var(--font-serif, 'DM Serif Display', serif)", color: "var(--text-primary)" }}>
          {parts[0]}
          <span
            className="inline-block min-w-[120px] border-b-2 mx-2 px-2 text-center"
            style={{
              borderColor: submitted ? (isCorrect ? "oklch(.65 .18 145)" : "oklch(.6 .18 25)") : "var(--primary)",
              color: submitted ? (isCorrect ? "oklch(.4 .14 145)" : "oklch(.45 .15 25)") : selected ? "var(--text-primary)" : "transparent",
            }}
          >
            {selected ?? "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}
          </span>
          {parts[1]}
        </p>

        {data.hint && !submitted && (
          <p className="text-xs mt-4" style={{ color: "var(--text-tertiary)" }}>
            {data.hint}
          </p>
        )}

        {submitted && (
          <p className="text-xs mt-4 font-medium" style={{ color: isCorrect ? "oklch(.55 .18 145)" : "oklch(.55 .18 25)" }}>
            {isCorrect ? "Correct!" : `The answer is: "${data.answer}"`}
          </p>
        )}
      </div>

      {!submitted && (
        <div className="flex flex-wrap justify-center gap-3">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => setSelected(chip)}
              className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-all"
              style={{
                borderColor: selected === chip ? "var(--primary)" : "var(--line-divider)",
                backgroundColor: selected === chip ? "var(--btn-regular-bg-active)" : "var(--card-bg)",
                color: selected === chip ? "var(--primary)" : "var(--text-secondary)",
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <NavButtons
        onPrev={onPrev}
        onNext={submitted ? onComplete : () => setSubmitted(true)}
        nextLabel={submitted ? "Continue →" : "Check →"}
        nextDisabled={!selected && !submitted}
        nextAccent={!submitted}
      />
    </div>
  );
}
