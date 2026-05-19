"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { FillBlankArgs } from "@/lib/ai-practice/tools/registry";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import type { EvaluationResult } from "@/lib/exercises/design";
import { evaluateExercise } from "@/lib/exercises/evaluator";
import { fillBlankToDesign } from "@/lib/ai-practice/tools/to-design";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/db";
import { getUserLearningState } from "@/lib/ai-practice/load-state";
import type { CEFRLevel } from "@/lib/exercises/cefr";
import ExerciseFeedback from "./ExerciseFeedback";

interface Props {
  args: FillBlankArgs;
  status: "pending" | "rendered" | "answered" | "error";
  onAnswer: (result: ExerciseResult) => void;
  onNext?: () => void;
  onRetry?: () => void;
}

export default function FillBlankWidget({ args, status, onAnswer, onNext, onRetry }: Props) {
  const parts = args.sentence.split("___");
  const blankCount = parts.length - 1;

  const [values, setValues] = useState<string[]>(() => Array(blankCount).fill(""));
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [userLevel, setUserLevel] = useState<CEFRLevel | undefined>(undefined);
  const { user } = useAuth();
  // Track retry locally — status prop stays "answered" even after retry
  const [retried, setRetried] = useState(false);

  const answered = status === "answered" && !retried;
  const design = useMemo(() => fillBlankToDesign(args), [args]);
  const hintText = typeof args.hint === "string" ? args.hint : args.hint?.level1;

  const combinedValue = values.join(" ").trim();

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

  function handleSubmit() {
    if (!combinedValue || answered) return;
    const result = evaluateExercise(combinedValue, design, userLevel);
    setEvaluation(result);
    onAnswer({ correct: result.correct, topic: args.topic, gradedBy: "client" });
  }

  function handleRetry() {
    setValues(Array(blankCount).fill(""));
    setEvaluation(null);
    setRetried(true);
    onRetry?.();
  }

  const borderColor = !evaluation
    ? "var(--primary)"
    : evaluation.correct
    ? "var(--score-excellent)"
    : "var(--score-poor)";

  // When answered wrong, show correct answer split across blanks
  const displayValues = answered && evaluation && !evaluation.correct
    ? args.answer.split(/\s+/)
    : values;

  return (
    <div className="rounded-xl bg-surface-sunken p-4 space-y-3">
      {hintText && (
        <p className="text-xs text-fg-subtle">
          Hint: {hintText}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1 text-sm text-fg">
        {parts.map((part, i) => (
          <Fragment key={i}>
            {part && <span>{part}</span>}
            {i < blankCount && (
              <input
                value={displayValues[i] ?? ""}
                onChange={e => {
                  const next = [...values];
                  next[i] = e.target.value;
                  setValues(next);
                }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                disabled={answered}
                placeholder="…"
                size={Math.max(6, args.answer.length + 2)}
                className="border-b outline-none bg-transparent text-center px-1 w-auto"
                style={{ borderColor, color: "var(--text-primary)" }}
              />
            )}
          </Fragment>
        ))}
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
