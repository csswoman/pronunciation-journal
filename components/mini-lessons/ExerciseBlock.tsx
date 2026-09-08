"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import ExerciseItemCard from "./ExerciseItemCard";

// Planned structure:
// <ExerciseBlock>
//   <ExerciseBadge />
//   <ExerciseInstructionHeading />
//   <ExerciseCardsList>
//     <ExerciseItemCard />
//   </ExerciseCardsList>
//   <ExerciseActions>
//     <ScoreSummary />
//     <VerifyButton /> | <ResetButton />
//   </ExerciseActions>
//   <SectionArrowDivider />
// </ExerciseBlock>

export interface BlankDefinition {
  accepted: string[];
  hint?: string;
}

export interface StructuredExerciseItem {
  prompt: string;
  blanks?: BlankDefinition[];
  options?: string[];
  correct?: number;
  sampleAnswer?: string;
  explanation?: string;
}

export interface ExerciseBlockProps {
  instruction: string;
  type?: "closed_blank" | "multiple_choice" | "open_response" | "self_check";
  items: Array<string | StructuredExerciseItem>;
  answers?: Array<string | string[] | BlankDefinition[]>;
}

import {
  checkAnswer,
  resolveBlankAnswers,
} from "@/lib/content/exercise-evaluator";

export { checkAnswer, resolveBlankAnswers };


function getExerciseBadgeLabel(instruction: string, type?: string, hasBlanks?: boolean): string {
  if (type === "open_response") return "Escritura";
  if (type === "closed_blank") return "Completar";
  if (type === "multiple_choice") return "Opción múltiple";
  if (type === "self_check") return "Autoevaluación";

  const lower = instruction.toLowerCase();
  if (
    lower.includes("transcribe") ||
    lower.includes("escribe") ||
    lower.includes("write") ||
    lower.includes("fonemic") ||
    lower.includes("phonemic")
  ) {
    return "Escritura";
  }
  if (hasBlanks || lower.includes("fill") || lower.includes("completa")) {
    return "Completar";
  }
  return "Escritura";
}

export default function ExerciseBlock({
  instruction,
  type,
  items,
  answers = [],
}: ExerciseBlockProps) {
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [selfChecked, setSelfChecked] = useState<Record<string, boolean>>({});
  const [isVerified, setIsVerified] = useState(false);

  function handleInputChange(key: string, value: string) {
    setUserInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleSelfCheck(key: string, matches: boolean) {
    setSelfChecked((prev) => ({ ...prev, [key]: matches }));
  }

  function handleVerify() {
    setIsVerified(true);
  }

  function handleReset() {
    setUserInputs({});
    setSelfChecked({});
    setIsVerified(false);
  }

  let totalInputsCount = 0;
  let correctInputsCount = 0;
  let hasBlanks = false;

  items.forEach((item, itemIdx) => {
    const promptText = typeof item === "string" ? item : item.prompt;
    const parts = promptText.split(/_{3,}/);
    const rawAnswer = answers[itemIdx];

    if (parts.length > 1) {
      hasBlanks = true;
    }

    if (parts.length === 1 || type === "open_response" || type === "self_check") {
      totalInputsCount++;
      const userVal = userInputs[`${itemIdx}-0`] ?? "";
      const isSelfApproved = selfChecked[`${itemIdx}-0`];
      const modelAnswer =
        typeof item !== "string" && item.sampleAnswer
          ? item.sampleAnswer
          : typeof rawAnswer === "string"
          ? rawAnswer
          : "";
      if (isSelfApproved || (modelAnswer && checkAnswer(userVal, modelAnswer))) {
        correctInputsCount++;
      }
    } else {
      const blanksCount = parts.length - 1;
      const blankAnswers = resolveBlankAnswers(rawAnswer, blanksCount);

      for (let bIdx = 0; bIdx < blanksCount; bIdx++) {
        totalInputsCount++;
        const userVal = userInputs[`${itemIdx}-${bIdx}`] ?? "";
        const expected = blankAnswers[bIdx] ?? blankAnswers[0];
        if (checkAnswer(userVal, expected)) {
          correctInputsCount++;
        }
      }
    }
  });

  const scorePct = totalInputsCount > 0 ? (correctInputsCount / totalInputsCount) * 100 : 0;
  const isGoodScore = scorePct >= 85;
  const isMidScore = scorePct >= 60 && scorePct < 85;
  const badgeLabel = getExerciseBadgeLabel(instruction, type, hasBlanks);

  return (
    <div className="mini-lessons__block flex flex-col gap-4 mb-6">
      {/* Exercise badge & instruction heading */}
      <div className="flex flex-col gap-2">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-tiny font-semibold tracking-wide bg-primary-soft text-primary border border-primary/20">
            {badgeLabel}
          </span>
        </div>
        <h3 className="mini-lessons__block-label text-h4 font-bold text-fg leading-snug tracking-tight m-0">
          {instruction}
        </h3>
      </div>

      {/* List of decoupled item cards */}
      <div className="mini-lessons__exercise-list flex flex-col gap-3">
        {items.map((item, itemIdx) => (
          <ExerciseItemCard
            key={itemIdx}
            item={item}
            itemIdx={itemIdx}
            type={type}
            rawAnswer={answers[itemIdx]}
            state={{ userInputs, selfChecked, isVerified }}
            actions={{ onInputChange: handleInputChange, onSelfCheck: handleSelfCheck }}
          />
        ))}
      </div>

      {/* Action area: Verify button / Score & Reset */}
      {(answers.length > 0 ||
        items.some((item) => typeof item !== "string" && (item.sampleAnswer || item.blanks))) && (
        <div className="mini-lessons__exercise-actions flex items-center justify-between gap-3 pt-2">
          {isVerified ? (
            <>
              <div
                className={cn(
                  "mini-lessons__exercise-summary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-caption font-semibold",
                  isGoodScore && "mini-lessons__exercise-summary--good bg-success-soft text-success border border-success-border",
                  isMidScore && "mini-lessons__exercise-summary--mid bg-warning-soft text-warning border border-warning-border",
                  !isGoodScore && !isMidScore && "mini-lessons__exercise-summary--low bg-error-soft text-error border border-error-border"
                )}
              >
                <span>
                  Puntuación: {correctInputsCount} de {totalInputsCount} correctas (
                  {Math.round(scorePct)}%)
                </span>
              </div>
              <Button variant="ghost" onClick={handleReset}>
                Restablecer
              </Button>
            </>
          ) : (
            <>
              <div />
              <Button variant="primary" onClick={handleVerify} className="px-6 py-2 rounded-lg font-semibold">
                Verificar
              </Button>
            </>
          )}
        </div>
      )}

      {/* Down arrow rhythm divider */}
      <div className="flex items-center justify-center pt-2 text-fg-muted/40" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 3v10M4 9l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
