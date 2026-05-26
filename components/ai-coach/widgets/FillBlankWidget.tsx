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
  const parts      = args.sentence.split("___");
  const blankCount = parts.length - 1;

  const [values, setValues]       = useState<string[]>(() => Array(blankCount).fill(""));
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [userLevel, setUserLevel]   = useState<CEFRLevel | undefined>(undefined);
  const [retried, setRetried]       = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const { user } = useAuth();

  const options = useMemo(() => {
    const wrong = (args.commonWrongAnswers ?? []).map(w => w.value).filter(Boolean);
    const pool = Array.from(new Set([args.answer, ...wrong])).slice(0, 4);
    return pool.sort(() => Math.random() - 0.5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.answer, args.commonWrongAnswers]);

  const hasOptions = options.length >= 2;

  const answered  = status === "answered" && !retried;
  const design    = useMemo(() => fillBlankToDesign(args), [args]);
  const hintText  = typeof args.hint === "string" ? args.hint : args.hint?.level1;
  const combined  = values.join(" ").trim();

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

  function handleSubmit() {
    if (!combined || answered) return;
    const result = evaluateExercise(combined, design, userLevel);
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
    ? "var(--success)"
    : "var(--error)";

  const displayValues = answered && evaluation && !evaluation.correct
    ? args.answer.split(/\s+/)
    : values;

  return (
    <div className="space-y-4 py-2">
      {hintText && (
        <p className="text-xs text-[var(--text-tertiary)] text-center">{hintText}</p>
      )}

      <div className="px-2 py-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-center gap-1 text-base text-[var(--text-primary)] leading-relaxed">
        {parts.map((part, i) => (
          <Fragment key={i}>
            {part && <span>{part}</span>}
            {i < blankCount && (
              <input
                value={displayValues[i] ?? ""}
                onChange={e => { const next = [...values]; next[i] = e.target.value; setValues(next); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                disabled={answered}
                placeholder="…"
                size={Math.max(6, args.answer.length + 2)}
                className="border-b-2 outline-none bg-transparent text-center px-1 font-semibold"
                style={{ borderColor, color: "var(--text-primary)", minWidth: "4ch" }}
              />
            )}
          </Fragment>
        ))}
      </div>

      {!answered && hasOptions && !showOptions && !combined && (
        <button
          type="button"
          onClick={() => setShowOptions(true)}
          className="w-full py-2 rounded-full text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          Show options
        </button>
      )}

      {!answered && showOptions && hasOptions && (
        <div className="grid grid-cols-2 gap-2">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const next = [...values];
                next[0] = opt;
                setValues(next);
              }}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                values[0] === opt
                  ? "bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)]"
                  : "bg-[var(--surface-raised)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {!answered && combined && !evaluation && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-full text-sm font-semibold bg-[var(--primary)] text-[var(--on-primary)] transition-opacity hover:opacity-90"
        >
          Check
        </button>
      )}

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
