"use client";

import { useMemo, useState } from "react";
import type { MultipleChoiceArgs } from "@/lib/ai-practice/tools/registry";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import type { EvaluationResult } from "@/lib/exercise/design";
import { evaluateExercise } from "@/lib/exercise/evaluator";
import { multipleChoiceToDesign } from "@/lib/ai-practice/tools/to-design";
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
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const answered = status === "answered";

  const design = useMemo(() => multipleChoiceToDesign(args), [args]);

  function handleSelect(idx: number) {
    if (answered) return;
    setSelected(idx);
    const result = evaluateExercise(args.options[idx], design);
    // Fall back to the model-provided explanation when the design doesn't carry pedagogical data.
    if (!result.correct && args.explanation && !design.commonWrongAnswers?.length) {
      result.feedback.explanation = args.explanation;
    }
    setEvaluation(result);
    onAnswer({ correct: result.correct, topic: args.topic, gradedBy: "client" });
  }

  function handleRetry() {
    setSelected(null);
    setEvaluation(null);
    onRetry?.();
  }

  return (
    <div className="rounded-xl bg-surface-sunken p-4 space-y-3">
      <p className="text-lg font-semibold text-fg leading-snug">
        {args.question}
      </p>
      <div className="space-y-2">
        {args.options.map((opt, idx) => {
          const isCorrect = answered && idx === args.correctIndex;
          const isWrong = answered && idx === selected && selected !== args.correctIndex;

          let cls = "w-full text-left px-5 py-3.5 rounded-xl text-sm text-fg transition-colors cursor-pointer ";

          if (isCorrect) {
            cls += "bg-success-soft border border-success-border";
          } else if (isWrong) {
            cls += "bg-error-soft border border-error-border";
          } else {
            cls += "bg-surface-sunken hover:bg-surface-raised";
          }

          return (
            <button
              key={idx}
              disabled={answered || evaluation !== null}
              onClick={() => handleSelect(idx)}
              className={cls}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {evaluation && (
        <ExerciseFeedback
          result={evaluation}
          onNext={evaluation.correct ? onNext : undefined}
          onRetry={!evaluation.correct ? handleRetry : undefined}
        />
      )}
    </div>
  );
}
