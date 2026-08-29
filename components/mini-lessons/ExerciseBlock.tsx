"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="block">
    <path
      d="M2 6l3 3 5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CrossIcon = () => (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="block">
    <path
      d="M2 2l8 8M10 2L2 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡'’"]/g, "");
}

function normalizeContractions(s: string): string {
  return s
    .replace(/\bdo not\b/g, "dont")
    .replace(/\bdoes not\b/g, "doesnt")
    .replace(/\bdid not\b/g, "didnt")
    .replace(/\bwould not\b/g, "wouldnt")
    .replace(/\bwill not\b/g, "wont")
    .replace(/\bcannot\b/g, "cant")
    .replace(/\bis not\b/g, "isnt")
    .replace(/\bare not\b/g, "arent")
    .replace(/\bhave not\b/g, "havent")
    .replace(/\bhas not\b/g, "hasnt")
    .replace(/\b'm\b/g, "am")
    .replace(/\b're\b/g, "are")
    .replace(/\b've\b/g, "have")
    .replace(/\b'll\b/g, "will")
    .replace(/\b'd\b/g, "would");
}

export function checkAnswer(
  userVal: string,
  correctTarget: string | string[] | BlankDefinition | undefined
): boolean {
  if (!correctTarget) return false;

  const normalizedUser = normalize(userVal);
  const normalizedUserContractions = normalizeContractions(normalizedUser);

  // Extract list of accepted candidate strings
  let acceptedList: string[] = [];
  if (typeof correctTarget === "string") {
    const clean = correctTarget.replace(/\([^)]*\)/g, "");
    // If it contains slash alternatives for a single blank, split them
    acceptedList = clean.split("/").map((s) => s.trim());
  } else if (Array.isArray(correctTarget)) {
    acceptedList = correctTarget.flatMap((item) =>
      typeof item === "string" ? [item] : (item as BlankDefinition).accepted ?? []
    );
  } else if (typeof correctTarget === "object" && "accepted" in correctTarget) {
    acceptedList = correctTarget.accepted;
  }

  return acceptedList.some((candidate) => {
    const norm = normalize(candidate);
    const normContractions = normalizeContractions(norm);
    return (
      norm === normalizedUser ||
      normContractions === normalizedUser ||
      norm === normalizedUserContractions ||
      normContractions === normalizedUserContractions
    );
  });
}

function resolveBlankAnswers(
  rawAnswer: string | string[] | BlankDefinition[] | undefined,
  blanksCount: number
): Array<string | string[] | BlankDefinition> {
  if (!rawAnswer) return [];

  if (Array.isArray(rawAnswer)) {
    // If it's already an array matching the number of blanks, return per blank
    if (rawAnswer.length === blanksCount) {
      return rawAnswer;
    }
    return rawAnswer;
  }

  if (typeof rawAnswer === "string") {
    // Check if explicit double-slash "//" was used to separate blanks
    if (rawAnswer.includes("//")) {
      return rawAnswer.split("//").map((s) => s.trim());
    }
    // Legacy slash split if multiple blanks
    if (blanksCount > 1 && rawAnswer.includes("/")) {
      const parts = rawAnswer.split("/").map((s) => s.trim());
      if (parts.length === blanksCount) {
        return parts;
      }
    }
    return [rawAnswer.trim()];
  }

  return [rawAnswer];
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

  items.forEach((item, itemIdx) => {
    const promptText = typeof item === "string" ? item : item.prompt;
    const parts = promptText.split(/_{3,}/);
    const rawAnswer = answers[itemIdx];

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

  return (
    <div className="mini-lessons__block">
      <p className="mini-lessons__block-label">{instruction}</p>

      <div className="mini-lessons__exercise-list">
        {items.map((item, itemIdx) => {
          const promptText = typeof item === "string" ? item : item.prompt;
          const parts = promptText.split(/_{3,}/);
          const rawAnswer = answers[itemIdx];

          // Render rewrite / open / self-check item (no blanks or explicitly open)
          if (parts.length === 1 || type === "open_response" || type === "self_check") {
            const inputKey = `${itemIdx}-0`;
            const userVal = userInputs[inputKey] ?? "";
            const modelAnswer =
              typeof item !== "string" && item.sampleAnswer
                ? item.sampleAnswer
                : typeof rawAnswer === "string"
                ? rawAnswer
                : "";
            const isExactMatch = isVerified && checkAnswer(userVal, modelAnswer);
            const isSelfChecked = selfChecked[inputKey];
            const isCorrect = isExactMatch || isSelfChecked;

            return (
              <div key={itemIdx} className="mini-lessons__exercise-item-container">
                <div className="mini-lessons__exercise-marker" aria-hidden="true">
                  <span className="mini-lessons__exercise-number">{itemIdx + 1}</span>
                </div>
                <div className="mini-lessons__exercise-content">
                  <p className="mini-lessons__exercise-prompt">{promptText}</p>
                  <div className="mini-lessons__exercise-input-row">
                    <input
                      type="text"
                      className={cn(
                        "mini-lessons__exercise-input",
                        "mini-lessons__exercise-input--rewrite",
                        isVerified &&
                          (isCorrect
                            ? "mini-lessons__exercise-input--correct"
                            : "mini-lessons__exercise-input--incorrect")
                      )}
                      value={userVal}
                      onChange={(e) => handleInputChange(inputKey, e.target.value)}
                      disabled={isVerified}
                      placeholder="Escribe tu respuesta..."
                    />
                    {isVerified && (
                      <span
                        className={cn(
                          "mini-lessons__feedback-icon",
                          isCorrect
                            ? "mini-lessons__feedback-icon--correct"
                            : "mini-lessons__feedback-icon--incorrect"
                        )}
                      >
                        {isCorrect ? <CheckIcon /> : <CrossIcon />}
                      </span>
                    )}
                  </div>

                  {isVerified && modelAnswer && (
                    <div className="mt-2 flex flex-col gap-2 rounded-lg bg-surface-sunken p-3 text-caption">
                      <p className="mini-lessons__exercise-correction">
                        Respuesta sugerida:{" "}
                        <strong className="mini-lessons__correction-highlight">{modelAnswer}</strong>
                      </p>
                      {!isExactMatch && !isSelfChecked && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-fg-muted">¿Tu respuesta expresa lo mismo?</span>
                          <button
                            type="button"
                            onClick={() => handleSelfCheck(inputKey, true)}
                            className="rounded border border-primary/40 bg-primary-soft px-2 py-0.5 font-label text-tiny font-semibold text-primary hover:bg-primary/20"
                          >
                            Sí, es equivalente
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Render fill-in-the-blanks item
          const blanksCount = parts.length - 1;
          const blankAnswers = resolveBlankAnswers(rawAnswer, blanksCount);

          return (
            <div key={itemIdx} className="mini-lessons__exercise-item-container">
              <div className="mini-lessons__exercise-marker" aria-hidden="true">
                <span className="mini-lessons__exercise-number">{itemIdx + 1}</span>
              </div>
              <div className="mini-lessons__exercise-content">
                <p className="mini-lessons__exercise-prompt">
                  {parts.map((part, partIdx) => {
                    const isLast = partIdx === parts.length - 1;
                    if (isLast) {
                      return <span key={partIdx}>{part}</span>;
                    }

                    const inputKey = `${itemIdx}-${partIdx}`;
                    const userVal = userInputs[inputKey] ?? "";
                    const expectedTarget = blankAnswers[partIdx] ?? blankAnswers[0];
                    const isCorrect = isVerified && checkAnswer(userVal, expectedTarget);

                    const hintDisplay =
                      typeof expectedTarget === "string"
                        ? expectedTarget
                        : Array.isArray(expectedTarget)
                        ? (expectedTarget as (string | BlankDefinition)[])
                            .map((t) => (typeof t === "string" ? t : (t as BlankDefinition).accepted.join("/")))
                            .join(" / ")
                        : (expectedTarget as BlankDefinition | undefined)?.accepted?.join(" / ") ?? "";

                    const inputWidth = Math.max(hintDisplay.length + 2, 8);

                    return (
                      <span key={partIdx} className="mini-lessons__inline-input-wrapper">
                        {part}
                        <input
                          type="text"
                          className={cn(
                            "mini-lessons__exercise-input",
                            "mini-lessons__exercise-input--inline",
                            isVerified &&
                              (isCorrect
                                ? "mini-lessons__exercise-input--correct"
                                : "mini-lessons__exercise-input--incorrect")
                          )}
                          style={{ width: `${inputWidth}ch` }}
                          value={userVal}
                          onChange={(e) => handleInputChange(inputKey, e.target.value)}
                          disabled={isVerified}
                          placeholder="..."
                        />
                        {isVerified && (
                          <span
                            className={cn(
                              "mini-lessons__feedback-inline",
                              isCorrect
                                ? "mini-lessons__feedback-inline--correct"
                                : "mini-lessons__feedback-inline--incorrect"
                            )}
                          >
                            {isCorrect ? <CheckIcon /> : <CrossIcon />}
                            {!isCorrect && (
                              <span className="mini-lessons__correct-hint">({hintDisplay})</span>
                            )}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {(answers.length > 0 ||
        items.some((item) => typeof item !== "string" && (item.sampleAnswer || item.blanks))) && (
        <div className="mini-lessons__exercise-actions">
          {isVerified ? (
            <>
              <div
                className={cn(
                  "mini-lessons__exercise-summary",
                  isGoodScore && "mini-lessons__exercise-summary--good",
                  isMidScore && "mini-lessons__exercise-summary--mid",
                  !isGoodScore && !isMidScore && "mini-lessons__exercise-summary--low"
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
              <Button onClick={handleVerify}>
                Verificar
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
