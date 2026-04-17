"use client";

import { useState } from "react";
import type { LearningStep } from "@/lib/types";

interface StepRendererProps {
  step: LearningStep;
  stepIndex: number;
  onComplete: () => void;
}

export default function StepRenderer({ step, onComplete }: StepRendererProps) {
  if (step.type === "explanation") {
    return <ExplanationStep content={step.content} onComplete={onComplete} />;
  }

  if (step.type === "checklist") {
    return <ChecklistStep items={step.items} onComplete={onComplete} />;
  }

  if (step.type === "exercise") {
    switch (step.format) {
      case "multiple_choice":
        return <MultipleChoiceStep data={step.data} onComplete={onComplete} />;
      case "fill_blank":
        return <FillBlankStep data={step.data} onComplete={onComplete} />;
      case "speaking":
        return <SpeakingStep data={step.data} onComplete={onComplete} />;
      case "checklist":
        return <ChecklistStep items={step.data.items} onComplete={onComplete} />;
    }
  }

  return null;
}

// ── Explanation ──────────────────────────────────────────────────────────────

function ExplanationStep({ content, onComplete }: { content: string; onComplete: () => void }) {
  return (
    <div className="space-y-4">
      <div
        className="text-sm leading-relaxed p-4 rounded-xl"
        style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-secondary)" }}
      >
        {content}
      </div>
      <NextButton onClick={onComplete} label="Got it — next" />
    </div>
  );
}

// ── Multiple Choice ──────────────────────────────────────────────────────────

function MultipleChoiceStep({
  data,
  onComplete,
}: {
  data: { question: string; options: string[]; correct: number };
  onComplete: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === data.correct;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {data.question}
      </p>

      <div className="space-y-2">
        {data.options.map((opt, i) => {
          let bg = "var(--btn-regular-bg)";
          let border = "var(--line-divider)";
          let color = "var(--text-secondary)";

          if (answered) {
            if (i === data.correct) {
              bg = "oklch(.9 .1 145 / .2)";
              border = "oklch(.65 .18 145)";
              color = "oklch(.4 .14 145)";
            } else if (i === selected) {
              bg = "oklch(.92 .08 25 / .15)";
              border = "oklch(.6 .18 25)";
              color = "oklch(.45 .15 25)";
            }
          }

          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className="w-full text-left px-4 py-3 rounded-xl border text-sm transition-all"
              style={{ backgroundColor: bg, borderColor: border, color }}
            >
              <span className="font-medium mr-2" style={{ opacity: 0.5 }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="space-y-3">
          <p
            className="text-sm font-medium"
            style={{ color: isCorrect ? "oklch(.55 .18 145)" : "oklch(.55 .18 25)" }}
          >
            {isCorrect ? "Correct!" : `Not quite — the answer is: ${data.options[data.correct]}`}
          </p>
          <NextButton onClick={onComplete} label="Continue" />
        </div>
      )}
    </div>
  );
}

// ── Fill in the Blank ────────────────────────────────────────────────────────

function FillBlankStep({
  data,
  onComplete,
}: {
  data: { sentence: string; answer: string; hint?: string };
  onComplete: () => void;
}) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = value.trim().toLowerCase() === data.answer.toLowerCase();

  const parts = data.sentence.split("___");

  const handleSubmit = () => {
    if (!value.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Fill in the blank:
      </p>

      <p className="text-base font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {parts[0]}
        <span
          className="inline-block min-w-[80px] border-b-2 mx-1 text-center px-1"
          style={{
            borderColor: submitted
              ? isCorrect
                ? "oklch(.65 .18 145)"
                : "oklch(.6 .18 25)"
              : "var(--primary)",
            color: submitted
              ? isCorrect
                ? "oklch(.4 .14 145)"
                : "oklch(.45 .15 25)"
              : "var(--text-primary)",
          }}
        >
          {submitted ? value.trim() || "___" : (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="bg-transparent outline-none text-center w-full"
              style={{ color: "var(--text-primary)", minWidth: "80px" }}
              autoFocus
              placeholder="___"
            />
          )}
        </span>
        {parts[1]}
      </p>

      {data.hint && !submitted && (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Hint: {data.hint}
        </p>
      )}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Check
        </button>
      ) : (
        <div className="space-y-3">
          <p
            className="text-sm font-medium"
            style={{ color: isCorrect ? "oklch(.55 .18 145)" : "oklch(.55 .18 25)" }}
          >
            {isCorrect ? "Perfect!" : `The answer is: "${data.answer}"`}
          </p>
          <NextButton onClick={onComplete} label="Continue" />
        </div>
      )}
    </div>
  );
}

// ── Speaking ─────────────────────────────────────────────────────────────────

function SpeakingStep({
  data,
  onComplete,
}: {
  data: { prompt: string; target: string };
  onComplete: () => void;
}) {
  const [done, setDone] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {data.prompt}
      </p>

      <div
        className="p-4 rounded-xl border text-base font-medium leading-relaxed"
        style={{
          borderColor: "var(--line-divider)",
          backgroundColor: "var(--btn-regular-bg)",
          color: "var(--text-primary)",
        }}
      >
        "{data.target}"
      </div>

      {!done ? (
        <button
          onClick={() => setDone(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          I said it
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "oklch(.55 .18 145)" }}>
            Great practice!
          </p>
          <NextButton onClick={onComplete} label="Continue" />
        </div>
      )}
    </div>
  );
}

// ── Checklist ────────────────────────────────────────────────────────────────

function ChecklistStep({ items, onComplete }: { items: string[]; onComplete: () => void }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const allDone = checked.size === items.length;

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i}>
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all text-sm"
              style={{
                borderColor: checked.has(i) ? "var(--primary)" : "var(--line-divider)",
                backgroundColor: checked.has(i) ? "var(--btn-regular-bg-active)" : "var(--btn-regular-bg)",
                color: checked.has(i) ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <span
                className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center mt-0.5 transition-all"
                style={{
                  borderColor: checked.has(i) ? "var(--primary)" : "var(--line-divider)",
                  backgroundColor: checked.has(i) ? "var(--primary)" : "transparent",
                }}
              >
                {checked.has(i) && (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {item}
            </button>
          </li>
        ))}
      </ul>

      {allDone && <NextButton onClick={onComplete} label="All done!" />}
    </div>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────────

function NextButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity"
      style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
    >
      {label}
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
