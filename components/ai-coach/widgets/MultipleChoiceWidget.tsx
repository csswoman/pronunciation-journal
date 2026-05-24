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
      if (row?.state?.level?.cefrEstimate) { setUserLevel(row.state.level.cefrEstimate); return; }
      const state = await getUserLearningState(userId);
      setUserLevel(state.level.cefrEstimate);
    })();
  }, [user?.id]);

  function handleSelect(idx: number) {
    if (answered) return;
    setSelected(idx);
    const result = evaluateExercise(args.options[idx], design, userLevel);
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
    <div className="space-y-4 py-2">
      <p className="text-base font-semibold text-[var(--text-primary)] leading-snug text-center px-2">
        {args.question}
      </p>
      <div className="space-y-2.5">
        {args.options.map((opt, idx) => {
          const isCorrect = answered && idx === args.correctIndex;
          const isWrong   = answered && idx === selected && selected !== args.correctIndex;

          let borderColor = "var(--border-default)";
          let bgColor     = "var(--surface-raised)";
          if (isCorrect) { borderColor = "var(--success-border)"; bgColor = "var(--success-soft)"; }
          if (isWrong)   { borderColor = "var(--error-border)";   bgColor = "var(--error-soft)"; }

          return (
            <button
              key={idx}
              disabled={answered || evaluation !== null}
              onClick={() => handleSelect(idx)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm text-[var(--text-primary)] transition-all border flex items-center gap-3 hover:border-[var(--border-hover)] active:scale-[0.99] disabled:cursor-default"
              style={{ backgroundColor: bgColor, borderColor }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: isCorrect ? "var(--success)" : isWrong ? "var(--error)" : "var(--primary)" }}
              />
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
