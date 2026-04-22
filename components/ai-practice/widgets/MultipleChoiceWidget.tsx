"use client";

import { useState } from "react";
import type { MultipleChoiceArgs } from "@/lib/ai-practice/tools/registry";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import ExerciseFeedback from "./ExerciseFeedback";

interface Props {
  args: MultipleChoiceArgs;
  status: "pending" | "rendered" | "answered" | "error";
  onAnswer: (result: ExerciseResult) => void;
  onNext?: () => void;
  onRetry?: () => void;
}

export default function MultipleChoiceWidget({ args, status, onAnswer, onNext, onRetry }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = status === "answered";

  const wasCorrect = selected !== null && selected === args.correctIndex;

  function handleSelect(idx: number) {
    if (answered) return;
    setSelected(idx);
    const correct = idx === args.correctIndex;
    onAnswer({
      correct,
      topic: args.topic,
      gradedBy: "client",
      latencyMs: undefined,
    });
  }

  function handleRetry() {
    setSelected(null);
    onRetry?.();
  }

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}
    >
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {args.question}
      </p>
      <div className="space-y-2">
        {args.options.map((opt, idx) => {
          let bg = "var(--bg-surface)";
          let border = "var(--line-divider)";
          let color = "var(--text-secondary)";

          if (answered) {
            if (idx === args.correctIndex) {
              bg = "color-mix(in oklch, var(--success, #22c55e) 15%, transparent)";
              border = "var(--success, #22c55e)";
              color = "var(--text-primary)";
            } else if (idx === selected && selected !== args.correctIndex) {
              bg = "color-mix(in oklch, #ef4444 12%, transparent)";
              border = "#ef4444";
              color = "var(--text-secondary)";
            }
          }

          return (
            <button
              key={idx}
              disabled={answered}
              onClick={() => handleSelect(idx)}
              className="w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors"
              style={{ backgroundColor: bg, borderColor: border, color }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <ExerciseFeedback
          correct={wasCorrect}
          explanation={args.explanation}
          topic={args.topic}
          onNext={wasCorrect ? onNext : undefined}
          onRetry={!wasCorrect ? handleRetry : undefined}
        />
      )}
    </div>
  );
}
