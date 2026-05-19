"use client";

import { useEffect, useMemo, useState } from "react";
import type { MultipleChoiceArgs } from "@/lib/ai-practice/tools/registry";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import type { EvaluationResult } from "@/lib/exercises/design";
import { evaluateExercise } from "@/lib/exercises/evaluator";
import { multipleChoiceToDesign } from "@/lib/ai-practice/tools/to-design";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/db";
import { getUserLearningState } from "@/lib/ai-practice/load-state";
import type { CEFRLevel } from "@/lib/exercises/cefr";
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
  const [userLevel, setUserLevel] = useState<CEFRLevel | undefined>(undefined);
  const { user } = useAuth();
  const answered = status === "answered";

  const design = useMemo(() => multipleChoiceToDesign(args), [args]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    void (async () => {
      const row = await db.learningState.get(userId);
      if (row?.state?.level?.cefrEstimate) {
        setUserLevel(row.state.level.cefrEstimate);
        return;
      }
      const state = await getUserLearningState(userId);
      setUserLevel(state.level.cefrEstimate);
    })();
  }, [user?.id]);

  function handleSelect(idx: number) {
    if (answered) return;
    setSelected(idx);
    const result = evaluateExercise(args.options[idx], design, userLevel);
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
