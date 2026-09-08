"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { ListenButton } from "@/components/ui/ListenButton";
import { useSpeakWord } from "@/hooks/useSpeakWord";
import type { BlankDefinition, StructuredExerciseItem } from "./ExerciseBlock";
import { checkAnswer, resolveBlankAnswers } from "@/lib/content/exercise-evaluator";

// Planned structure:
// <ExerciseItemCard>
//   <CardHeader>
//     <ItemStatusIndicator />
//     <PromptText />
//     <AudioButton />
//   </CardHeader>
//   <CardBody>
//     <RewriteInput /> | <InlineBlankInputs />
//     <CorrectionFeedback />
//   </CardBody>
// </ExerciseItemCard>

interface ItemState {
  userInputs: Record<string, string>;
  selfChecked: Record<string, boolean>;
  isVerified: boolean;
}

interface ItemActions {
  onInputChange: (key: string, value: string) => void;
  onSelfCheck: (key: string, matches: boolean) => void;
}

export interface ExerciseItemCardProps {
  item: string | StructuredExerciseItem;
  itemIdx: number;
  type?: "closed_blank" | "multiple_choice" | "open_response" | "self_check";
  rawAnswer?: string | string[] | BlankDefinition[];
  state: ItemState;
  actions: ItemActions;
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="block">
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CrossIcon = () => (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="block">
    <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ExerciseItemCard({
  item,
  itemIdx,
  type,
  rawAnswer,
  state,
  actions,
}: ExerciseItemCardProps) {
  const { userInputs, selfChecked, isVerified } = state;
  const { onInputChange, onSelfCheck } = actions;
  const { speak } = useSpeakWord();

  const promptText = typeof item === "string" ? item : item.prompt;
  const parts = promptText.split(/_{3,}/);
  const isRewrite = parts.length === 1 || type === "open_response" || type === "self_check";
  const ttsText = promptText.replace(/_{2,}/g, "").replace(/\([^)]*\)/g, "").trim();

  const inputKey = `${itemIdx}-0`;
  const userVal = userInputs[inputKey] ?? "";
  const modelAnswer =
    typeof item !== "string" && item.sampleAnswer
      ? item.sampleAnswer
      : typeof rawAnswer === "string"
      ? rawAnswer
      : "";
  const isExactMatch = checkAnswer(userVal, modelAnswer);
  const isSelfApproved = selfChecked[inputKey];

  const blanksCount = parts.length - 1;
  const blankAnswers = resolveBlankAnswers(rawAnswer, blanksCount);
  const allBlanksCorrect =
    !isRewrite &&
    Array.from({ length: blanksCount }).every((_, bIdx) =>
      checkAnswer(userInputs[`${itemIdx}-${bIdx}`] ?? "", blankAnswers[bIdx] ?? blankAnswers[0])
    );

  const isItemCorrect = isRewrite ? isExactMatch || isSelfApproved : allBlanksCorrect;

  return (
    <div
      className={cn(
        "mini-lessons__exercise-item-container",
        "w-full flex flex-col gap-3 p-4 sm:p-5 rounded-xl border bg-surface-raised transition-all",
        isVerified && isItemCorrect
          ? "border-success/30"
          : isVerified
          ? "border-error/30"
          : "border-border-subtle hover:border-border-default"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {isVerified && isItemCorrect ? (
            <span className="w-6 h-6 rounded-md bg-success/15 border border-success/30 text-success flex items-center justify-center shrink-0" aria-label="Correcto">
              <CheckIcon />
            </span>
          ) : isVerified && !isItemCorrect ? (
            <span className="w-6 h-6 rounded-md bg-error/15 border border-error/30 text-error flex items-center justify-center shrink-0" aria-label="Incorrecto">
              <CrossIcon />
            </span>
          ) : (
            <span className="w-6 h-6 rounded-md bg-surface-sunken border border-border-subtle text-fg-muted font-mono text-tiny font-bold flex items-center justify-center shrink-0" aria-hidden="true">
              {itemIdx + 1}
            </span>
          )}

          {isRewrite ? (
            <p className="mini-lessons__exercise-prompt font-semibold text-body text-fg truncate m-0">{promptText}</p>
          ) : (
            <span className="font-semibold text-body-sm text-fg-muted">Pregunta {itemIdx + 1}</span>
          )}
        </div>

        {ttsText && (
          <ListenButton iconOnly onPlay={() => speak(ttsText)} aria-label={`Escuchar "${ttsText}"`} />
        )}
      </div>

      {isRewrite ? (
        <div className="flex flex-col gap-2 w-full">
          <input
            type="text"
            className={cn(
              "mini-lessons__exercise-input",
              "mini-lessons__exercise-input--rewrite",
              "w-full px-3.5 py-2.5 rounded-lg bg-surface-sunken border text-body text-fg placeholder:text-fg-muted/60 transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
              !isVerified && "border-border-default",
              isVerified && (isItemCorrect
                ? "mini-lessons__exercise-input--correct border-success ring-1 ring-success/30 text-success"
                : "mini-lessons__exercise-input--incorrect border-error ring-1 ring-error/30 text-error")
            )}
            value={userVal}
            onChange={(e) => onInputChange(inputKey, e.target.value)}
            disabled={isVerified}
            placeholder="Escribe tu respuesta..."
          />

          {isVerified && modelAnswer && (
            <div className="mt-1 flex flex-col gap-1.5 rounded-lg bg-surface-sunken p-3 text-caption border border-border-subtle/50">
              <p className="mini-lessons__exercise-correction m-0 text-fg-muted">
                Respuesta sugerida: <strong className="mini-lessons__correction-highlight text-success font-mono font-semibold">{modelAnswer}</strong>
              </p>
              {!isExactMatch && !isSelfApproved && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-fg-muted">¿Tu respuesta expresa lo mismo?</span>
                  <button
                    type="button"
                    onClick={() => onSelfCheck(inputKey, true)}
                    className="rounded border border-primary/40 bg-primary-soft px-2 py-0.5 font-label text-tiny font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    Sí, es equivalente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mini-lessons__exercise-content text-body leading-relaxed text-fg">
          <p className="mini-lessons__exercise-prompt m-0">
            {parts.map((part, partIdx) => {
              if (partIdx === parts.length - 1) return <span key={partIdx}>{part}</span>;

              const blankKey = `${itemIdx}-${partIdx}`;
              const bVal = userInputs[blankKey] ?? "";
              const expectedTarget = blankAnswers[partIdx] ?? blankAnswers[0];
              const isBlankCorrect = isVerified && checkAnswer(bVal, expectedTarget);

              const hintDisplay =
                typeof expectedTarget === "string"
                  ? expectedTarget
                  : Array.isArray(expectedTarget)
                  ? (expectedTarget as (string | BlankDefinition)[]).map((t) => (typeof t === "string" ? t : t.accepted.join("/"))).join(" / ")
                  : (expectedTarget as BlankDefinition | undefined)?.accepted?.join(" / ") ?? "";

              const inputWidth = Math.max(hintDisplay.length + 2, 8);

              return (
                <span key={partIdx} className="mini-lessons__inline-input-wrapper inline-flex items-center flex-wrap">
                  {part}
                  <input
                    type="text"
                    className={cn(
                      "mini-lessons__exercise-input",
                      "mini-lessons__exercise-input--inline",
                      "mx-1 px-2 py-0.5 rounded-md bg-surface-sunken border text-body text-fg transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
                      !isVerified && "border-border-default",
                      isVerified && (isBlankCorrect ? "mini-lessons__exercise-input--correct border-success text-success" : "mini-lessons__exercise-input--incorrect border-error text-error")
                    )}
                    style={{ width: `${inputWidth}ch` }}
                    value={bVal}
                    onChange={(e) => onInputChange(blankKey, e.target.value)}
                    disabled={isVerified}
                    placeholder="..."
                  />
                  {isVerified && (
                    <span className={cn("mini-lessons__feedback-inline inline-flex items-center gap-1 text-caption", isBlankCorrect ? "mini-lessons__feedback-inline--correct text-success" : "mini-lessons__feedback-inline--incorrect text-error")}>
                      {isBlankCorrect ? <CheckIcon /> : <CrossIcon />}
                      {!isBlankCorrect && <span className="mini-lessons__correct-hint font-mono font-semibold">({hintDisplay})</span>}
                    </span>
                  )}
                </span>
              );
            })}
          </p>
        </div>
      )}
    </div>
  );
}
