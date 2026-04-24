"use client";

import { useMemo, useRef, useState } from "react";
import type { FillBlankArgs } from "@/lib/ai-practice/tools/registry";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import type { EvaluationResult } from "@/lib/exercise/design";
import { evaluateExercise } from "@/lib/exercise/evaluator";
import { fillBlankToDesign } from "@/lib/ai-practice/tools/to-design";
import ExerciseFeedback from "./ExerciseFeedback";

interface Props {
  args: FillBlankArgs;
  status: "pending" | "rendered" | "answered" | "error";
  onAnswer: (result: ExerciseResult) => void;
  onNext?: () => void;
  onRetry?: () => void;
}

export default function FillBlankWidget({ args, status, onAnswer, onNext, onRetry }: Props) {
  const [value, setValue] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const answered = status === "answered";

  const design = useMemo(() => fillBlankToDesign(args), [args]);
  const hintText = typeof args.hint === "string" ? args.hint : args.hint?.level1;

  function handleSubmit() {
    if (!value.trim() || answered) return;
    const result = evaluateExercise(value, design);
    setEvaluation(result);
    onAnswer({ correct: result.correct, topic: args.topic, gradedBy: "client" });
  }

  function handleRetry() {
    setValue("");
    setEvaluation(null);
    onRetry?.();
  }

  const parts = args.sentence.split("___");
  const borderColor = !evaluation
    ? "var(--primary)"
    : evaluation.correct
    ? "var(--success, #22c55e)"
    : "#ef4444";

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}
    >
      {hintText && (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Hint: {hintText}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1 text-sm" style={{ color: "var(--text-primary)" }}>
        <span>{parts[0]}</span>
        <input
          ref={inputRef}
          value={answered && evaluation && !evaluation.correct ? args.answer : value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          disabled={answered}
          placeholder="…"
          className="border-b outline-none bg-transparent text-center min-w-[80px] px-1"
          style={{ borderColor, color: "var(--text-primary)" }}
        />
        {parts[1] && <span>{parts[1]}</span>}
      </div>

      {evaluation && (
        <ExerciseFeedback
          result={evaluation}
          onNext={evaluation.correct ? onNext : undefined}
          onRetry={!evaluation.correct ? handleRetry : undefined}
        />
      )}

      {!answered && !evaluation && (
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="text-xs px-3 py-1 rounded-lg transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-fg, #fff)" }}
        >
          Check
        </button>
      )}
    </div>
  );
}
